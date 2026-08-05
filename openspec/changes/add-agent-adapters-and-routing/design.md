# Design: Agent Adapters and Orchestration Routing

## Architecture

Add a small orchestration core between OpenSpec-facing workflows and agent-specific integrations.

```text
OpenSpec change/tasks
        │
        ▼
Orch workflow entry point
        │
        ▼
Orchestration Planner
 ├─ task analysis
 ├─ dependency/parallelism analysis
 ├─ context budget
 ├─ execution tier
 └─ agent selection
        │
        ▼
Agent Registry
 ├─ CodexAdapter
 ├─ AntigravityAdapter
 └─ future adapters
        │
        ▼
Agent execution/instructions
```

OpenSpec remains authoritative for persistent workflow state. Orch routing decisions are operational and may be logged for reporting, but MUST NOT create a second task lifecycle.

## Agent adapter contract

Create a shared adapter contract similar to:

```ts
export interface AgentCapabilities {
  readRepository: boolean;
  writeRepository: boolean;
  runCommands: boolean;
  supportsParallelWork: boolean;
  supportsSkills: boolean;
  supportsWorkflows: boolean;
  contextClass?: "small" | "medium" | "large";
  executionTiers?: string[];
}

export interface AgentAdapter {
  id: string;
  displayName: string;
  detect(cwd: string): Promise<boolean>;
  install(cwd: string): Promise<AgentAssetInstallResult[]>;
  update(cwd: string): Promise<AgentAssetInstallResult[]>;
  capabilities(): AgentCapabilities;
}
```

The core MUST depend on this interface rather than branching on agent names.

## Registry

Add an `AgentRegistry` that owns the configured adapters and exposes:

- detected agents;
- capability filtering;
- lookup by id;
- installation/update iteration;
- future adapter registration.

Existing Codex and Antigravity installation logic should move behind adapters with no behavior regression.

## Work unit

Routing operates on an operational `WorkUnit`, derived from an OpenSpec task or a bounded part of one:

```ts
interface WorkUnit {
  id: string;
  sourceTaskRef: string;
  objective: string;
  filesHint?: string[];
  dependencies: string[];
  risk: "low" | "medium" | "high";
  complexity: "small" | "medium" | "large";
  requiresWrites: boolean;
  requiresCommands: boolean;
}
```

`sourceTaskRef` points back to OpenSpec. The WorkUnit is not authoritative state and MUST NOT replace or rewrite the OpenSpec task model.

## Routing decision

The orchestration planner returns a deterministic, inspectable decision:

```ts
interface RoutingDecision {
  workUnitId: string;
  agentId: string;
  executionTier: "lightweight" | "default" | "strong";
  contextStrategy: "targeted" | "repomix" | "repomix+compression";
  parallelGroup?: string;
  reasons: string[];
}
```

Selection should initially be rule-based and testable. Avoid opaque AI-based routing in the first implementation.

## Initial routing policy

1. Filter agents by required capabilities.
2. Prefer an explicitly configured agent when it satisfies requirements.
3. For small/low-risk work, select the lowest sufficient execution tier.
4. For high-risk or large work, select the strongest available permitted tier.
5. Start with targeted context.
6. Use Repomix only when the task spans broad repository context.
7. Use LLMLingua only when context remains above the configured threshold.
8. Mark work parallelizable only when no dependency edge or overlapping write scope is detected.
9. Fall back to one sequential agent when safe routing cannot be established.

## Parallelism

Parallel execution MUST be conservative in v1.

Two WorkUnits may share a parallel group only when:

- neither depends on the other;
- their known write scopes do not overlap;
- neither performs a global migration/build-system change that could invalidate the other;
- the selected adapter reports parallel capability.

Unknown write scope means sequential execution.

## Context allocation

The planner should produce a context request before any agent execution:

```ts
interface ContextRequest {
  targetedFiles: string[];
  needsBroadRepositoryContext: boolean;
  estimatedTokens?: number;
}
```

The existing token policy remains responsible for deciding whether Repomix/LLMLingua are appropriate. Routing should consume that policy rather than duplicate thresholds.

## Execution tiers

Use provider-neutral tiers:

- `lightweight`: routine, low-risk, bounded changes;
- `default`: normal implementation work;
- `strong`: complex architecture, risky migrations, difficult debugging.

Adapters translate tiers into whatever their environment supports. If an adapter cannot select a model/tier directly, it reports that capability as unavailable and Orch treats the tier as advisory.

## Operational reporting

Record per-run routing information under Orch operational metrics only:

- selected agent;
- selection reasons;
- execution tier;
- context strategy;
- parallel/sequential decision;
- measured token usage/savings when available.

Do not record task completion state independently of OpenSpec.

## Failure behavior

- No capable agent: return a clear routing failure before execution.
- Adapter unavailable: exclude it from candidate selection.
- Ambiguous/unsafe parallelism: run sequentially.
- Context cannot be bounded: escalate to broad-context policy.
- Execution tier unsupported: use adapter default and report the downgrade.

## Migration

Codex and Antigravity installers should first be wrapped by adapters without changing generated asset locations. After adapter parity is tested, `orch init`, `orch update`, `orch status`, and `orch doctor` should consume the registry rather than importing individual integrations directly.
