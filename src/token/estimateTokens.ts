import { getEncoding } from "js-tiktoken";

const encoding = getEncoding("o200k_base");

export function estimateTokens(text: string): number {
  return encoding.encode(text).length;
}
