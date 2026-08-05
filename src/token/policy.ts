export interface TokenPolicyInput {
  estimatedContextTokens: number;
  broadRepositoryContext?: boolean;
  verboseTerminalOutput?: boolean;
  repomixAvailable?: boolean;
  llmlinguaAvailable?: boolean;
  rtkAvailable?: boolean;
  llmlinguaMinimumTokens?: number;
}

export interface TokenPolicyDecision {
  useRtk: boolean;
  useRepomix: boolean;
  useLLMLingua: boolean;
  reasons: string[];
}

export function decideTokenPolicy(input: TokenPolicyInput): TokenPolicyDecision {
  const threshold = input.llmlinguaMinimumTokens ?? 8000;
  const reasons: string[] = [];

  const useRtk = Boolean(input.verboseTerminalOutput && input.rtkAvailable);
  if (input.verboseTerminalOutput) {
    reasons.push(useRtk ? "RTK selected for verbose terminal output." : "RTK unavailable for verbose terminal output.");
  }

  const useRepomix = Boolean(input.broadRepositoryContext && input.repomixAvailable);
  if (input.broadRepositoryContext) {
    reasons.push(useRepomix ? "Repomix selected because broad repository context is required." : "Broad repository context required but Repomix is unavailable.");
  }

  const useLLMLingua = Boolean(
    input.estimatedContextTokens >= threshold && input.llmlinguaAvailable
  );

  if (input.estimatedContextTokens >= threshold) {
    reasons.push(
      useLLMLingua
        ? `LLMLingua selected because context is ${input.estimatedContextTokens} tokens (threshold ${threshold}).`
        : `Context exceeds ${threshold} tokens but LLMLingua is unavailable.`
    );
  } else {
    reasons.push(`LLMLingua skipped because context is below ${threshold} tokens.`);
  }

  return { useRtk, useRepomix, useLLMLingua, reasons };
}
