import { analyzeProjectOrganization, applyOrganizationSuggestions } from "../organization/projectOrganization.js";

export async function organizeCommand(options: { apply?: boolean } = {}, cwd = process.cwd()) {
  const report = await analyzeProjectOrganization(cwd);

  console.log("Project organization scan");
  console.log("────────────────────────────────");

  if (report.configError) {
    console.log(`ERROR ${report.configError}`);
    console.log("No files changed.");
    return;
  }
  if (!report.enabled) {
    console.log("SKIP Project organization or docs governance is disabled in .orch/config.json.");
    console.log("No files changed.");
    return;
  }

  if (!report.docsExists) console.log(`WARN Documentation root is missing: ${report.docsRoot}/`);
  if (!report.suggestions.length) {
    console.log("PASS No misplaced root documentation found.");
    console.log("OpenSpec remains the only source of truth for plans, tasks, progress, changes, and archives.");
    console.log("No files changed.");
    return;
  }

  console.log("\nDetected:");
  for (const item of report.suggestions) {
    console.log(`  ${item.source}`);
    console.log(`    category: ${item.category ?? "unknown"}`);
    if (item.destination) console.log(`    suggested: ${item.destination}`);
    console.log(`    action: ${item.safeToMove ? "safe move available" : "manual review required"}`);
    console.log(`    reason: ${item.reason}`);
  }

  if (!options.apply) {
    console.log("\nNo files changed.");
    console.log("Run:\n  orch organize --apply\n\nto apply safe organization changes.");
    console.log("Note: markdown links are not rewritten automatically; review references after any move.");
    return;
  }

  const result = await applyOrganizationSuggestions(cwd);
  console.log("");
  for (const item of result.moved) console.log(`MOVE\n${item.source}\n-> ${item.destination}\n`);
  for (const item of result.skipped) console.log(`SKIP\n${item.source}\nReason: ${item.reasonSkipped}\n`);
  for (const item of result.conflicts) console.log(`SKIP\n${item.source}\nReason: ${item.reasonSkipped}\n`);
  console.log("Organization complete:");
  console.log(`Moved: ${result.moved.length}`);
  console.log(`Skipped: ${result.skipped.length}`);
  console.log(`Conflicts: ${result.conflicts.length}`);
  if (result.moved.length) console.log("Review markdown links that may reference moved documents; Orch does not rewrite links automatically.");
}
