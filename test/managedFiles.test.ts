import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ORCH_MANAGED_MARKER, writeManagedFile } from "../src/core/managedFiles.js";

test("managed files are created, updated, and then unchanged", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "orch-managed-"));
  const file = path.join(dir, "nested", "orch.md");

  assert.equal(await writeManagedFile(file, "one\n"), "created");
  assert.equal(await writeManagedFile(file, "two\n"), "updated");
  assert.equal(await writeManagedFile(file, "two\n"), "unchanged");
  assert.ok((await readFile(file, "utf8")).startsWith(ORCH_MANAGED_MARKER));
});

test("user-authored files are never overwritten", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "orch-user-"));
  const file = path.join(dir, "orch.md");
  await writeFile(file, "user content\n", "utf8");

  assert.equal(await writeManagedFile(file, "orch content\n"), "skipped-user-file");
  assert.equal(await readFile(file, "utf8"), "user content\n");
});
