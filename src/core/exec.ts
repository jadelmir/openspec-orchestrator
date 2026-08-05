import { spawn } from "node:child_process";

export interface ExecResult {
  code: number;
  stdout: string;
  stderr: string;
}

function quoteWindowsArg(arg: string): string {
  if (!/[ \t"&|<>^]/.test(arg)) {
    return arg;
  }

  return `"${arg.replace(/"/g, '\\"')}"`;
}

export function execCommand(
  command: string,
  args: string[] = [],
  cwd: string = process.cwd(),
  live = false
): Promise<ExecResult>{
  return new Promise((resolve) => {
    let executable = command;
    let spawnArgs = args;

    // npm/npx are .cmd files on Windows.
    // Execute them through cmd.exe WITHOUT using shell:true.

    const windowsCmdCommands = new Set([
  "npm",
  "npx",
  "openspec",
  "repomix",
  "ccusage"
]);
const commandLine = [
  `${command}.cmd`,
  ...args.map(quoteWindowsArg)
].join(" ");
    if (
  process.platform === "win32" &&
  windowsCmdCommands.has(command)
) {
      executable = process.env.ComSpec || "cmd.exe";

      const commandLine = [
        `${command}.cmd`,
        ...args.map(quoteWindowsArg)
      ].join(" ");

      spawnArgs = [
        "/d",
        "/s",
        "/c",
        commandLine
      ];
    }

    const child = spawn(executable, spawnArgs, {
  cwd,
  stdio: live
    ? ["ignore", "inherit", "inherit"]
    : ["ignore", "pipe", "pipe"],
  shell: false,
  windowsHide: true
});

    let stdout = "";
let stderr = "";

if (!live) {
  child.stdout?.on("data", (chunk) => {
    stdout += chunk.toString();
  });

  child.stderr?.on("data", (chunk) => {
    stderr += chunk.toString();
  });
}

    child.on("error", (error) => {
      resolve({
        code: 1,
        stdout: stdout.trim(),
        stderr: error.message
      });
    });

    child.on("close", (code) => {
      resolve({
        code: code ?? 1,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      });
    });
  });
}

export async function commandExists(
  command: string,
  args: string[] = ["--version"]
): Promise<{
  installed: boolean;
  version?: string;
  error?: string;
}> {
  try {
    const result = await execCommand(command, args);

    return {
      installed: result.code === 0,
      version:
        result.code === 0
          ? result.stdout || result.stderr
          : undefined,
      error:
        result.code !== 0
          ? result.stderr
          : undefined
    };
  } catch (error) {
    return {
      installed: false,
      error:
        error instanceof Error
          ? error.message
          : String(error)
    };
  }
}