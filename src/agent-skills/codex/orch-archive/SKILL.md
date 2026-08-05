# Orch Archive

Verify and archive completed work through OpenSpec.

## Source of Truth

OpenSpec is the ONLY source of truth.

Orch MUST NOT maintain a separate archive.

## MUST

- Read the relevant OpenSpec change.
- Verify expected work is complete.
- If approved work declared or clearly required documentation synchronization, verify relevant current-system docs were updated.
- Documentation verification MUST NOT create a competing task/archive lifecycle.
- Use RTK for supported verification commands.
- Report incomplete work or failed verification.
- Archive through OpenSpec only.
- Report token-efficiency savings when available.

## Workflow

1. Locate the active OpenSpec change.
2. Confirm its required tasks are complete.
3. Verify required documentation synchronization when applicable.
4. Run relevant verification.
5. If verification fails, DO NOT archive, but STILL present mandatory run summary.
6. If complete, invoke the appropriate OpenSpec archive workflow.
7. Return the archive result and mandatory run summary.

## Mandatory Orch Run Summary

At the end of this workflow (even if archive is refused or fails), provide the normal Orch token-efficiency summary, distinguish actual tool states, and use `not measured` rather than fabricating token values.
