---
name: orch-execute
description: Execute approved OpenSpec work through Orch routing and token-efficiency policy.
---

# Orch Execute

OpenSpec is the ONLY source of truth. Orch routing is operational only.

## MUST

- Read the approved OpenSpec change/tasks first and execute only approved scope.
- Derive bounded WorkUnits that reference their originating OpenSpec task.
- Route every WorkUnit through the Orch agent registry before delegation.
- Filter candidates by required capabilities and fail early when none are capable.
- Prefer an explicitly configured capable agent; otherwise use deterministic routing.
- Use provider-neutral execution tiers: lightweight, default, strong. Unsupported tiers are advisory and MUST be reported as such.
- Start with targeted context and reuse Orch token policy for Repomix/LLMLingua decisions.
- Parallelize only when dependency edges, known write scopes, global-change risk, and adapter parallel capability all permit it. Unknown write scope means sequential.
- Record OpenSpec progress only through OpenSpec.
- Keep selected agent, tier, context strategy, parallelism, reasons, and measurable usage in Orch operational telemetry, not task state.
- Never fabricate token usage or savings.

## Workflow

1. Read approved OpenSpec work.
2. Identify the next incomplete OpenSpec task.
3. Derive WorkUnits tied to that task.
4. Allocate targeted/broad/compressed context through Orch policy.
5. Route through the detected agent registry.
6. Analyze conservative parallelism.
7. Execute/delegate with the selected adapter and effective tier.
8. Verify appropriately.
9. Update progress through OpenSpec only.
10. Record routing telemetry and continue until complete or blocked.
11. Display execution results and the mandatory Orch run summary.

## Mandatory Orch Run Summary

Report actual status for RTK, Repomix, LLMLingua, and the usage provider; use `not measured` when necessary. Include each routed WorkUnit with agent, requested/effective tier, context strategy, parallel/sequential decision, and human-readable reasons.
