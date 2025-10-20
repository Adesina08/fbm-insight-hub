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

const DEFAULT_FIELD_MAP = {
  motivation: "motivation_score",
  ability: "ability_score",
  descriptiveNorms: "descriptive_norms",
  injunctiveNorms: "injunctive_norms",
  systemReadiness: "system_score",
  currentUse: "current_use",
  promptFacilitator: "prompt_facilitator",
  promptSpark: "prompt_spark",
  promptSignal: "prompt_signal",
};

type FieldKey = keyof typeof DEFAULT_FIELD_MAP;

export type QuadrantId =
  | "high_m_high_a"
  | "high_m_low_a"
  | "low_m_high_a"
  | "low_m_low_a";

export interface KoboSubmission {
  id: string;
  motivation: number | null;
  ability: number | null;
  descriptiveNorms: number | null;
  injunctiveNorms: number | null;
  systemReadiness: number | null;
  promptFacilitator: number | null;
  promptSpark: number | null;
  promptSignal: number | null;
  currentUse: boolean | null;
  submissionTime?: string;
  quadrant?: QuadrantId;
}

export interface StatWithChange {
  value: number | null;
  change: number | null;
}

export interface CountWithChange {
  value: number;
  change: number | null;
}

export interface QuadrantInsight {
  id: QuadrantId;
  label: string;
  percentage: number;
  count: number;
  description: string;
  color: string;
  barColor: string;
  currentUseRate: number | null;
  avgMotivation: number | null;
  avgAbility: number | null;
}

export interface ScatterPoint {
  id: string;
  ability: number;
  motivation: number;
  currentUse: boolean;
  norms: number | null;
  system: number | null;
}

export interface SegmentSummary {
  id: QuadrantId;
  name: string;
  percentage: number;
  count: number;
  color: string;
  description: string;
  characteristics: Record<string, number | null>;
  insights: string[];
  recommendations: string[];
  currentUseRate: number | null;
}

export interface PromptEffectivenessRow {
  id: QuadrantId;
  name: string;
  facilitator: number | null;
  spark: number | null;
  signal: number | null;
}

export type RegressionStrength = "strong" | "moderate" | "weak" | "indirect";

export interface RegressionInsight {
  variable: string;
  beta: number | null;
  pValue: string;
  strength: RegressionStrength;
  interpretation: string;
}

export interface ModelSummary {
  label: string;
  value: string;
  helper: string;
}

export interface DashboardAnalytics {
  lastUpdated?: string;
  stats: {
    totalRespondents: CountWithChange;
    currentUsers: CountWithChange;
    averageMotivation: StatWithChange;
    averageAbility: StatWithChange;
  };
  quadrants: QuadrantInsight[];
  scatter: ScatterPoint[];
  segments: SegmentSummary[];
  promptEffectiveness: PromptEffectivenessRow[];
  regression: RegressionInsight[];
  modelSummary: ModelSummary[];
}

interface FieldMap {
  motivation: string;
  ability: string;
  descriptiveNorms: string;
  injunctiveNorms: string;
  systemReadiness: string;
  currentUse: string;
  promptFacilitator: string;
  promptSpark: string;
  promptSignal: string;
}

interface RawSubmission extends Record<string, unknown> {
  _id?: string | number;
  _uuid?: string;
  _submission_time?: string;
  end?: string;
  start?: string;
}

export interface KoboAssetSummary {
  spreadsheetId: string;
  title: string;
  spreadsheetUrl: string | null;
  timeZone: string | null;
  totalRows: number;
  totalColumns: number;
  headers: string[];
  lastUpdated: string | null;
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

function normalizeSheetMetadata(raw: unknown): KoboAssetSummary {
  if (!raw || typeof raw !== "object") {
    throw new Error("Sheet metadata response was empty.");
  }

  const data = raw as Record<string, unknown>;
  const spreadsheetId =
    typeof data.spreadsheetId === "string" && data.spreadsheetId.trim().length > 0
      ? data.spreadsheetId.trim()
      : null;
  if (!spreadsheetId) {
    throw new Error("Sheet metadata is missing a spreadsheetId field.");
  }

  const title =
    typeof data.title === "string" && data.title.trim().length > 0 ? data.title.trim() : "Untitled spreadsheet";
  const spreadsheetUrl =
    typeof data.spreadsheetUrl === "string" && data.spreadsheetUrl.trim().length > 0
      ? data.spreadsheetUrl.trim()
      : null;
  const timeZone =
    typeof data.timeZone === "string" && data.timeZone.trim().length > 0 ? data.timeZone.trim() : null;
  const totalRows = parseNumber(data.totalRows) ?? 0;
  const totalColumns = parseNumber(data.totalColumns) ?? 0;
  const headers = Array.isArray(data.headers)
    ? data.headers.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    : [];
  const lastUpdated =
    typeof data.lastUpdated === "string" && data.lastUpdated.trim().length > 0 ? data.lastUpdated.trim() : null;

  return {
    spreadsheetId,
    title,
    spreadsheetUrl,
    timeZone,
    totalRows,
    totalColumns,
    headers,
    lastUpdated,
  };
}

export async function fetchKoboAssets(): Promise<KoboAssetSummary> {
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
      `Unable to reach the sheet metadata endpoint. Please verify the proxy configuration. (${details})`,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  const rawBody = await response.text();

  if (!response.ok) {
    throw new Error(`Failed to fetch sheet metadata (${response.status}): ${summarizeBody(rawBody)}`);
  }

  const payload = parseJsonResponse(rawBody, contentType, "assets");
  return normalizeSheetMetadata(payload);
}
