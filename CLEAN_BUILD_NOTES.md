# Clean Build v3 Notes

## New in v3

`orch init` is now a real project bootstrap step. It creates Orch config, checks OpenSpec, creates agent instructions, checks token tools, and reports token-efficiency state.

## Still true

- OpenSpec is the only source of truth.
- Orch does not duplicate OpenSpec specs/tasks/plans/archive state.
- RTK stays standalone.
- Repomix and ccusage remain adapters.
- LLMLingua is optional.
- No `shell: true`.
- Windows uses `npx.cmd` / `npm.cmd`.
