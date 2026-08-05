import { analyzeProjectOrganization, applyOrganizationSuggestions } from "../organization/projectOrganization.js";

export async function organizeCommand(options: { apply?: boolean } = {}, cwd = process.cwd()) {
  const report = await analyzeProjectOrganization(cwd);

  console.log("ORCH Project Organization");
  console.log("────────────────────────────────");

  if (!report.enabled) {
    console.log("ℹ️ Project organization policy is disabled in .orch/config.json.");
    return;
  }

  console.log(`${report.docsExists ? "✅" : "⚠️"} Docs root: ${report.docsRoot}${report.docsExists ? "" : " (missing)"}`);

  if (!report.suggestions.length) {
    console.log("✅ Root documentation hygiene: clean");
    console.log("OpenSpec remains the only source of truth for plans, tasks, progress, changes, and archives.");
    return;
  }

  console.log(`\n${options.apply ? "Applying" : "Suggested"} documentation moves`);
  for (const item of report.suggestions) {
    console.log(`  ${item.source} → ${item.destination}`);
  }

  if (!options.apply) {
    console.log("\nDry run only. Re-run with `orch organize --apply` to perform these non-overwriting moves.");
    return;
  }

  const result = await applyOrganizationSuggestions(cwd);
  console.log("");
  for (const item of result.moved) console.log(`✅ Moved ${item.source} → ${item.destination}`);
  for (const item of result.skipped) console.log(`⚠️ Skipped ${item.source}: ${item.reasonSkipped}`);
  console.log(`\nCompleted: ${result.moved.length} moved, ${result.skipped.length} skipped.`);
}
