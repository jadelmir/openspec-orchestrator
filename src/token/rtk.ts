import { commandExists, execCommand } from "../core/exec.js";

export async function getRtkStatus() {
  return commandExists("rtk", ["--version"]);
}

export async function runRtk(args: string[], cwd = process.cwd()) {
  return execCommand("rtk", args, cwd);
}
