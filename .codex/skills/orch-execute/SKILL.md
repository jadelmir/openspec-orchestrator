<!-- orch-managed:v1 -->
# Orch Execute

Execute approved work from OpenSpec.

## Source of Truth

OpenSpec is the ONLY source of truth.

## MUST

- Read the active/approved OpenSpec change and tasks before modifying code.
- Execute only work that belongs to the approved OpenSpec scope.
- MUST NOT invent additional unrelated tasks.
- Prefer targeted repository context.
- Use Repomix only when broader context is necessary.
- Use LLMLingua only when remaining context exceeds the configured threshold.
- Use RTK for supported shell, git, test, lint, and build output.
- Update progress/state only through OpenSpec.
- Track and report token-efficiency savings when available.

## Workflow

1. Read the approved OpenSpec work.
2. Identify the next incomplete task.
3. Load only the context required for that task.
4. Implement the task.
5. Run relevant verification.
6. Continue with approved tasks until complete or blocked.
7. Record progress through OpenSpec.
8. Present execution status and mandatory run summary.

## MUST STOP IF

- OpenSpec scope is ambiguous.
- Required work conflicts with the approved change.
- Verification indicates a serious unresolved failure.

Report the blocker rather than inventing scope, but STILL output the mandatory run summary.

## Mandatory Orch Run Summary

At the end of this workflow (even if blocked or failed), you MUST provide an Orch token-efficiency summary.

The summary MUST distinguish:
- tool available
- tool used
- tool skipped
- tool unavailable
- tool failed

MUST NOT fabricate token values. If exact usage or savings are unavailable, print "not measured".

Expected report structure:

🧠 ORCH TOKEN EFFICIENCY
────────────────────────────────
Workflow: orch-execute

RTK
Status: <USED | SKIPPED | AVAILABLE | UNAVAILABLE | FAILED>
Reason: <reason if skipped/failed/available>
Saved: <measured tokens | not measured>

Repomix
Status: <USED | SKIPPED | AVAILABLE | UNAVAILABLE | FAILED>
Reason: <reason if skipped/failed/available>
Saved: <measured tokens | not measured>

LLMLingua
Status: <USED | SKIPPED | AVAILABLE | UNAVAILABLE | FAILED>
Reason: <reason if skipped/failed/available>
Saved: <measured tokens | not measured>

ccusage
Status: <AVAILABLE | UNAVAILABLE | FAILED>
Tracking: session/day usage
Per-workflow usage: not directly attributable

Context
Before: <tokens | not measured>
After:  <tokens | not measured>

────────────────────────────────
Run saved:     <tokens | 0 tokens | not fully measured>
Project saved: <tokens | not measured>

<🧠 Token efficiency was used | ℹ️ No token optimization was required for this run.>
