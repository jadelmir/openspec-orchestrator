import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

export const ORCH_MANAGED_MARKER = "<!-- orch-managed:v1 -->";

export type ManagedWriteResult = "created" | "updated" | "unchanged" | "skipped-user-file";

export function withManagedMarker(content: string): string {
  const normalized = content.replace(/^\uFEFF/, "");
  if (normalized.startsWith(ORCH_MANAGED_MARKER)) return normalized;
  return `${ORCH_MANAGED_MARKER}\n${normalized}`;
}

export async function writeManagedFile(
  destination: string,
  content: string
): Promise<ManagedWriteResult> {
  await mkdir(path.dirname(destination), { recursive: true });
  const next = withManagedMarker(content);

  try {
    const current = await readFile(destination, "utf8");
    if (!current.startsWith(ORCH_MANAGED_MARKER)) return "skipped-user-file";
    if (current === next) return "unchanged";
    await writeFile(destination, next, "utf8");
    return "updated";
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw error;
    await writeFile(destination, next, "utf8");
    return "created";
  }
}
