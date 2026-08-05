---
name: orch-execute
description: Execute approved OpenSpec work while applying Orch token-efficiency rules.
---

# Orch Execute

Execute the currently approved OpenSpec work.

## Source of Truth

OpenSpec is the ONLY source of truth.

## MUST

- Read the approved OpenSpec change/tasks first.
- Execute only approved scope.
- MUST NOT invent unrelated tasks.
- Prefer targeted repository context.
- Use Repomix only when necessary.
- Use LLMLingua only when context remains large.
- Use RTK for supported shell, test, build, lint, and git output.
- Record progress through OpenSpec only.
- Report token savings when available.

## Workflow

1. Read the approved OpenSpec work.
2. Identify the next incomplete task.
3. Load minimum required context.
4. Implement that task.
5. Verify appropriately.
6. Update progress through OpenSpec.
7. Continue until complete or blocked.
8. Display execution results and mandatory Orch Run Summary.

## Mandatory Orch Run Summary

At workflow completion (even if blocked or failed):
MUST display actual Orch optimization state.

MUST NOT assume a tool was used merely because it is installed.

MUST NOT fabricate token savings. Use "not measured" when values cannot be measured.

Desired final report format:

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
Reason: <session/day tracking status>

Context
Before: <tokens | not measured>
After:  <tokens | not measured>

────────────────────────────────
Run saved:     <tokens | 0 tokens | not fully measured>
Project saved: <tokens | not measured>

<🧠 Token efficiency was used | ℹ️ No token optimization was required for this run.>
