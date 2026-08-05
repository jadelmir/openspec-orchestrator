# Proposal: Agent Adapters and Orchestration Routing

## Why

Orch currently supports Codex and Antigravity through separate installers, but the integration model does not scale cleanly to more agents. Orch also lacks a central orchestration decision layer for choosing an agent, assigning context, deciding whether work can run in parallel, and selecting an appropriate execution strength.

Without a shared adapter contract, every new integration risks adding agent-specific branching throughout the codebase. Without a routing layer, Orch remains mostly a wrapper around OpenSpec plus token tooling rather than an orchestration system.

## What changes

Introduce a common agent adapter interface and a routing/orchestration core that:

- represents agent capabilities consistently;
- detects and installs agent integrations through adapters;
- exposes available agents to the orchestration layer;
- selects an agent for a unit of approved OpenSpec work;
- determines the minimum context required for that unit of work;
- decides whether independent work can be parallelized;
- supports execution tiers such as lightweight/default/strong without hard-coding specific vendors;
- records routing decisions and token-related operational metrics without becoming a competing workflow source of truth;
- keeps OpenSpec authoritative for plans, tasks, changes, progress, and archives.

## Non-goals

- Orch will not create its own persistent task state.
- Orch will not replace OpenSpec apply/archive semantics.
- Orch will not require every supported agent to expose identical features.
- This change will not implement remote distributed workers or a hosted orchestration service.
- This change will not introduce automatic model purchasing or provider billing logic.

## Expected result

Adding a new agent should primarily require implementing one adapter rather than modifying core orchestration logic. `/orch-execute` should be able to use the routing layer to decide how approved OpenSpec work is delegated while preserving OpenSpec as the only source of truth.
