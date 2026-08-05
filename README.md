# OpenSpec Orchestrator

Orch is a thin orchestration and token-efficiency layer around OpenSpec.

> **OpenSpec defines what should be done. Orch decides how AI agents should do it efficiently.**

## Core boundary

OpenSpec is the ONLY source of truth for:

- specs
- plans
- proposals / changes
- tasks
- progress state
- archives

Orch MUST NOT create competing persistent workflow state for any of those things.

Orch owns the operational layer around OpenSpec:

- agent orchestration
- agent/tool integration
- token-efficiency policy
- context preparation
- token measurement and reporting
- project-level Orch configuration
- read-only exploration helpers

## Orch workflow commands

The slash commands stay intentionally:

- `/orch-explore`
- `/orch-plan`
- `/orch-execute`
- `/orch-archive`

These are **Orch entry points**, not replacements for OpenSpec workflows.

### `/orch-plan`

Delegates persistent planning to the installed OpenSpec planning/proposal workflow. Orch adds minimum-context selection, agent orchestration, token-efficiency tools, and reporting. Orch MUST NOT create a second plan.

### `/orch-execute`

Executes only work approved in OpenSpec. OpenSpec remains authoritative for tasks and progress. Orch decides how to prepare context, route work to agents, optimize tool output, and report token usage/savings.

### `/orch-archive`

Delegates the actual archive operation to OpenSpec after verification. Orch may finalize operational metrics/reporting, but MUST NOT maintain a competing archive.

### `/orch-explore`

Read-only exploration. It may inspect OpenSpec and repository context while applying Orch token-efficiency rules, but MUST NOT modify project or OpenSpec files.

## What `orch init` does

Running `orch init` inside a project:

1. Creates `.orch/config.json`
2. Detects whether the OpenSpec CLI exists
3. Detects whether the current project has an `openspec/` directory
4. Warns you to run `openspec init` if OpenSpec is not initialized
5. Creates a lightweight `AGENTS.md` for Codex / generic agents
6. Creates `.agents/rules/orch.md` for Antigravity
7. Detects RTK
8. Detects Repomix
9. Detects ccusage
10. Detects optional LLMLingua
11. Prints whether token efficiency is active

## Token-efficiency policy

Orch can use:

- **RTK** for supported verbose terminal output
- **Repomix** when broad repository context is actually required
- **LLMLingua** only when context remains large enough to justify compression
- **ccusage** when available for usage visibility

A tool being installed does NOT mean it was used. Orch must report actual use and MUST NOT fabricate token savings. If a value cannot be measured, it should say `not measured`.

## Windows fixes retained

This build does NOT use `shell: true`.

On Windows it resolves `npm` to `npm.cmd` and `npx` to `npx.cmd`, avoiding both the Node shell deprecation warning and `spawn npx ENOENT`.

## Install

```powershell
npm install
npm run build
npm unlink -g orch
npm link
```

Verify:

```powershell
where.exe orch
orch --version
orch doctor
```

Expected version: `0.3.0`.

## Recommended project setup

```powershell
cd C:\path\to\your-project
openspec init
orch init
```

Then:

```powershell
orch status
orch doctor
```

## Expected files after init

```text
your-project/
├─ .orch/
│  └─ config.json
├─ AGENTS.md
├─ .agents/
│  └─ rules/
│     └─ orch.md
├─ openspec/
│  └─ ...
└─ your normal project files
```

If `AGENTS.md` already exists, Orch preserves it instead of overwriting it. Antigravity's `.agents/rules/orch.md` is regenerated so its Orch rules stay current.
