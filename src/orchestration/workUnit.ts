export type WorkRisk = "low" | "medium" | "high";
export type WorkComplexity = "small" | "medium" | "large";

export interface WorkUnit {
  id: string;
  sourceTaskRef: string;
  objective: string;
  filesHint: string[];
  dependencies: string[];
  risk: WorkRisk;
  complexity: WorkComplexity;
  requiresWrites: boolean;
  requiresCommands: boolean;
  broadRepositoryContext?: boolean;
  estimatedContextTokens?: number;
  globalChange?: boolean;
}

export interface WorkUnitInput extends Omit<WorkUnit, "filesHint" | "dependencies"> {
  filesHint?: string[];
  dependencies?: string[];
}

export function createWorkUnit(input: WorkUnitInput): WorkUnit {
  if (!input.id.trim()) throw new Error("WorkUnit id is required.");
  if (!input.sourceTaskRef.trim()) throw new Error("WorkUnit sourceTaskRef is required.");
  if (!input.objective.trim()) throw new Error("WorkUnit objective is required.");

  return {
    ...input,
    filesHint: [...new Set(input.filesHint ?? [])],
    dependencies: [...new Set(input.dependencies ?? [])]
  };
}
