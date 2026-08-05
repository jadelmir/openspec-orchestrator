import { access, readdir } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

export type DocumentationArea = "api" | "database" | "deployment" | "setup";

export interface DocumentationImpact {
  required: boolean;
  paths: string[];
  reasons?: string[];
}

export interface DocumentationSignal {
  area: DocumentationArea;
  implementationSignals: string[];
  docsPath: string;
  docsPresent: boolean;
}

const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".orch",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".next",
  "vendor"
]);

function normalize(value: string): string {
  return value.replaceAll("\\", "/").replace(/^\.\//, "").toLowerCase();
}

function areaForPath(filePath: string): DocumentationArea | null {
  const value = normalize(filePath);
  const base = value.split("/").at(-1) ?? value;

  if (/(^|\/)(api|apis|routes?|controllers?|endpoints?)(\/|$)/.test(value) || /(^|[-_.])(openapi|swagger)([-_.]|$)/.test(base)) return "api";
  if (/(^|\/)(migrations?|prisma|drizzle|database|db)(\/|$)/.test(value) || /schema\.prisma$/.test(value) || /\.sql$/.test(value)) return "database";
  if (
    /(^|\/)(k8s|kubernetes|helm|terraform)(\/|$)/.test(value) ||
    /(^|\/)(dockerfile[^/]*)$/.test(value) ||
    /(^|\/)(docker-compose|compose)\.(ya?ml)$/.test(value) ||
    /\.tf$/.test(value) ||
    /(^|\/)(vercel\.json|fly\.toml|netlify\.toml)$/.test(value)
  ) return "deployment";
  if (
    /(^|\/)(\.env\.example|\.env\.sample)$/.test(value) ||
    /(^|\/)scripts\/(setup|install|bootstrap)([-_.][^/]*)?$/.test(value) ||
    /(^|\/)(setup|install|bootstrap)\.(sh|ps1|cmd|bat)$/.test(value)
  ) return "setup";
  return null;
}

export function inferDocumentationImpact(filePaths: string[], docsRoot = "docs"): DocumentationImpact | undefined {
  const root = normalize(docsRoot).replace(/\/$/, "");
  const areas = new Map<DocumentationArea, string[]>();

  for (const original of filePaths) {
    const filePath = normalize(original);
    if (!filePath || filePath === "openspec" || filePath.startsWith("openspec/") || filePath === root || filePath.startsWith(`${root}/`)) continue;
    const area = areaForPath(filePath);
    if (!area) continue;
    const values = areas.get(area) ?? [];
    if (!values.includes(original)) values.push(original);
    areas.set(area, values);
  }

  if (!areas.size) return undefined;
  const ordered = [...areas.keys()].sort();
  return {
    required: true,
    paths: ordered.map((area) => `${docsRoot.replaceAll("\\", "/").replace(/\/$/, "")}/${area}/`),
    reasons: ordered.map((area) => `${area} implementation changed: ${areas.get(area)!.join(", ")}`)
  };
}

async function exists(target: string): Promise<boolean> {
  try { await access(target, constants.F_OK); return true; } catch { return false; }
}

async function hasMarkdown(target: string, depth = 0): Promise<boolean> {
  if (!(await exists(target))) return false;
  for (const entry of await readdir(target, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) return true;
    if (entry.isDirectory() && depth < 1 && await hasMarkdown(path.join(target, entry.name), depth + 1)) return true;
  }
  return false;
}

export async function scanDocumentationSignals(cwd: string, docsRoot = "docs"): Promise<DocumentationSignal[]> {
  const root = normalize(docsRoot).replace(/\/$/, "");
  const signals = new Map<DocumentationArea, string[]>();
  let visited = 0;
  const maxEntries = 4000;
  const maxDepth = 5;

  async function walk(directory: string, relative: string, depth: number): Promise<void> {
    if (depth > maxDepth || visited >= maxEntries) return;
    let entries;
    try { entries = await readdir(directory, { withFileTypes: true }); } catch { return; }
    entries.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);

    for (const entry of entries) {
      if (visited++ >= maxEntries) return;
      const rel = relative ? `${relative}/${entry.name}` : entry.name;
      const normalized = normalize(rel);
      if (entry.isDirectory()) {
        const first = normalized.split("/")[0];
        if (IGNORED_DIRECTORIES.has(entry.name) || first === "openspec" || normalized === root || normalized.startsWith(`${root}/`)) continue;
        await walk(path.join(directory, entry.name), rel, depth + 1);
        continue;
      }
      if (!entry.isFile()) continue;
      const area = areaForPath(rel);
      if (!area) continue;
      const values = signals.get(area) ?? [];
      if (values.length < 5) values.push(rel);
      signals.set(area, values);
    }
  }

  await walk(cwd, "", 0);
  const result: DocumentationSignal[] = [];
  for (const area of [...signals.keys()].sort()) {
    const docsPath = path.join(cwd, docsRoot, area);
    result.push({
      area,
      implementationSignals: signals.get(area) ?? [],
      docsPath: `${docsRoot.replaceAll("\\", "/").replace(/\/$/, "")}/${area}/`,
      docsPresent: await hasMarkdown(docsPath)
    });
  }
  return result;
}
