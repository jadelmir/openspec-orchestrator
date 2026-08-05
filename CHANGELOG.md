# Changelog

All notable changes to OpenSpec Orchestrator will be documented in this file.

The project follows semantic versioning where practical.

## [Unreleased]

### Added
- GitHub Actions CI for Node.js 20 and 22.
- npm package dry-run verification in CI.
- Managed agent-file markers to protect user-authored files.
- `orch update` for refreshing Orch-managed agent assets.
- Central token-efficiency policy.
- Pluggable usage-provider abstraction.
- Tests for managed files, config idempotency, invalid config preservation, and token policy.
- Framework-neutral project organization and documentation-governance policy.
- `orch organize` dry-run reporting and conservative `orch organize --apply` safe moves.
- Project-organization diagnostics in `orch doctor`.
- Optional WorkUnit documentation-impact metadata.

### Changed
- Clarified the architecture boundary: OpenSpec remains the only source of truth for specs, plans, changes, tasks, progress, and archives.
- Improved `orch status` and `orch doctor`.
- Renamed the npm package identity to `openspec-orchestrator` while keeping the executable name `orch`.
- Made `orch init` idempotent and non-destructive.
- Added configurable docs-root hygiene without prescribing framework source layouts.

### Fixed
- Prevented token-tool installation prompts from running merely by importing the init module.
- Prevented user-authored agent files from being overwritten by Orch-managed asset refreshes.
- Prevented organization apply mode from overwriting destinations or moving uncertain/root-protected/OpenSpec content.
