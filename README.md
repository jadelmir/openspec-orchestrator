# Orch Clean v3

Fresh Orch build with an improved `orch init`.

## What `orch init` now does

Running `orch init` inside a project now:

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

OpenSpec remains the ONLY source of truth for specs, plans, tasks, changes, and archives.

## Important boundary

Orch agent instructions DO NOT duplicate OpenSpec workflows.

OpenSpec teaches the agent how to use OpenSpec. Orch only adds orchestration rules, token-efficiency rules, read-only exploration policy, and the source-of-truth boundary.

## Windows fixes retained

This build does NOT use `shell: true`.

On Windows it resolves `npm` to `npm.cmd` and `npx` to `npx.cmd`, avoiding both the Node shell deprecation warning and `spawn npx ENOENT`.

## Install

```powershell
cd C:\path\to\orch-clean-v3
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
