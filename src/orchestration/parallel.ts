import type { AgentAdapter } from "../agents/types.js";
import type { WorkUnit } from "./workUnit.js";

export interface ParallelismDecision {
  parallel: boolean;
  reasons: string[];
}

function overlaps(a: string[], b: string[]): boolean {
  const right = new Set(b);
  return a.some((item) => right.has(item));
}

export function canRunInParallel(
  left: WorkUnit,
  right: WorkUnit,
  leftAgent: AgentAdapter,
  rightAgent: AgentAdapter
): ParallelismDecision {
  const reasons: string[] = [];

  if (left.dependencies.includes(right.id) || right.dependencies.includes(left.id)) {
    reasons.push("A dependency edge exists between the work units.");
  }

  if (left.globalChange || right.globalChange) {
    reasons.push("Global migration/build-system work must remain sequential.");
  }

  if (left.requiresWrites || right.requiresWrites) {
    if (!left.filesHint.length || !right.filesHint.length) {
      reasons.push("Write scope is unknown, so execution must remain sequential.");
    } else if (overlaps(left.filesHint, right.filesHint)) {
      reasons.push("Known write scopes overlap.");
    }
  }

  if (!leftAgent.capabilities().supportsParallelWork || !rightAgent.capabilities().supportsParallelWork) {
    reasons.push("At least one selected agent does not support parallel work.");
  }

  if (reasons.length) return { parallel: false, reasons };
  return { parallel: true, reasons: ["No dependency, write-scope, global-change, or adapter capability conflict detected."] };
}
