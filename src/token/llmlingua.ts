import path from "node:path";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";

export interface CompressionResult {
  compressed_prompt: string;
  origin_tokens?: number;
  compressed_tokens?: number;
  ratio?: string | number;
}

export function getLLMLinguaPythonPath(): string {
  if (process.platform === "win32") {
    return path.join(
      process.env.USERPROFILE ?? "",
      ".orch",
      "llmlingua",
      ".venv",
      "Scripts",
      "python.exe"
    );
  }

  return path.join(
    process.env.HOME ?? "",
    ".orch",
    "llmlingua",
    ".venv",
    "bin",
    "python"
  );
}

export function getLLMLinguaStatus() {
  const python = getLLMLinguaPythonPath();
  return { installed: existsSync(python), python };
}

export function compressWithLLMLingua(
  text: string,
  targetTokens: number,
  scriptPath = path.resolve(process.cwd(), "python", "compress.py")
): Promise<CompressionResult> {
  const python = getLLMLinguaPythonPath();

  return new Promise((resolve, reject) => {
    const child = spawn(python, [scriptPath], {
      stdio: ["pipe", "pipe", "pipe"],
      shell: false,
      windowsHide: true
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `LLMLingua exited with code ${code}`));
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error(`Invalid LLMLingua response: ${stdout}`));
      }
    });

    child.stdin.write(
      JSON.stringify({
        text,
        target_token: targetTokens
      })
    );
    child.stdin.end();
  });
}
