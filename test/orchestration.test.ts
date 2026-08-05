import test from "node:test";
import assert from "node:assert/strict";
import { AgentRegistry } from "../src/agents/registry.js";
import type { AgentAdapter, AgentCapabilities } from "../src/agents/types.js";
import { createWorkUnit } from "../src/orchestration/workUnit.js";
import { allocateContext } from "../src/orchestration/context.js";
import { canRunInParallel } from "../src/orchestration/parallel.js";
import { routeWorkUnit } from "../src/orchestration/router.js";

class StubAdapter implements AgentAdapter {
  constructor(
    public id: string,
    private readonly caps: AgentCapabilities,
    public displayName = id
  ) {}
  async detect() { return true; }
  async install() { return []; }
  async update() { return []; }
  capabilities() { return this.caps; }
}

const fullCaps: AgentCapabilities = {
  readRepository: true,
  writeRepository: true,
  runCommands: true,
  supportsParallelWork: true,
  supportsSkills: true,
  supportsWorkflows: true,
  executionTiers: ["lightweight", "default", "strong"]
};

function unit(overrides = {}) {
  return createWorkUnit({
    id: "u1",
    sourceTaskRef: "1.1",
    objective: "Implement bounded change",
    filesHint: ["src/a.ts"],
    dependencies: [],
    risk: "low",
    complexity: "small",
    requiresWrites: true,
    requiresCommands: false,
    ...overrides
  });
}

test("registry filters by required capabilities", () => {
  const capable = new StubAdapter("capable", fullCaps);
  const readonly = new StubAdapter("readonly", { ...fullCaps, writeRepository: false });
  const registry = new AgentRegistry([readonly, capable]);
  assert.deepEqual(registry.filterByCapabilities(registry.all(), { writeRepository: true }).map((a) => a.id), ["capable"]);
});

test("routing honors capable explicit preference and lightweight tier", () => {
  const a = new StubAdapter("a", fullCaps);
  const b = new StubAdapter("b", fullCaps);
  const registry = new AgentRegistry([a, b]);
  const decision = routeWorkUnit(registry, unit(), registry.all(), { preferredAgentId: "b" });
  assert.equal(decision.agentId, "b");
  assert.equal(decision.executionTier, "lightweight");
  assert.equal(decision.tierEnforced, true);
});

test("routing fails when no capable agent exists", () => {
  const readonly = new StubAdapter("readonly", { ...fullCaps, writeRepository: false });
  const registry = new AgentRegistry([readonly]);
  assert.throws(() => routeWorkUnit(registry, unit(), registry.all()), /No capable agent/);
});

test("context allocation starts targeted and escalates through token policy", () => {
  assert.equal(allocateContext(unit(), { repomixAvailable: true, llmlinguaAvailable: true }).strategy, "targeted");
  assert.equal(allocateContext(unit({ broadRepositoryContext: true, estimatedContextTokens: 4000 }), { repomixAvailable: true, llmlinguaAvailable: true }).strategy, "repomix");
  assert.equal(allocateContext(unit({ broadRepositoryContext: true, estimatedContextTokens: 9000 }), { repomixAvailable: true, llmlinguaAvailable: true }).strategy, "repomix+compression");
});

test("parallelism is conservative", () => {
  const adapter = new StubAdapter("a", fullCaps);
  const left = unit({ id: "left", filesHint: ["src/a.ts"] });
  const right = unit({ id: "right", filesHint: ["src/b.ts"] });
  assert.equal(canRunInParallel(left, right, adapter, adapter).parallel, true);
  assert.equal(canRunInParallel(left, unit({ id: "overlap", filesHint: ["src/a.ts"] }), adapter, adapter).parallel, false);
  assert.equal(canRunInParallel(left, unit({ id: "unknown", filesHint: [] }), adapter, adapter).parallel, false);
  assert.equal(canRunInParallel(left, unit({ id: "global", globalChange: true, filesHint: ["src/c.ts"] }), adapter, adapter).parallel, false);
});
