import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, mkdir, readFile, writeFile, access } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ensureConfig } from "../src/commands/init.js";
import { getOrganizationDoctorLines } from "../src/commands/doctor.js";
import { organizeCommand } from "../src/commands/organize.js";
import { createWorkUnit } from "../src/orchestration/workUnit.js";
import { inferDocumentationImpact, scanDocumentationSignals } from "../src/organization/documentationSignals.js";
import {
  analyzeProjectOrganization,
  applyOrganizationSuggestions,
  classifyTechnicalDocument,
  loadOrganizationConfig
} from "../src/organization/projectOrganization.js";

const execFileAsync = promisify(execFile);

async function project(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "orch-org-"));
  await mkdir(path.join(dir, ".orch"), { recursive: true });
  await writeFile(path.join(dir, ".orch", "config.json"), JSON.stringify({ version: 1 }, null, 2) + "\n");
  return dir;
}

async function pathExists(target: string): Promise<boolean> {
  try { await access(target); return true; } catch { return false; }
}

async function captureLogs(run: () => Promise<number>): Promise<{ code: number; output: string }> {
  const lines: string[] = [];
  const original = console.log;
  console.log = (...args: unknown[]) => lines.push(args.map(String).join(" "));
  try { return { code: await run(), output: lines.join("\n") }; }
  finally { console.log = original; }
}

test("organization config defaults are merged without overwriting custom values", async () => {
  const dir = await project();
  const configPath = path.join(dir, ".orch", "config.json");
  await writeFile(configPath, JSON.stringify({ organization: { enabled: false, docs: { root: "technical-docs" } }, custom: "kept" }, null, 2) + "\n");
  await ensureConfig(configPath);
  const parsed = JSON.parse(await readFile(configPath, "utf8"));
  assert.equal(parsed.organization.enabled, false);
  assert.equal(parsed.organization.docs.root, "technical-docs");
  assert.equal(parsed.organization.docs.enabled, true);
  assert.equal(parsed.custom, "kept");
  const loaded = await loadOrganizationConfig(dir);
  assert.equal(loaded.config.docs.root, "technical-docs");
});

test("organization and docs governance can be disabled independently", async () => {
  const dir = await project();
  const configPath = path.join(dir, ".orch", "config.json");
  await writeFile(configPath, JSON.stringify({ organization: { enabled: true, docs: { enabled: false } } }));
  assert.equal((await analyzeProjectOrganization(dir)).enabled, false);
  assert.deepEqual(await getOrganizationDoctorLines(dir), ["SKIP Project organization checks disabled by configuration."]);
});

test("classifier is deterministic and conservative", () => {
  const cases: Array<[string, string]> = [
    ["API.md", "api"],
    ["technical-architecture.md", "architecture"],
    ["database-schema.md", "database"],
    ["SUPABASE_MCP_SETUP.md", "setup"],
    ["production-deployment.md", "deployment"],
    ["TROUBLESHOOTING.md", "operations"],
    ["PRD.md", "product"]
  ];
  for (const [file, category] of cases) {
    const result = classifyTechnicalDocument(file);
    assert.equal(result.category, category);
    assert.equal(result.safeToMove, true);
  }
  const notes = classifyTechnicalDocument("NOTES.md");
  assert.equal(notes.category, null);
  assert.equal(notes.safeToMove, false);
});

test("scanner protects root entry documents and never scans openspec content", async () => {
  const dir = await project();
  await mkdir(path.join(dir, "openspec"), { recursive: true });
  await writeFile(path.join(dir, "README.md"), "readme");
  await writeFile(path.join(dir, "AGENTS.md"), "agents");
  await writeFile(path.join(dir, "CHANGELOG.md"), "changes");
  await writeFile(path.join(dir, "API.md"), "api");
  await writeFile(path.join(dir, "NOTES.md"), "notes");
  await writeFile(path.join(dir, "openspec", "API.md"), "openspec api");
  const report = await analyzeProjectOrganization(dir);
  assert.equal(report.docsExists, false);
  assert.deepEqual(report.suggestions.map((item) => item.source), ["API.md", "NOTES.md"]);
  assert.equal(report.suggestions[0]?.destination, "docs/api/api.md");
});

test("scanner respects disabled organization and custom docs root", async () => {
  const dir = await project();
  await writeFile(path.join(dir, ".orch", "config.json"), JSON.stringify({ organization: { enabled: false } }));
  assert.equal((await analyzeProjectOrganization(dir)).enabled, false);
  await writeFile(path.join(dir, ".orch", "config.json"), JSON.stringify({ organization: { docs: { root: "reference" } } }));
  await writeFile(path.join(dir, "API.md"), "api");
  const report = await analyzeProjectOrganization(dir);
  assert.equal(report.suggestions[0]?.destination, "reference/api/api.md");
});

test("organize dry run does not modify the filesystem", async () => {
  const dir = await project();
  await writeFile(path.join(dir, "API.md"), "api bytes\n");
  const result = await captureLogs(() => organizeCommand({}, dir));
  assert.equal(result.code, 0);
  assert.equal(await readFile(path.join(dir, "API.md"), "utf8"), "api bytes\n");
  assert.equal(await pathExists(path.join(dir, "docs", "api", "api.md")), false);
});

test("organize --json returns machine-readable report without filesystem changes", async () => {
  const dir = await project();
  await writeFile(path.join(dir, "API.md"), "api");
  const result = await captureLogs(() => organizeCommand({ json: true }, dir));
  const parsed = JSON.parse(result.output);
  assert.equal(result.code, 0);
  assert.equal(parsed.command, "organize");
  assert.equal(parsed.mode, "dry-run");
  assert.equal(parsed.summary.safeMoves, 1);
  assert.equal(parsed.report.suggestions[0].source, "API.md");
  assert.equal(await pathExists(path.join(dir, "docs", "api", "api.md")), false);
});

test("organize --check fails only for high-confidence safe-move violations", async () => {
  const dir = await project();
  await writeFile(path.join(dir, "NOTES.md"), "notes");
  assert.equal((await captureLogs(() => organizeCommand({ check: true }, dir))).code, 0);
  await writeFile(path.join(dir, "API.md"), "api");
  const checked = await captureLogs(() => organizeCommand({ check: true, json: true }, dir));
  assert.equal(checked.code, 1);
  assert.equal(JSON.parse(checked.output).exitCode, 1);
});

test("apply moves only safe files, preserves bytes, handles conflicts, and is idempotent", async () => {
  const dir = await project();
  const bytes = "# API\n\nexact content\n";
  await writeFile(path.join(dir, "API.md"), bytes);
  await writeFile(path.join(dir, "NOTES.md"), "manual");
  const first = await applyOrganizationSuggestions(dir);
  assert.equal(first.moved.length, 1);
  assert.equal(await readFile(path.join(dir, "docs", "api", "api.md"), "utf8"), bytes);
  assert.equal(await readFile(path.join(dir, "NOTES.md"), "utf8"), "manual");
  const second = await applyOrganizationSuggestions(dir);
  assert.equal(second.moved.length, 0);

  await writeFile(path.join(dir, "API.md"), "new source");
  const conflict = await applyOrganizationSuggestions(dir);
  assert.equal(conflict.conflicts.length, 1);
  assert.equal(await readFile(path.join(dir, "API.md"), "utf8"), "new source");
  assert.equal(await readFile(path.join(dir, "docs", "api", "api.md"), "utf8"), bytes);
});

test("invalid or unsafe config prevents organization mutation", async () => {
  const dir = await project();
  await writeFile(path.join(dir, "API.md"), "api");
  await writeFile(path.join(dir, ".orch", "config.json"), "{bad json");
  const invalid = await applyOrganizationSuggestions(dir);
  assert.match(invalid.report.configError ?? "", /Invalid/);
  assert.equal(await pathExists(path.join(dir, "API.md")), true);

  await writeFile(path.join(dir, ".orch", "config.json"), JSON.stringify({ organization: { docs: { root: "../outside" } } }));
  const unsafe = await applyOrganizationSuggestions(dir);
  assert.match(unsafe.report.configError ?? "", /inside the project/);
  assert.equal(await pathExists(path.join(dir, "API.md")), true);
});

test("documentation impact inference is conservative and automatic for writable WorkUnits", () => {
  const impact = inferDocumentationImpact(["src/api/routes.ts", "prisma/schema.prisma", "Dockerfile", "src/ui/Button.tsx"]);
  assert.deepEqual(impact?.paths, ["docs/api/", "docs/database/", "docs/deployment/"]);
  const work = createWorkUnit({
    id: "wu-auto",
    sourceTaskRef: "openspec:task-auto",
    objective: "Change API and schema",
    filesHint: ["src/controllers/users.ts", "db/migrations/001.sql"],
    risk: "medium",
    complexity: "medium",
    requiresWrites: true,
    requiresCommands: false
  });
  assert.deepEqual(work.documentationImpact?.paths, ["docs/api/", "docs/database/"]);
  const readOnly = createWorkUnit({
    id: "wu-read",
    sourceTaskRef: "openspec:task-read",
    objective: "Inspect API",
    filesHint: ["src/api/routes.ts"],
    risk: "low",
    complexity: "small",
    requiresWrites: false,
    requiresCommands: false
  });
  assert.equal(readOnly.documentationImpact, undefined);
});

test("explicit WorkUnit documentation impact overrides inference and deduplicates paths", () => {
  const work = createWorkUnit({
    id: "wu-1",
    sourceTaskRef: "openspec:task-1",
    objective: "Implement API behavior",
    filesHint: ["src/api/routes.ts"],
    risk: "low",
    complexity: "small",
    requiresWrites: true,
    requiresCommands: false,
    documentationImpact: { required: true, paths: ["docs/custom/api.md", "docs/custom/api.md", ""], reasons: ["explicit", "explicit"] }
  });
  assert.deepEqual(work.documentationImpact, { required: true, paths: ["docs/custom/api.md"], reasons: ["explicit"] });
});

test("doctor warns when implementation signals exist without category docs", async () => {
  const dir = await project();
  await mkdir(path.join(dir, "openspec"));
  await mkdir(path.join(dir, "docs"));
  await mkdir(path.join(dir, "src", "api"), { recursive: true });
  await writeFile(path.join(dir, "src", "api", "routes.ts"), "export {};");
  const signals = await scanDocumentationSignals(dir);
  assert.equal(signals.find((item) => item.area === "api")?.docsPresent, false);
  let lines = await getOrganizationDoctorLines(dir);
  assert.ok(lines.some((line) => line.includes("api implementation detected") && line.includes("docs/api/")));

  await mkdir(path.join(dir, "docs", "api"), { recursive: true });
  await writeFile(path.join(dir, "docs", "api", "reference.md"), "# API");
  lines = await getOrganizationDoctorLines(dir);
  assert.equal(lines.some((line) => line.includes("api implementation detected but no")), false);
});

test("doctor organization output warns without treating hygiene findings as errors", async () => {
  const dir = await project();
  await mkdir(path.join(dir, "openspec"));
  await mkdir(path.join(dir, "docs"));
  let lines = await getOrganizationDoctorLines(dir);
  assert.ok(lines.some((line) => line.startsWith("PASS OpenSpec")));
  assert.ok(lines.some((line) => line.startsWith("PASS docs/")));
  await writeFile(path.join(dir, "API.md"), "api");
  lines = await getOrganizationDoctorLines(dir);
  assert.ok(lines.some((line) => line.includes("WARN Technical document") && line.includes("API.md")));
  assert.equal(lines.some((line) => line.startsWith("ERROR")), false);
});

test("CLI help registers orch organize apply check and json flags", async () => {
  const cli = path.join(process.cwd(), "src", "cli.ts");
  const help = await execFileAsync(process.execPath, ["--import", "tsx", cli, "--help"], { cwd: process.cwd() });
  assert.match(help.stdout, /organize/);
  const organizeHelp = await execFileAsync(process.execPath, ["--import", "tsx", cli, "organize", "--help"], { cwd: process.cwd() });
  assert.match(organizeHelp.stdout, /--apply/);
  assert.match(organizeHelp.stdout, /--check/);
  assert.match(organizeHelp.stdout, /--json/);
});
