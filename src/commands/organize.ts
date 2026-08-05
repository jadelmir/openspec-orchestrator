import { analyzeProjectOrganization, applyOrganizationSuggestions, type OrganizationReport } from "../organization/projectOrganization.js";

export interface OrganizeOptions {
  apply?: boolean;
  check?: boolean;
  json?: boolean;
}

function summary(report: OrganizationReport) {
  return {
    safeMoves: report.suggestions.filter((item) => item.safeToMove && item.destination).length,
    manualReview: report.suggestions.filter((item) => !item.safeToMove).length,
    planningWarnings: report.planningWarnings.length
  };
}

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

export async function organizeCommand(options: OrganizeOptions = {}, cwd = process.cwd()): Promise<number> {
  if (options.apply && options.check) {
    const message = "--apply and --check cannot be used together.";
    if (options.json) printJson({ command: "organize", mode: "invalid", exitCode: 2, error: message });
    else console.log(`ERROR ${message}`);
    return 2;
  }

  const report = await analyzeProjectOrganization(cwd);
  const mode = options.apply ? "apply" : options.check ? "check" : "dry-run";
  const counts = summary(report);

  if (report.configError) {
    if (options.json) printJson({ command: "organize", mode, exitCode: 2, report, summary: counts });
    else {
      console.log("Project organization scan");
      console.log("────────────────────────────────");
      console.log(`ERROR ${report.configError}`);
      console.log("No files changed.");
    }
    return 2;
  }

  if (!report.enabled) {
    if (options.json) printJson({ command: "organize", mode, exitCode: 0, report, summary: counts });
    else {
      console.log("Project organization scan");
      console.log("────────────────────────────────");
      console.log("SKIP Project organization or docs governance is disabled in .orch/config.json.");
      console.log("No files changed.");
    }
    return 0;
  }

  if (options.apply) {
    const result = await applyOrganizationSuggestions(cwd);
    if (options.json) {
      printJson({ command: "organize", mode, exitCode: 0, report: result.report, summary: { ...counts, moved: result.moved.length, skipped: result.skipped.length, conflicts: result.conflicts.length }, moved: result.moved, skipped: result.skipped, conflicts: result.conflicts });
    } else {
      console.log("Project organization scan");
      console.log("────────────────────────────────");
      for (const item of result.moved) console.log(`MOVE\n${item.source}\n-> ${item.destination}\n`);
      for (const item of result.skipped) console.log(`SKIP\n${item.source}\nReason: ${item.reasonSkipped}\n`);
      for (const item of result.conflicts) console.log(`SKIP\n${item.source}\nReason: ${item.reasonSkipped}\n`);
      console.log("Organization complete:");
      console.log(`Moved: ${result.moved.length}`);
      console.log(`Skipped: ${result.skipped.length}`);
      console.log(`Conflicts: ${result.conflicts.length}`);
      if (result.moved.length) console.log("Review markdown links that may reference moved documents; Orch does not rewrite links automatically.");
    }
    return 0;
  }

  const exitCode = options.check && counts.safeMoves > 0 ? 1 : 0;
  if (options.json) {
    printJson({ command: "organize", mode, exitCode, report, summary: counts });
    return exitCode;
  }

  console.log("Project organization scan");
  console.log("────────────────────────────────");
  if (!report.docsExists) console.log(`WARN Documentation root is missing: ${report.docsRoot}/`);
  if (!report.suggestions.length) {
    console.log("PASS No misplaced root documentation found.");
    console.log("OpenSpec remains the only source of truth for plans, tasks, progress, changes, and archives.");
    console.log("No files changed.");
    return exitCode;
  }

  console.log("\nDetected:");
  for (const item of report.suggestions) {
    console.log(`  ${item.source}`);
    console.log(`    category: ${item.category ?? "unknown"}`);
    if (item.destination) console.log(`    suggested: ${item.destination}`);
    console.log(`    action: ${item.safeToMove ? "safe move available" : "manual review required"}`);
    console.log(`    reason: ${item.reason}`);
  }
  console.log("\nNo files changed.");
  if (options.check) console.log(exitCode ? `CHECK FAILED: ${counts.safeMoves} safe organization violation(s) found.` : "CHECK PASSED: no safe organization violations found.");
  else console.log("Run:\n  orch organize --apply\n\nto apply safe organization changes.");
  console.log("Note: markdown links are not rewritten automatically; review references after any move.");
  return exitCode;
}
