import { commandExists, execCommand } from "../core/exec.js";
import { readFile } from "node:fs/promises";
import { estimateTokens } from "./estimateTokens.js";
import { printSavings } from "./reportSavings.js";
import { addToTotalSavings } from "./savingsTracker.js";
import path from "node:path";

export async function getRepomixStatus() {
  // Prefer a project-local/global CLI exposed through npx, but never install anything here.
  return commandExists("npx", ["--no-install", "repomix", "--version"]);
}

export async function runRepomix(
  originalText: string,
  args: string[] = ["--compress"],
  cwd = process.cwd()
) {
  const result = await execCommand(
    "npx",
    ["--no-install", "repomix", ...args],
    cwd,
    true
  );

  if (result.code !== 0) {
    return result;
  }

  const outputPath = path.join(
    cwd,
    "repomix-output.xml"
  );

  const compressedText = await readFile(
    outputPath,
    "utf8"
  );

  const before = estimateTokens(originalText);
  const after = estimateTokens(compressedText);

  const savings = printSavings(
    "Repomix",
    before,
    after
  );

  const total = await addToTotalSavings(
    cwd,
    savings.saved
  );

  console.log(
    `Total saved: ${total.toLocaleString()} tokens`
  );

  return result;
}