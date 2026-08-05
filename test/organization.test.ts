import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, access } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ensureConfig } from "../src/commands/init.js";
import { getOrganizationDoctorLines } from "../src/commands/doctor.js";
import { organizeCommand } from "../src/commands/organize.js";
import {
  analyzeProjectOrganization,
  applyOrganizationSuggestions,
  classifyTechnicalDocument,
  loadOrganizationConfig
} from "../src/organization/projectOrganization.js";

async function project(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "orch-org-"));
  await mkdir(path.join(dir, ".orch"), { recursive: true });
  await writeFile(path.join(dir, ".orch", "config.json"), JSON.stringify({ version: 1 }, null, 2) + "\n");
  return dir;
}

async function pathExists(target: string): Promise<boolean> {
  try { await access(target); return true; } catch { return false; }
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
  const original = console.log;
  console.log = () => {};
  try { await organizeCommand({}, dir); } finally { console.log = original; }
  assert.equal(await readFile(path.join(dir, "API.md"), "utf8"), "api bytes\n");
  assert.equal(await pathExists(path.join(dir, "docs", "api", "api.md")), false);
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
