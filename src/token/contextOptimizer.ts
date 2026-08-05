import { estimateTokens } from "./estimateTokens.js";
import { compressWithLLMLingua, getLLMLinguaStatus } from "./llmlingua.js";
import { decideTokenPolicy } from "./policy.js";

export interface OptimizeOptions {
  minimumTokens?: number;
  targetRatio?: number;
  minimumTargetTokens?: number;
}

export async function optimizeContext(
  text: string,
  options: OptimizeOptions = {}
) {
  const minimumTokens = options.minimumTokens ?? 8000;
  const targetRatio = options.targetRatio ?? 0.5;
  const minimumTargetTokens = options.minimumTargetTokens ?? 4000;
  const originalTokens = estimateTokens(text);
  const llm = getLLMLinguaStatus();

  const policy = decideTokenPolicy({
    estimatedContextTokens: originalTokens,
    llmlinguaAvailable: llm.installed,
    llmlinguaMinimumTokens: minimumTokens
  });

  if (!policy.useLLMLingua) {
    return {
      text,
      optimized: false,
      method: "none",
      originalTokens,
      finalTokens: originalTokens,
      savedTokens: 0,
      policyReasons: policy.reasons,
      warning:
        originalTokens >= minimumTokens && !llm.installed
          ? "LLMLingua is not installed."
          : undefined
    };
  }

  try {
    const targetTokens = Math.max(
      minimumTargetTokens,
      Math.floor(originalTokens * targetRatio)
    );

    const result = await compressWithLLMLingua(text, targetTokens);
    const finalTokens = estimateTokens(result.compressed_prompt);

    return {
      text: result.compressed_prompt,
      optimized: true,
      method: "llmlingua",
      originalTokens,
      finalTokens,
      savedTokens: Math.max(0, originalTokens - finalTokens),
      policyReasons: policy.reasons
    };
  } catch (error) {
    return {
      text,
      optimized: false,
      method: "fallback",
      originalTokens,
      finalTokens: originalTokens,
      savedTokens: 0,
      policyReasons: policy.reasons,
      warning: error instanceof Error ? error.message : String(error)
    };
  }
}
