import { inferDocumentationImpact, type DocumentationImpact } from "../organization/documentationSignals.js";

export type { DocumentationImpact } from "../organization/documentationSignals.js";
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
  documentationImpact?: DocumentationImpact;
}

export interface WorkUnitInput extends Omit<WorkUnit, "filesHint" | "dependencies" | "documentationImpact"> {
  filesHint?: string[];
  dependencies?: string[];
  documentationImpact?: DocumentationImpact;
}

export function createWorkUnit(input: WorkUnitInput): WorkUnit {
  if (!input.id.trim()) throw new Error("WorkUnit id is required.");
  if (!input.sourceTaskRef.trim()) throw new Error("WorkUnit sourceTaskRef is required.");
  if (!input.objective.trim()) throw new Error("WorkUnit objective is required.");

  const filesHint = [...new Set(input.filesHint ?? [])];
  const inferred = input.requiresWrites ? inferDocumentationImpact(filesHint) : undefined;
  const documentationImpact = input.documentationImpact
    ? {
        required: input.documentationImpact.required,
        paths: [...new Set(input.documentationImpact.paths.filter(Boolean))],
        ...(input.documentationImpact.reasons ? { reasons: [...new Set(input.documentationImpact.reasons.filter(Boolean))] } : {})
      }
    : inferred;

  return {
    ...input,
    filesHint,
    dependencies: [...new Set(input.dependencies ?? [])],
    ...(documentationImpact ? { documentationImpact } : {})
  };
}
