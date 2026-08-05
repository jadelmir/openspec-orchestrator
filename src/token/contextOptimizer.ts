import { estimateTokens } from "./estimateTokens.js";
import { compressWithLLMLingua, getLLMLinguaStatus } from "./llmlingua.js";

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

  if (originalTokens < minimumTokens) {
    return {
      text,
      optimized: false,
      method: "none",
      originalTokens,
      finalTokens: originalTokens,
      savedTokens: 0
    };
  }

  const llm = getLLMLinguaStatus();
  if (!llm.installed) {
    return {
      text,
      optimized: false,
      method: "fallback",
      originalTokens,
      finalTokens: originalTokens,
      savedTokens: 0,
      warning: "LLMLingua is not installed."
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
      savedTokens: Math.max(0, originalTokens - finalTokens)
    };
  } catch (error) {
    return {
      text,
      optimized: false,
      method: "fallback",
      originalTokens,
      finalTokens: originalTokens,
      savedTokens: 0,
      warning: error instanceof Error ? error.message : String(error)
    };
  }
}
