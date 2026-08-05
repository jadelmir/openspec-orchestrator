#!/usr/bin/env node
import { Command } from "commander";
import { doctorCommand } from "./commands/doctor.js";
import { initCommand } from "./commands/init.js";
import { statusCommand } from "./commands/status.js";
import { tokensCommand } from "./commands/tokens.js";
import { loadRunState, printRunReport } from "./token/runReporter.js";

const program = new Command();

program
  .name("orch")
  .description("Thin OpenSpec orchestration and token-efficiency layer")
  .version("0.3.0");

program
  .command("init")
  .description("Initialize Orch operational config and agent integrations")
  .action(() => initCommand());

program
  .command("doctor")
  .description("Check OpenSpec and Orch token-efficiency dependencies")
  .action(() => doctorCommand());

program
  .command("status")
  .description("Show Orch operational status without duplicating OpenSpec state")
  .action(() => statusCommand());

program
  .command("tokens")
  .description("Show token-usage visibility from the configured usage tooling")
  .action(() => tokensCommand());

program
  .command("run-report")
  .description("Print the latest Orch token-efficiency run report")
  .action(async () => {
    const runState = await loadRunState();
    if (!runState) {
      console.log("No Orch run report found. Run an Orch agent workflow first.");
      return;
    }
    printRunReport(runState);
  });

program
  .command("workflows")
  .description("List Orch agent workflow entry points")
  .action(() => {
    console.log("Orch agent workflow entry points:");
    console.log("  /orch-explore  Read-only exploration with Orch efficiency rules");
    console.log("  /orch-plan     Delegate planning to OpenSpec with Orch orchestration");
    console.log("  /orch-execute  Execute approved OpenSpec work with Orch orchestration");
    console.log("  /orch-archive  Verify and delegate archival to OpenSpec");
    console.log("");
    console.log("OpenSpec remains the only source of truth for plans, tasks, progress, changes, and archives.");
    console.log("These slash workflows are installed into supported AI agents by orch init; they are not duplicate terminal workflow engines.");
  });

program.parseAsync(process.argv);
