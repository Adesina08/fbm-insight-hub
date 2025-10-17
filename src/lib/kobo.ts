import {
  buildAnalytics,
  type DashboardAnalytics,
  type RawSubmission,
} from "./analytics";

export type {
  DashboardAnalytics,
  QuadrantId,
  StatWithChange,
  CountWithChange,
  QuadrantInsight,
  ScatterPoint,
  SegmentSummary,
  PromptEffectivenessRow,
  RegressionInsight,
  RegressionStrength,
  ModelSummary,
} from "./analytics";
export type { AnalyticsSubmission as KoboSubmission } from "./analytics";

const DEFAULT_KOBO_PROXY_DATA_URL = "/api/kobo-data";
const DEFAULT_KOBO_PROXY_ASSETS_URL = "/api/kobo-assets";

interface RawAsset extends Record<string, unknown> {}

export interface KoboAssetSummary {
  uid: string;
  name: string;
  assetType: string;
  ownerUsername: string | null;
  status: string;
  deploymentStatus: string;
  hasDeployment: boolean;
  submissionCount: number;
  dateModified: string | null;
  dateDeployed: string | null;
  lastSubmissionTime: string | null;
  url: string | null;
  tagString: string | null;
}

function getKoboProxyUrl(path: "data" | "assets"): string {
  const env = import.meta.env as Record<string, string | undefined> | undefined;

  const specificOverride =
    path === "data" ? env?.VITE_KOBO_PROXY_DATA_URL : env?.VITE_KOBO_PROXY_ASSETS_URL;
  if (specificOverride && specificOverride.trim().length > 0) {
    return specificOverride.trim();
  }

  const baseOverride = env?.VITE_KOBO_PROXY_BASE_URL;
  if (baseOverride && baseOverride.trim().length > 0) {
    const normalizedBase = baseOverride.trim().replace(/\/$/, "");
    const normalizedPath = path === "data" ? "/data" : "/assets";
    return `${normalizedBase}${normalizedPath}`;
  }

  return path === "data" ? DEFAULT_KOBO_PROXY_DATA_URL : DEFAULT_KOBO_PROXY_ASSETS_URL;
}

function summarizeBody(body: string, limit = 120): string {
  if (!body) return "<empty response>";
  const normalized = body.replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit)}…`;
}

function parseJsonResponse(rawBody: string, contentType: string, context: string): unknown {
  const isJson = contentType.toLowerCase().includes("json");

  if (!isJson) {
    const preview = summarizeBody(rawBody);
    const hint = preview.startsWith("import ")
      ? " The response looks like a Vite module. When running the dev server, ensure KOBO_ASSET_ID and KOBO_TOKEN are set so the Kobo proxy can return JSON."
      : "";
    const typeLabel = contentType || "unknown";
    throw new Error(
      `Unexpected response from the Kobo proxy while loading ${context}. Expected JSON but received content-type \"${typeLabel}\".${hint} Response preview: ${preview}`,
    );
  }

  if (!rawBody) {
    return null;
  }

  try {
    return JSON.parse(rawBody);
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Unknown parser error.";
    const preview = summarizeBody(rawBody);
    throw new Error(
      `Failed to parse Kobo ${context} response as JSON (${message}). Response preview: ${preview}`,
    );
  }
}

export async function fetchKoboAnalytics(): Promise<DashboardAnalytics> {
  const url = getKoboProxyUrl("data");
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });
  } catch (error) {
    const details =
      error instanceof Error && error.message ? error.message : "The network request failed.";
    throw new Error(
      `Unable to reach the Kobo data endpoint. Please check your internet connection and proxy configuration. (${details})`,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  const rawBody = await response.text();

  if (!response.ok) {
    throw new Error(`Failed to fetch Kobo data (${response.status}): ${summarizeBody(rawBody)}`);
  }

  const payload = parseJsonResponse(rawBody, contentType, "data");
  const results: RawSubmission[] = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { results?: unknown[] } | null | undefined)?.results)
      ? ((payload as { results?: RawSubmission[] }).results ?? [])
      : [];

  return buildAnalytics(results);
}

function parseNumber(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }
  return null;
}

function normalizeAsset(raw: RawAsset): KoboAssetSummary | null {
  const rawUid = raw.uid;
  let uid: string | null = null;
  if (typeof rawUid === "string" && rawUid.trim().length > 0) {
    uid = rawUid;
  } else if (typeof rawUid === "number") {
    uid = String(rawUid);
  }
  if (!uid) return null;

  const name = typeof raw.name === "string" && raw.name.trim().length > 0 ? raw.name : "Untitled asset";
  const assetType = typeof raw.asset_type === "string" && raw.asset_type.length > 0 ? raw.asset_type : "unknown";
  const ownerUsername = typeof raw.owner__username === "string" ? raw.owner__username : null;
  const hasDeployment = Boolean(raw.has_deployment);

  const deploymentStatusRaw =
    typeof raw.deployment_status === "string" && raw.deployment_status.trim().length > 0
      ? raw.deployment_status
      : undefined;
  const statusRaw = typeof raw.status === "string" && raw.status.trim().length > 0 ? raw.status : undefined;
  const deploymentStatus = deploymentStatusRaw ?? (hasDeployment ? "deployed" : "draft");
  const status = statusRaw ?? deploymentStatus;

  const submissionCount = parseNumber(raw.deployment__submission_count) ?? 0;
  const dateModified = typeof raw.date_modified === "string" ? raw.date_modified : null;
  const dateDeployed = typeof raw.date_deployed === "string" ? raw.date_deployed : null;
  const lastSubmissionTime =
    typeof raw.deployment__last_submission_time === "string" ? raw.deployment__last_submission_time : null;
  const url = typeof raw.url === "string" ? raw.url : null;
  const tagString = typeof raw.tag_string === "string" && raw.tag_string.trim().length > 0 ? raw.tag_string : null;

  return {
    uid,
    name,
    assetType,
    ownerUsername,
    status,
    deploymentStatus,
    hasDeployment,
    submissionCount,
    dateModified,
    dateDeployed,
    lastSubmissionTime,
    url,
    tagString,
  };
}

export async function fetchKoboAssets(): Promise<KoboAssetSummary[]> {
  const url = getKoboProxyUrl("assets");

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });
  } catch (error) {
    const details =
      error instanceof Error && error.message ? error.message : "The network request failed.";
    throw new Error(
      `Unable to reach the Kobo assets endpoint. Please verify the proxy configuration. (${details})`,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  const rawBody = await response.text();

  if (!response.ok) {
    throw new Error(`Failed to fetch Kobo assets (${response.status}): ${summarizeBody(rawBody)}`);
  }

  const payload = parseJsonResponse(rawBody, contentType, "assets");
  const results: RawAsset[] = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { results?: unknown[] } | null | undefined)?.results)
      ? ((payload as { results?: RawAsset[] }).results ?? [])
      : [];

  return results
    .map((item) => normalizeAsset(item))
    .filter((asset): asset is KoboAssetSummary => asset !== null);
}
