import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export interface SavingsRecord {
  before: number;
  after: number;
  saved: number;
  percent: number;
}

export interface SavingsState {
  totalSavedTokens: number;
  byTool: {
    rtk: number;
    repomix: number;
    llmlingua: number;
  };
}

export function calculateSavings(
  before: number,
  after: number
): SavingsRecord {
  const saved = Math.max(0, before - after);

  const percent =
    before > 0
      ? (saved / before) * 100
      : 0;

  return {
    before,
    after,
    saved,
    percent
  };
}

export async function getSavingsState(cwd = process.cwd()): Promise<SavingsState> {
  const orchDir = path.join(cwd, ".orch");
  const file = path.join(orchDir, "token-stats.json");

  let state: SavingsState = {
    totalSavedTokens: 0,
    byTool: {
      rtk: 0,
      repomix: 0,
      llmlingua: 0
    }
  };

  try {
    const data = JSON.parse(await readFile(file, "utf8"));
    state.totalSavedTokens = data.totalSavedTokens ?? 0;
    state.byTool = {
      rtk: data.byTool?.rtk ?? 0,
      repomix: data.byTool?.repomix ?? 0,
      llmlingua: data.byTool?.llmlingua ?? 0
    };
  } catch {
    // First run or missing file
  }

  return state;
}

export async function addToolSavings(
  cwd: string,
  tool: "rtk" | "repomix" | "llmlingua",
  savedTokens: number
): Promise<SavingsState> {
  const orchDir = path.join(cwd, ".orch");
  const file = path.join(orchDir, "token-stats.json");

  await mkdir(orchDir, { recursive: true });

  const state = await getSavingsState(cwd);
  const validSavings = Math.max(0, savedTokens);

  state.byTool[tool] = (state.byTool[tool] || 0) + validSavings;
  state.totalSavedTokens = (state.totalSavedTokens || 0) + validSavings;

  await writeFile(
    file,
    JSON.stringify(state, null, 2) + "\n",
    "utf8"
  );

  return state;
}

export async function addToTotalSavings(
  cwd: string,
  savedTokens: number
): Promise<number> {
  const state = await addToolSavings(cwd, "repomix", savedTokens);
  return state.totalSavedTokens;
}