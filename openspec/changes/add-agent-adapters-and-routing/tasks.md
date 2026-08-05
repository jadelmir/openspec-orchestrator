# Tasks

## 1. Introduce adapter primitives

- [ ] 1.1 Add `AgentCapabilities`, `AgentAdapter`, and shared integration result types.
- [ ] 1.2 Add an `AgentRegistry` with registration, lookup, detection, and capability filtering.
- [ ] 1.3 Add unit tests for registry behavior and capability filtering.

## 2. Migrate existing integrations behind adapters

- [ ] 2.1 Wrap current Codex installation/update behavior in `CodexAdapter`.
- [ ] 2.2 Wrap current Antigravity installation/update behavior in `AntigravityAdapter`.
- [ ] 2.3 Preserve existing managed-file safety and generated asset locations.
- [ ] 2.4 Update `orch init` to use the registry instead of importing Codex/Antigravity installers directly.
- [ ] 2.5 Update `orch update` to use adapter update methods through the registry.
- [ ] 2.6 Update `orch status` and `orch doctor` to report registry-backed integration status.
- [ ] 2.7 Add regression tests proving current Codex and Antigravity behavior is unchanged.

## 3. Define orchestration work units

- [ ] 3.1 Add a provider-neutral `WorkUnit` model referencing the originating OpenSpec task.
- [ ] 3.2 Add risk/complexity/capability requirement fields used only for routing.
- [ ] 3.3 Ensure work units are ephemeral/operational and are never treated as authoritative task state.
- [ ] 3.4 Add tests for deriving safe work-unit metadata from bounded input.

## 4. Add rule-based routing

- [ ] 4.1 Add `RoutingDecision` and routing planner interfaces.
- [ ] 4.2 Implement capability filtering before selection.
- [ ] 4.3 Implement explicit-preference routing when the configured agent is capable.
- [ ] 4.4 Implement provider-neutral execution tiers: `lightweight`, `default`, `strong`.
- [ ] 4.5 Implement deterministic rules for low-risk/small versus complex/high-risk work.
- [ ] 4.6 Return human-readable reasons with every routing decision.
- [ ] 4.7 Fail before execution when no capable agent exists.
- [ ] 4.8 Add table-driven routing tests.

## 5. Add context allocation

- [ ] 5.1 Add `ContextRequest` with targeted files, broad-context flag, and optional token estimate.
- [ ] 5.2 Start every work unit with targeted context by default.
- [ ] 5.3 Reuse the existing central token policy for Repomix and LLMLingua escalation.
- [ ] 5.4 Ensure routing does not duplicate token thresholds.
- [ ] 5.5 Add tests covering targeted, Repomix, and Repomix-plus-compression decisions.

## 6. Add conservative parallelism analysis

- [ ] 6.1 Add dependency checks between work units.
- [ ] 6.2 Add known write-scope overlap checks.
- [ ] 6.3 Treat unknown write scope as sequential.
- [ ] 6.4 Treat global migration/build-system work as sequential.
- [ ] 6.5 Require adapter parallel capability before assigning a parallel group.
- [ ] 6.6 Add tests for safe parallel and forced-sequential cases.

## 7. Connect routing to Orch workflow execution

- [ ] 7.1 Update `/orch-execute` workflow instructions to require routing before delegation.
- [ ] 7.2 Keep OpenSpec apply/task state authoritative throughout execution.
- [ ] 7.3 Allow adapters that cannot enforce execution tiers to use their default and report the downgrade.
- [ ] 7.4 Add routing output to the Orch run report without creating duplicate task progress state.

## 8. Add operational telemetry

- [ ] 8.1 Record selected agent, execution tier, context strategy, parallel/sequential decision, and reasons per routed work unit.
- [ ] 8.2 Integrate usage-provider data when measurable.
- [ ] 8.3 Report `not measured` for unavailable token values.
- [ ] 8.4 Keep telemetry clearly separate from OpenSpec task/change state.

## 9. Documentation and extensibility

- [ ] 9.1 Document how to add a new agent adapter.
- [ ] 9.2 Document routing policy and fallback behavior.
- [ ] 9.3 Add an example stub adapter showing the minimum implementation required for a future provider.
- [ ] 9.4 Update README architecture diagrams and command behavior after implementation.
