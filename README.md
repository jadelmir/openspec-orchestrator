# OpenSpec Orchestrator

Orch is a thin orchestration and token-efficiency layer around OpenSpec.

> **OpenSpec defines what should be done. Orch decides how AI agents should do it efficiently.**

## Core boundary

OpenSpec is the ONLY source of truth for specs, plans, proposals/changes, tasks, progress state, and archives.

Orch owns the operational layer around OpenSpec: agent orchestration, agent/tool integration, token-efficiency policy, context preparation, usage visibility, operational reporting, project-level configuration, and read-only exploration helpers.

## Workflow entry points

- `/orch-explore`
- `/orch-plan`
- `/orch-execute`
- `/orch-archive`

These are Orch entry points around OpenSpec workflows, not replacements for OpenSpec state.

## Managed agent assets

Files installed into `.codex/skills/...` and `.agents/workflows/...` are marked with:

```text
<!-- orch-managed:v1 -->
```

Orch may update files carrying this marker. If a file at a managed path does not carry the marker and does not exactly match a legacy Orch-generated file, Orch treats it as user-authored and preserves it.

`AGENTS.md` is never overwritten when it already exists.

## Commands

```text
orch init        Initialize config, integrations, and optional tooling
orch update      Refresh Orch-managed agent assets only
orch status      Show operational status without duplicating OpenSpec state
orch doctor      Diagnose required and optional dependencies
orch tokens      Show usage from the configured usage provider
orch workflows   List installed slash-workflow entry points
orch run-report  Show the latest Orch token-efficiency run report
```

## `orch init`

`orch init` is designed to be idempotent. Re-running it preserves custom `.orch/config.json` values, fills in missing defaults, preserves invalid JSON rather than destroying it, preserves existing `AGENTS.md`, and safely refreshes only Orch-managed generated files.

## Token-efficiency policy

Orch centralizes the intended optimization policy:

- targeted/small context → no heavy optimization
- broad repository context → Repomix when available
- context above the configured threshold → LLMLingua when available
- verbose terminal/test/build/git output → RTK when available
- usage visibility → a pluggable usage provider

The current usage provider implementation uses ccusage for Codex data, but the Orch architecture is not tied to ccusage.

A tool being installed does NOT mean it was used. Orch must report actual use and MUST NOT fabricate token savings. If a value cannot be measured, report `not measured`.

## Install from source

```powershell
npm install
npm run build
npm test
npm unlink -g openspec-orchestrator
npm link
```

The npm package name is `openspec-orchestrator`; the executable remains `orch`.

Verify:

```powershell
where.exe orch
orch --version
orch doctor
```

## Recommended project setup

```powershell
cd C:\path\to\your-project
openspec init
orch init
orch status
```

When upgrading Orch later, refresh generated agent assets with:

```powershell
orch update
```

## Windows behavior

Orch does not use `shell: true`. On Windows it resolves commands such as `npm`/`npx` to their `.cmd` forms where needed, avoiding shell deprecation warnings and common `spawn ... ENOENT` failures.
