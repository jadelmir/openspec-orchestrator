import test from "node:test";
import assert from "node:assert/strict";
import { decideTokenPolicy } from "../src/token/policy.js";

test("small targeted context skips heavy optimizers", () => {
  const result = decideTokenPolicy({
    estimatedContextTokens: 2000,
    broadRepositoryContext: false,
    verboseTerminalOutput: false,
    repomixAvailable: true,
    llmlinguaAvailable: true,
    rtkAvailable: true
  });

  assert.equal(result.useRtk, false);
  assert.equal(result.useRepomix, false);
  assert.equal(result.useLLMLingua, false);
});

test("broad large verbose work selects available optimizers", () => {
  const result = decideTokenPolicy({
    estimatedContextTokens: 12000,
    broadRepositoryContext: true,
    verboseTerminalOutput: true,
    repomixAvailable: true,
    llmlinguaAvailable: true,
    rtkAvailable: true
  });

  assert.equal(result.useRtk, true);
  assert.equal(result.useRepomix, true);
  assert.equal(result.useLLMLingua, true);
});
