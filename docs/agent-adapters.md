# Agent adapters and routing

Orch keeps OpenSpec authoritative for specs, changes, tasks, progress, and archives. Agent adapters expose operational capabilities only.

## Adding an adapter

Implement `AgentAdapter` from `src/agents/types.ts` with:

- stable `id` and `displayName`
- `detect(cwd)`
- `install(cwd)`
- `update(cwd)`
- `capabilities()`

Then register the adapter in the registry used by your distribution. The core router MUST select through capabilities rather than branching on provider names.

## Routing policy

Routing is deterministic in v1:

1. Filter candidates by required read/write/command capabilities.
2. Honor an explicit capable preferred agent when configured.
3. Otherwise choose deterministically from capable adapters.
4. Use `lightweight` for small low-risk work, `strong` for high-risk or large work, and `default` otherwise.
5. If a provider cannot enforce the requested tier, use its default behavior and report the tier as advisory.
6. Start with targeted context. Reuse the central token policy for Repomix and LLMLingua escalation.
7. Parallelize conservatively. Dependencies, overlapping/unknown write scopes, global changes, or lack of adapter parallel support force sequential execution.
8. Fail before delegation when no capable adapter exists.

## Minimal example

```ts
import type {
  AgentAdapter,
  AgentAssetInstallResult,
  AgentCapabilities
} from "../src/agents/types.js";

export class ExampleAdapter implements AgentAdapter {
  id = "example";
  displayName = "Example Agent";

  async detect(_cwd: string) {
    return false;
  }

  async install(_cwd: string): Promise<AgentAssetInstallResult[]> {
    return [];
  }

  async update(_cwd: string): Promise<AgentAssetInstallResult[]> {
    return [];
  }

  capabilities(): AgentCapabilities {
    return {
      readRepository: true,
      writeRepository: true,
      runCommands: true,
      supportsParallelWork: false,
      supportsSkills: false,
      supportsWorkflows: true,
      executionTiers: []
    };
  }
}
```

Execution tier names are provider-neutral. An empty `executionTiers` array means tier selection is advisory for that adapter.
