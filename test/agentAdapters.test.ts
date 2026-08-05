import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ORCH_MANAGED_MARKER } from "../src/core/managedFiles.js";
import { CodexAdapter } from "../src/agents/codex.js";
import { AntigravityAdapter } from "../src/agents/antigravity.js";

test("CodexAdapter preserves existing Codex asset locations", async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "orch-codex-adapter-"));
  const adapter = new CodexAdapter();
  const results = await adapter.install(cwd);
  assert.equal(results.length, 4);
  const file = path.join(cwd, ".codex", "skills", "orch-execute", "SKILL.md");
  assert.ok((await readFile(file, "utf8")).startsWith(ORCH_MANAGED_MARKER));
  assert.equal(await adapter.detect(cwd), true);
});

test("AntigravityAdapter preserves existing workflow locations", async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "orch-antigravity-adapter-"));
  const adapter = new AntigravityAdapter();
  const results = await adapter.install(cwd);
  assert.equal(results.length, 4);
  const file = path.join(cwd, ".agents", "workflows", "orch-execute.md");
  assert.ok((await readFile(file, "utf8")).startsWith(ORCH_MANAGED_MARKER));
  assert.equal(await adapter.detect(cwd), true);
});
