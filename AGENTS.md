# Orch

This project uses Orch as a thin orchestration and token-efficiency layer around OpenSpec.

OpenSpec is the ONLY source of truth for specifications, plans, proposals/changes, tasks, progress state, and archives.

Orch MUST NOT create competing persistent workflow state for those concerns.

Use the installed Orch workflow entry points when appropriate:

- `/orch-explore`
- `/orch-plan`
- `/orch-execute`
- `/orch-archive`

These are Orch entry points into OpenSpec-backed work. They add agent orchestration, context preparation, token-efficiency policy, and reporting; they do not replace OpenSpec workflows.

Token-efficiency tools MUST be used only when they are applicable and beneficial. A tool being installed or available does not mean it was used. Never fabricate token usage or savings; report `not measured` when exact values are unavailable.
