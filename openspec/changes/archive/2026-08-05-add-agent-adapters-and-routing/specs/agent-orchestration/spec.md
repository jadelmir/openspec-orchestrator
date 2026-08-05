# Agent Orchestration

## ADDED Requirements

### Requirement: Common agent adapter contract
Orch MUST represent supported AI-agent integrations behind a shared adapter contract.

#### Scenario: Add a new agent
- **WHEN** a new agent integration is introduced
- **THEN** the integration MUST be implementable primarily as a new adapter
- **AND** core routing code MUST NOT require agent-name-specific branching for normal capability selection

### Requirement: Capability-aware routing
Orch MUST select only agents that satisfy the capabilities required by a work unit.

#### Scenario: Work requires repository writes and commands
- **WHEN** a work unit requires repository writes and command execution
- **THEN** agents lacking either capability MUST be excluded from routing candidates

#### Scenario: No capable agent exists
- **WHEN** no detected adapter satisfies a work unit's requirements
- **THEN** Orch MUST stop before execution
- **AND** report why no agent could be selected

### Requirement: OpenSpec remains authoritative
Routing MUST NOT create competing persistent workflow state.

#### Scenario: Route an OpenSpec task
- **WHEN** Orch derives one or more operational work units from an OpenSpec task
- **THEN** every work unit MUST retain a reference to its originating OpenSpec task
- **AND** Orch MUST NOT treat the work unit as authoritative task state
- **AND** task completion/progress MUST remain owned by OpenSpec

### Requirement: Inspectable routing decisions
Orch MUST produce an inspectable routing decision before delegating work.

#### Scenario: Agent selected
- **WHEN** Orch selects an agent for a work unit
- **THEN** the decision MUST identify the selected agent
- **AND** the execution tier
- **AND** the context strategy
- **AND** human-readable selection reasons

### Requirement: Provider-neutral execution tiers
Orch MUST express execution strength using provider-neutral tiers rather than hard-coding model names into the orchestration core.

#### Scenario: Small low-risk work
- **WHEN** work is small and low risk
- **THEN** Orch SHOULD select the lowest sufficient execution tier

#### Scenario: Complex or high-risk work
- **WHEN** work is large, complex, or high risk
- **THEN** Orch SHOULD select a stronger available tier

#### Scenario: Adapter cannot control model tier
- **WHEN** the selected adapter cannot enforce the requested execution tier
- **THEN** Orch MUST allow the adapter default
- **AND** report that the requested tier was advisory or downgraded

### Requirement: Conservative parallelism
Orch MUST only parallelize work when independence can be established conservatively.

#### Scenario: Independent work units
- **WHEN** two work units have no dependency edge
- **AND** their known write scopes do not overlap
- **AND** neither is a global migration or build-system change
- **AND** the selected adapter supports parallel work
- **THEN** Orch MAY place them in the same parallel group

#### Scenario: Unknown or overlapping write scope
- **WHEN** write scope is unknown or overlaps another work unit
- **THEN** Orch MUST schedule the work sequentially

### Requirement: Minimum-context-first routing
Orch MUST start with targeted context and reuse the central token-efficiency policy for escalation.

#### Scenario: Bounded task
- **WHEN** a work unit can be completed from a small known set of files
- **THEN** Orch MUST prefer targeted reads
- **AND** MUST NOT require broad repository packing

#### Scenario: Broad repository task
- **WHEN** targeted context is insufficient and repository-wide context is necessary
- **THEN** Orch MAY use Repomix according to the configured token policy

#### Scenario: Context remains above compression threshold
- **WHEN** broad context remains above the configured compression threshold
- **THEN** Orch MAY use LLMLingua according to the existing token policy
- **AND** routing MUST NOT duplicate compression thresholds

### Requirement: Registry-based integration lifecycle
Project setup and maintenance commands MUST consume the agent registry rather than directly importing each agent installer.

#### Scenario: Initialize integrations
- **WHEN** `orch init` installs supported agent integrations
- **THEN** it MUST iterate detected/configured adapters through the registry

#### Scenario: Refresh integrations
- **WHEN** `orch update` refreshes generated assets
- **THEN** it MUST use adapter update behavior
- **AND** continue preserving user-authored files

### Requirement: Operational routing metrics
Orch MAY persist routing telemetry as operational metrics, but MUST distinguish telemetry from OpenSpec workflow state.

#### Scenario: Completed routed run
- **WHEN** a routed work unit finishes
- **THEN** Orch SHOULD report selected agent, routing reasons, execution tier, context strategy, and parallel/sequential decision
- **AND** SHOULD include measured token usage or savings when available
- **AND** MUST NOT fabricate token values
