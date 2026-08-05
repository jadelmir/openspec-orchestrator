import { access, mkdir, readdir, readFile, rename } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

export type DocsCategory = "architecture" | "api" | "database" | "setup" | "deployment" | "operations" | "product" | "general";

export interface DocsOrganizationConfig {
  enabled: boolean;
  root: string;
  enforceRootHygiene: boolean;
  updateWithImplementation: boolean;
  categories: Partial<Record<Exclude<DocsCategory, "general">, boolean>>;
}

export interface OrganizationConfig {
  enabled: boolean;
  docs: DocsOrganizationConfig;
}

export interface OrganizationSuggestion {
  source: string;
  destination: string;
  category: DocsCategory;
  reason: string;
}

export interface OrganizationReport {
  enabled: boolean;
  docsRoot: string;
  docsExists: boolean;
  suggestions: OrganizationSuggestion[];
}

export const defaultOrganizationConfig: OrganizationConfig = {
  enabled: true,
  docs: {
    enabled: true,
    root: "docs",
    enforceRootHygiene: true,
    updateWithImplementation: true,
    categories: {
      architecture: true,
      api: true,
      database: true,
      setup: true,
      deployment: true,
      operations: true,
      product: true
    }
  }
};

const ROOT_DOC_ALLOWLIST = new Set([
  "README.md",
  "AGENTS.md",
  "CONTRIBUTING.md",
  "CHANGELOG.md",
  "CODE_OF_CONDUCT.md",
  "SECURITY.md",
  "LICENSE.md"
]);

async function exists(p: string): Promise<boolean> {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function loadOrganizationConfig(cwd = process.cwd()): Promise<OrganizationConfig> {
  const configPath = path.join(cwd, ".orch", "config.json");
  let parsed: any = {};
  try {
    parsed = JSON.parse(await readFile(configPath, "utf8"));
  } catch {
    return defaultOrganizationConfig;
  }

  const org = parsed?.organization ?? {};
  const docs = org?.docs ?? {};
  return {
    enabled: org.enabled ?? defaultOrganizationConfig.enabled,
    docs: {
      enabled: docs.enabled ?? defaultOrganizationConfig.docs.enabled,
      root: typeof docs.root === "string" && docs.root.trim() ? docs.root.trim() : defaultOrganizationConfig.docs.root,
      enforceRootHygiene: docs.enforceRootHygiene ?? defaultOrganizationConfig.docs.enforceRootHygiene,
      updateWithImplementation: docs.updateWithImplementation ?? defaultOrganizationConfig.docs.updateWithImplementation,
      categories: { ...defaultOrganizationConfig.docs.categories, ...(docs.categories ?? {}) }
    }
  };
}

export function classifyTechnicalDocument(fileName: string): DocsCategory {
  const value = fileName.toLowerCase();
  if (/\b(api|endpoint|openapi|swagger)\b/.test(value)) return "api";
  if (/\b(database|schema|migration|postgres|sql)\b/.test(value)) return "database";
  if (/\b(setup|install|installation|getting[-_ ]?started|supabase[-_ ]?mcp)\b/.test(value)) return "setup";
  if (/\b(deploy|deployment|hosting|release)\b/.test(value)) return "deployment";
  if (/\b(runbook|troubleshoot|operations|incident)\b/.test(value)) return "operations";
  if (/\b(prd|product|ui|ux|figma|requirements)\b/.test(value)) return "product";
  if (/\b(architecture|technical|design|system[-_ ]?design)\b/.test(value)) return "architecture";
  return "general";
}

export async function analyzeProjectOrganization(cwd = process.cwd(), config?: OrganizationConfig): Promise<OrganizationReport> {
  const effective = config ?? await loadOrganizationConfig(cwd);
  const docsRoot = path.join(cwd, effective.docs.root);
  if (!effective.enabled || !effective.docs.enabled) {
    return { enabled: false, docsRoot: effective.docs.root, docsExists: await exists(docsRoot), suggestions: [] };
  }

  const suggestions: OrganizationSuggestion[] = [];
  if (effective.docs.enforceRootHygiene) {
    const entries = await readdir(cwd, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".md")) continue;
      if (ROOT_DOC_ALLOWLIST.has(entry.name)) continue;

      const category = classifyTechnicalDocument(entry.name);
      const categoryEnabled = category === "general" ? true : effective.docs.categories[category] !== false;
      if (!categoryEnabled) continue;

      suggestions.push({
        source: entry.name,
        destination: path.posix.join(effective.docs.root.replaceAll("\\", "/"), category, entry.name),
        category,
        reason: "Durable technical documentation should live under the configured docs root."
      });
    }
  }

  return {
    enabled: true,
    docsRoot: effective.docs.root,
    docsExists: await exists(docsRoot),
    suggestions
  };
}

export async function ensureDocsRoot(cwd = process.cwd(), config?: OrganizationConfig): Promise<string | null> {
  const effective = config ?? await loadOrganizationConfig(cwd);
  if (!effective.enabled || !effective.docs.enabled) return null;
  const docsRoot = path.join(cwd, effective.docs.root);
  await mkdir(docsRoot, { recursive: true });
  return docsRoot;
}

export async function applyOrganizationSuggestions(cwd = process.cwd(), config?: OrganizationConfig) {
  const report = await analyzeProjectOrganization(cwd, config);
  const moved: OrganizationSuggestion[] = [];
  const skipped: Array<OrganizationSuggestion & { reasonSkipped: string }> = [];

  for (const suggestion of report.suggestions) {
    const source = path.join(cwd, suggestion.source);
    const destination = path.join(cwd, suggestion.destination);
    if (await exists(destination)) {
      skipped.push({ ...suggestion, reasonSkipped: "Destination already exists." });
      continue;
    }
    await mkdir(path.dirname(destination), { recursive: true });
    await rename(source, destination);
    moved.push(suggestion);
  }

  return { report, moved, skipped };
}
