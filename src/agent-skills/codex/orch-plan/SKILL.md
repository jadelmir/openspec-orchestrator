# Orch Plan

Plan work through OpenSpec.

## Source of Truth

OpenSpec is the ONLY source of truth.

Orch MUST NOT create its own competing plan, task list, specification, or change state.

## MUST

- Use OpenSpec for the actual planning/proposal workflow.
- Identify likely documentation impact when architecture, APIs, database behavior, setup, deployment, operations, or product reference may change.
- Documentation-impact notes are operational metadata only; persistent planning remains in OpenSpec.
- MUST NOT create duplicate implementation plans, task files, roadmaps, or change plans under docs/ or .orch/.
- Determine the minimum repository context necessary.
- Prefer targeted file reads first, including relevant current-system docs when useful.
- Use Repomix only when broad repository context is necessary.
- Use LLMLingua only when context remains above the configured threshold.
- Use RTK for supported verbose terminal commands.
- Avoid repeatedly reading unchanged context.
- Report token-efficiency savings when available.
- DO NOT implement the planned work during orch-plan unless the selected OpenSpec workflow explicitly requires it.

## Workflow

1. Inspect relevant OpenSpec state.
2. Determine what change the user wants.
3. Inspect the minimum necessary repository context and relevant current-system docs.
4. Identify likely documentation impact.
5. Use the installed OpenSpec planning/proposal workflow.
6. Ensure all persistent planning information remains in OpenSpec.
7. Return a concise summary of what was planned and the mandatory run summary.

## Forbidden

MUST NOT create:
- .orch/plans
- Orch task files
- Orch specs
- duplicate markdown plans outside OpenSpec

## Mandatory Orch Run Summary

At the end of this workflow, provide the normal Orch token-efficiency summary, distinguish actual tool states, and use `not measured` rather than fabricating token values.
