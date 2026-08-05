# Tasks

## 1. Introduce adapter primitives

- [x] 1.1 Add `AgentCapabilities`, `AgentAdapter`, and shared integration result types.
- [x] 1.2 Add an `AgentRegistry` with registration, lookup, detection, and capability filtering.
- [x] 1.3 Add unit tests for registry behavior and capability filtering.

## 2. Migrate existing integrations behind adapters

- [x] 2.1 Wrap current Codex installation/update behavior in `CodexAdapter`.
- [x] 2.2 Wrap current Antigravity installation/update behavior in `AntigravityAdapter`.
- [x] 2.3 Preserve existing managed-file safety and generated asset locations.
- [x] 2.4 Update `orch init` to use the registry instead of importing Codex/Antigravity installers directly.
- [x] 2.5 Update `orch update` to use adapter update methods through the registry.
- [x] 2.6 Update `orch status` and `orch doctor` to report registry-backed integration status.
- [x] 2.7 Add regression tests proving current Codex and Antigravity behavior is unchanged.

## 3. Define orchestration work units

- [x] 3.1 Add a provider-neutral `WorkUnit` model referencing the originating OpenSpec task.
- [x] 3.2 Add risk/complexity/capability requirement fields used only for routing.
- [x] 3.3 Ensure work units are ephemeral/operational and are never treated as authoritative task state.
- [x] 3.4 Add tests for deriving safe work-unit metadata from bounded input.

## 4. Add rule-based routing

- [x] 4.1 Add `RoutingDecision` and routing planner interfaces.
- [x] 4.2 Implement capability filtering before selection.
- [x] 4.3 Implement explicit-preference routing when the configured agent is capable.
- [x] 4.4 Implement provider-neutral execution tiers: `lightweight`, `default`, `strong`.
- [x] 4.5 Implement deterministic rules for low-risk/small versus complex/high-risk work.
- [x] 4.6 Return human-readable reasons with every routing decision.
- [x] 4.7 Fail before execution when no capable agent exists.
- [x] 4.8 Add table-driven routing tests.

## 5. Add context allocation

- [x] 5.1 Add `ContextRequest` with targeted files, broad-context flag, and optional token estimate.
- [x] 5.2 Start every work unit with targeted context by default.
- [x] 5.3 Reuse the existing central token policy for Repomix and LLMLingua escalation.
- [x] 5.4 Ensure routing does not duplicate token thresholds.
- [x] 5.5 Add tests covering targeted, Repomix, and Repomix-plus-compression decisions.

## 6. Add conservative parallelism analysis

- [x] 6.1 Add dependency checks between work units.
- [x] 6.2 Add known write-scope overlap checks.
- [x] 6.3 Treat unknown write scope as sequential.
- [x] 6.4 Treat global migration/build-system work as sequential.
- [x] 6.5 Require adapter parallel capability before assigning a parallel group.
- [x] 6.6 Add tests for safe parallel and forced-sequential cases.

## 7. Connect routing to Orch workflow execution

- [x] 7.1 Update `/orch-execute` workflow instructions to require routing before delegation.
- [x] 7.2 Keep OpenSpec apply/task state authoritative throughout execution.
- [x] 7.3 Allow adapters that cannot enforce execution tiers to use their default and report the downgrade.
- [x] 7.4 Add routing output to the Orch run report without creating duplicate task progress state.

## 8. Add operational telemetry

- [x] 8.1 Record selected agent, execution tier, context strategy, parallel/sequential decision, and reasons per routed work unit.
- [x] 8.2 Integrate usage-provider data when measurable.
- [x] 8.3 Report `not measured` for unavailable token values.
- [x] 8.4 Keep telemetry clearly separate from OpenSpec task/change state.

## 9. Documentation and extensibility

- [x] 9.1 Document how to add a new agent adapter.
- [x] 9.2 Document routing policy and fallback behavior.
- [x] 9.3 Add an example stub adapter showing the minimum implementation required for a future provider.
- [x] 9.4 Update README architecture diagrams and command behavior after implementation.
