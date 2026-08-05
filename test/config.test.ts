import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ensureConfig } from "../src/commands/init.js";

test("ensureConfig preserves custom values and adds missing defaults", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "orch-config-"));
  const orchDir = path.join(dir, ".orch");
  await mkdir(orchDir, { recursive: true });
  const file = path.join(orchDir, "config.json");
  await writeFile(file, JSON.stringify({ tokenOptimization: { llmlingua: { minimumTokens: 12345 } }, custom: true }, null, 2) + "\n");

  const result = await ensureConfig(file);
  const parsed = JSON.parse(await readFile(file, "utf8"));
  assert.equal(result.updated, true);
  assert.equal(parsed.tokenOptimization.llmlingua.minimumTokens, 12345);
  assert.equal(parsed.tokenOptimization.enabled, true);
  assert.equal(parsed.custom, true);

  const second = await ensureConfig(file);
  assert.equal(second.updated, false);
});

test("ensureConfig preserves invalid JSON", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "orch-invalid-"));
  const file = path.join(dir, "config.json");
  await writeFile(file, "{bad json", "utf8");

  const result = await ensureConfig(file);
  assert.equal(result.invalid, true);
  assert.equal(await readFile(file, "utf8"), "{bad json");
});
