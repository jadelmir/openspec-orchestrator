import { access, mkdir, readdir, readFile, rename } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

export type DocsCategory = "architecture" | "api" | "database" | "setup" | "deployment" | "operations" | "product";
export type ClassificationConfidence = "high" | "medium" | "low";

export interface DocsOrganizationConfig {
  enabled: boolean;
  root: string;
  enforceRootHygiene: boolean;
  updateWithImplementation: boolean;
}

export interface OrganizationConfig {
  enabled: boolean;
  docs: DocsOrganizationConfig;
}

export interface OrganizationClassification {
  category: DocsCategory | null;
  confidence: ClassificationConfidence;
  safeToMove: boolean;
  normalizedName: string;
  reason: string;
}

export interface OrganizationSuggestion extends OrganizationClassification {
  source: string;
  destination: string | null;
}

export interface OrganizationReport {
  enabled: boolean;
  docsRoot: string;
  docsExists: boolean;
  openspecExists: boolean;
  suggestions: OrganizationSuggestion[];
  planningWarnings: string[];
  configError?: string;
}

export interface OrganizationApplyResult {
  report: OrganizationReport;
  moved: OrganizationSuggestion[];
  skipped: Array<OrganizationSuggestion & { reasonSkipped: string }>;
  conflicts: Array<OrganizationSuggestion & { reasonSkipped: string }>;
}

export const defaultOrganizationConfig: OrganizationConfig = {
  enabled: true,
  docs: {
    enabled: true,
    root: "docs",
    enforceRootHygiene: true,
    updateWithImplementation: true
  }
};

const ROOT_DOC_ALLOWLIST = new Set([
  "README.MD",
  "AGENTS.MD",
  "CONTRIBUTING.MD",
  "CHANGELOG.MD",
  "SECURITY.MD",
  "CODE_OF_CONDUCT.MD",
  "LICENSE",
  "LICENSE.MD"
]);

function codepointCompare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

async function exists(target: string): Promise<boolean> {
  try {
    await access(target, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export function isProtectedRootFile(fileName: string): boolean {
  return ROOT_DOC_ALLOWLIST.has(fileName.toUpperCase());
}

export function normalizeDocumentationName(fileName: string): string {
  const ext = path.extname(fileName);
  const stem = ext ? fileName.slice(0, -ext.length) : fileName;
  const normalized = stem
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .toLowerCase();
  return `${normalized || "document"}.md`;
}

function normalizedStem(fileName: string): string {
  return normalizeDocumentationName(fileName).replace(/\.md$/, "");
}

function exactOrContains(stem: string, values: string[]): boolean {
  return values.some((value) => stem === value || stem.startsWith(`${value}-`) || stem.endsWith(`-${value}`));
}

export function classifyTechnicalDocument(fileName: string): OrganizationClassification {
  const normalizedName = normalizeDocumentationName(fileName);
  const stem = normalizedStem(fileName);

  const matches: Array<[DocsCategory, string[], string]> = [
    ["api", ["api", "api-reference", "rest-api", "openapi", "swagger"], "API/reference naming"],
    ["architecture", ["architecture", "technical-architecture", "system-design", "system-architecture"], "architecture/system-design naming"],
    ["database", ["database", "schema", "database-schema", "db-schema"], "database/schema naming"],
    ["setup", ["setup", "development", "local-development", "getting-started", "installation", "supabase-mcp-setup"], "setup/development naming"],
    ["deployment", ["deployment", "deploy", "production-deployment", "hosting"], "deployment/hosting naming"],
    ["operations", ["runbook", "troubleshooting", "operations", "incident-response"], "operations/runbook naming"],
    ["product", ["prd", "product-requirements", "ui-ux-requirements", "product-reference"], "product-reference naming"]
  ];

  for (const [category, values, reason] of matches) {
    if (exactOrContains(stem, values)) {
      return { category, confidence: "high", safeToMove: true, normalizedName, reason };
    }
  }

  if (/\b(api|architecture|database|schema|setup|deploy|runbook|troubleshoot|operations|technical)\b/.test(stem.replaceAll("-", " "))) {
    return {
      category: null,
      confidence: "medium",
      safeToMove: false,
      normalizedName,
      reason: "Looks technical but does not match a sufficiently specific safe-move rule."
    };
  }

  return {
    category: null,
    confidence: "low",
    safeToMove: false,
    normalizedName,
    reason: "Classification uncertain; manual review required."
  };
}

function isPlanningLike(fileName: string): boolean {
  const stem = normalizedStem(fileName).replaceAll("-", " ");
  return /\b(roadmap|tasks?|implementation plan|change plan|proposal|project plan|specification)\b/.test(stem);
}

export function validateDocsRoot(root: string): string | null {
  const trimmed = root.trim();
  if (!trimmed) return "organization.docs.root must not be empty.";
  if (path.isAbsolute(trimmed)) return "organization.docs.root must be a project-relative path.";
  const normalized = path.normalize(trimmed);
  if (normalized === "." || normalized === ".." || normalized.startsWith(`..${path.sep}`)) {
    return "organization.docs.root must stay inside the project and may not be the project root.";
  }
  const first = normalized.split(path.sep)[0]?.toLowerCase();
  if (first === "openspec") return "organization.docs.root must not point inside openspec/.";
  return null;
}

export async function loadOrganizationConfig(cwd = process.cwd()): Promise<{ config: OrganizationConfig; invalid: boolean; error?: string }> {
  const configPath = path.join(cwd, ".orch", "config.json");
  let parsed: any = {};
  try {
    if (await exists(configPath)) parsed = JSON.parse(await readFile(configPath, "utf8"));
  } catch {
    return { config: defaultOrganizationConfig, invalid: true, error: "Invalid .orch/config.json; organization changes are disabled until it is fixed." };
  }

  const org = parsed?.organization ?? {};
  const docs = org?.docs ?? {};
  const config: OrganizationConfig = {
    enabled: org.enabled ?? defaultOrganizationConfig.enabled,
    docs: {
      enabled: docs.enabled ?? defaultOrganizationConfig.docs.enabled,
      root: typeof docs.root === "string" && docs.root.trim() ? docs.root.trim() : defaultOrganizationConfig.docs.root,
      enforceRootHygiene: docs.enforceRootHygiene ?? defaultOrganizationConfig.docs.enforceRootHygiene,
      updateWithImplementation: docs.updateWithImplementation ?? defaultOrganizationConfig.docs.updateWithImplementation
    }
  };
  const rootError = validateDocsRoot(config.docs.root);
  return rootError ? { config, invalid: true, error: rootError } : { config, invalid: false };
}

export async function analyzeProjectOrganization(cwd = process.cwd(), configOverride?: OrganizationConfig): Promise<OrganizationReport> {
  const loaded = configOverride ? { config: configOverride, invalid: false as const } : await loadOrganizationConfig(cwd);
  const effective = loaded.config;
  const docsRoot = effective.docs.root;
  const docsPath = path.resolve(cwd, docsRoot);
  const openspecExists = await exists(path.join(cwd, "openspec"));

  if (loaded.invalid) {
    return { enabled: false, docsRoot, docsExists: await exists(docsPath), openspecExists, suggestions: [], planningWarnings: [], configError: loaded.error };
  }
  if (!effective.enabled || !effective.docs.enabled) {
    return { enabled: false, docsRoot, docsExists: await exists(docsPath), openspecExists, suggestions: [], planningWarnings: [] };
  }

  const suggestions: OrganizationSuggestion[] = [];
  const planningWarnings: string[] = [];
  if (effective.docs.enforceRootHygiene) {
    const entries = (await readdir(cwd, { withFileTypes: true })).sort((a, b) => codepointCompare(a.name, b.name));
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".md")) continue;
      if (isProtectedRootFile(entry.name)) continue;

      const classification = classifyTechnicalDocument(entry.name);
      if (!classification.safeToMove && isPlanningLike(entry.name)) planningWarnings.push(entry.name);
      const destination = classification.category
        ? path.posix.join(docsRoot.replaceAll("\\", "/"), classification.category, classification.normalizedName)
        : null;
      suggestions.push({ source: entry.name, destination, ...classification });
    }
  }

  return {
    enabled: true,
    docsRoot,
    docsExists: await exists(docsPath),
    openspecExists,
    suggestions,
    planningWarnings
  };
}

export async function ensureDocsRoot(cwd = process.cwd(), configOverride?: OrganizationConfig): Promise<string | null> {
  const loaded = configOverride ? { config: configOverride, invalid: false as const } : await loadOrganizationConfig(cwd);
  if (loaded.invalid || !loaded.config.enabled || !loaded.config.docs.enabled) return null;
  const error = validateDocsRoot(loaded.config.docs.root);
  if (error) return null;
  const docsRoot = path.resolve(cwd, loaded.config.docs.root);
  await mkdir(docsRoot, { recursive: true });
  return docsRoot;
}

export async function applyOrganizationSuggestions(cwd = process.cwd(), configOverride?: OrganizationConfig): Promise<OrganizationApplyResult> {
  const report = await analyzeProjectOrganization(cwd, configOverride);
  const moved: OrganizationSuggestion[] = [];
  const skipped: Array<OrganizationSuggestion & { reasonSkipped: string }> = [];
  const conflicts: Array<OrganizationSuggestion & { reasonSkipped: string }> = [];

  if (report.configError || !report.enabled) return { report, moved, skipped, conflicts };

  for (const suggestion of report.suggestions) {
    if (!suggestion.safeToMove || !suggestion.destination || !suggestion.category) {
      skipped.push({ ...suggestion, reasonSkipped: "Classification uncertain; manual review required." });
      continue;
    }
    if (isProtectedRootFile(suggestion.source) || suggestion.source.includes("/") || suggestion.source.includes("\\")) {
      skipped.push({ ...suggestion, reasonSkipped: "Protected or non-root source path." });
      continue;
    }

    const source = path.resolve(cwd, suggestion.source);
    const destination = path.resolve(cwd, suggestion.destination);
    const relativeDestination = path.relative(cwd, destination);
    if (!relativeDestination || relativeDestination.startsWith("..") || path.isAbsolute(relativeDestination) || relativeDestination.split(path.sep)[0]?.toLowerCase() === "openspec") {
      skipped.push({ ...suggestion, reasonSkipped: "Destination failed organization safety checks." });
      continue;
    }
    if (await exists(destination)) {
      conflicts.push({ ...suggestion, reasonSkipped: "Destination already exists; user content was preserved." });
      continue;
    }
    if (!(await exists(source))) {
      skipped.push({ ...suggestion, reasonSkipped: "Source no longer exists." });
      continue;
    }

    await mkdir(path.dirname(destination), { recursive: true });
    await rename(source, destination);
    moved.push(suggestion);
  }

  return { report, moved, skipped, conflicts };
}
