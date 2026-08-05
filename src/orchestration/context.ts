import { decideTokenPolicy } from "../token/policy.js";
import type { ContextStrategy } from "./router.js";
import type { WorkUnit } from "./workUnit.js";

export interface ContextRequest {
  targetedFiles: string[];
  needsBroadRepositoryContext: boolean;
  estimatedTokens?: number;
}

export interface ContextAvailability {
  repomixAvailable: boolean;
  llmlinguaAvailable: boolean;
  llmlinguaMinimumTokens?: number;
}

export interface ContextAllocation {
  request: ContextRequest;
  strategy: ContextStrategy;
  reasons: string[];
}

export function allocateContext(
  workUnit: WorkUnit,
  availability: ContextAvailability
): ContextAllocation {
  const request: ContextRequest = {
    targetedFiles: workUnit.filesHint,
    needsBroadRepositoryContext: Boolean(workUnit.broadRepositoryContext),
    estimatedTokens: workUnit.estimatedContextTokens
  };

  const policy = decideTokenPolicy({
    estimatedContextTokens: workUnit.estimatedContextTokens ?? 0,
    broadRepositoryContext: request.needsBroadRepositoryContext,
    repomixAvailable: availability.repomixAvailable,
    llmlinguaAvailable: availability.llmlinguaAvailable,
    llmlinguaMinimumTokens: availability.llmlinguaMinimumTokens
  });

  let strategy: ContextStrategy = "targeted";
  if (policy.useRepomix && policy.useLLMLingua) strategy = "repomix+compression";
  else if (policy.useRepomix) strategy = "repomix";

  return { request, strategy, reasons: policy.reasons };
}
