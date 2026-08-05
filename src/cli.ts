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
  .description("OpenSpec-first orchestration CLI with token-efficiency tooling")
  .version("0.3.0");

program
  .command("init")
  .description("Initialize .orch operational config in the current project")
  .action(() => initCommand());

program
  .command("doctor")
  .description("Check OpenSpec and token-efficiency dependencies")
  .action(() => doctorCommand());

program
  .command("status")
  .description("Show project Orch status")
  .action(() => statusCommand());

program
  .command("tokens")
  .description("Show Codex token usage via ccusage")
  .action(() => tokensCommand());

program
  .command("run-report")
  .description("Print the latest Orch run token-efficiency report")
  .action(async () => {
    const runState = await loadRunState();
    if (!runState) {
      console.log("No Orch run report found. Run an Orch workflow first.");
      return;
    }
    printRunReport(runState);
  });

program
  .command("explore")
  .description("Read-only OpenSpec exploration placeholder")
  .action(() => {
    console.log("orch explore is read-only. Use OpenSpec exploration workflows.");
  });

program
  .command("plan")
  .description("Plan through OpenSpec")
  .action(() => {
    console.log("Plan through OpenSpec. OpenSpec is the only source of truth.");
  });

program
  .command("execute")
  .description("Execute an approved OpenSpec change")
  .action(() => {
    console.log("Execute only from the approved OpenSpec change.");
  });

program
  .command("archive")
  .description("Archive through OpenSpec")
  .action(() => {
    console.log("Archive through OpenSpec.");
  });

program.parseAsync(process.argv);
