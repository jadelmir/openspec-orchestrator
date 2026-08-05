import { calculateSavings } from "./savingsTracker.js";

export function printSavings(
  tool: string,
  before: number,
  after: number
) {
  const result = calculateSavings(before, after);

  console.log("");
  console.log(`🧠 ${tool}`);
  console.log(`Before: ${before.toLocaleString()} tokens`);
  console.log(`After:  ${after.toLocaleString()} tokens`);
  console.log(`Saved:  ${result.saved.toLocaleString()} tokens`);
  console.log(`Reduction: ${result.percent.toFixed(1)}%`);

  return result;
}