import { mkdir } from "node:fs/promises";
import path from "node:path";
import { execCommand } from "../core/exec.js";
import { getLLMLinguaStatus } from "../token/llmlingua.js";

export async function installLLMLingua() {
  const home =
    process.platform === "win32"
      ? process.env.USERPROFILE
      : process.env.HOME;

  if (!home) {
    return {
      success: false,
      error: "Unable to determine user home directory"
    };
  }

  const base = path.join(home, ".orch", "llmlingua");
  const venv = path.join(base, ".venv");

  const python =
    process.platform === "win32"
      ? path.join(venv, "Scripts", "python.exe")
      : path.join(venv, "bin", "python");

  await mkdir(base, { recursive: true });

  const createVenv = await execCommand("python", [
    "-m",
    "venv",
    venv
  ]);

  if (createVenv.code !== 0) {
    return {
      success: false,
      error:
        createVenv.stderr ||
        "Unable to create LLMLingua Python environment"
    };
  }

  const install = await execCommand(
  python,
  [
    "-m",
    "pip",
    "install",
    "llmlingua"
  ],
  process.cwd(),
  true
);
  if (install.code !== 0) {
    return {
      success: false,
      error: install.stderr || "LLMLingua installation failed"
    };
  }

  const verify = await execCommand(python, [
    "-c",
    "from llmlingua import PromptCompressor; print('ok')"
  ]);

  if (verify.code !== 0) {
    return {
      success: false,
      error: verify.stderr || "LLMLingua verification failed"
    };
  }

  const status = getLLMLinguaStatus();

  return {
    success: status.installed,
    error: status.installed
      ? undefined
      : "LLMLingua installed but Orch could not detect it"
  };
}