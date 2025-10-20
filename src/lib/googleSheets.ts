import {
  buildAnalytics,
  type DashboardAnalytics,
  type RawSubmission,
  type ModelSummary,
  type QuadrantInsight,
  type RegressionInsight,
  type RegressionStrength,
  type ScatterPoint,
  type SegmentSummary,
  type PromptEffectivenessRow,
  type StatWithChange,
  type CountWithChange,
  type QuadrantId,
} from "./analytics";

export type {
  DashboardAnalytics,
  QuadrantInsight,
  QuadrantId,
  ScatterPoint,
  SegmentSummary,
  PromptEffectivenessRow,
  RegressionInsight,
  RegressionStrength,
  ModelSummary,
  StatWithChange,
  CountWithChange,
} from "./analytics";

const DEFAULT_SHEETS_DATA_URL = "/api/sheets-data";
const DEFAULT_SHEETS_METADATA_URL = "/api/sheets-metadata";

interface SheetsDataResponse {
  count?: unknown;
  results?: unknown;
}

export interface SheetMetadataSummary {
  spreadsheetId: string;
  spreadsheetUrl: string | null;
  title: string;
  timeZone: string | null;
  totalRows: number;
  totalColumns: number;
  headers: string[];
  lastUpdated: string | null;
}

interface SheetsMetadataResponse {
  spreadsheetId?: unknown;
  spreadsheetUrl?: unknown;
  title?: unknown;
  timeZone?: unknown;
  totalRows?: unknown;
  totalColumns?: unknown;
  headers?: unknown;
  lastUpdated?: unknown;
}

function getSheetsEndpoint(path: "data" | "metadata"): string {
  const env = import.meta.env as Record<string, string | undefined> | undefined;

  const specificOverride =
    path === "data" ? env?.VITE_SHEETS_DATA_URL : env?.VITE_SHEETS_METADATA_URL;
  if (specificOverride && specificOverride.trim().length > 0) {
    return specificOverride.trim();
  }

  const baseOverride = env?.VITE_SHEETS_API_BASE_URL;
  if (baseOverride && baseOverride.trim().length > 0) {
    const normalizedBase = baseOverride.trim().replace(/\/$/, "");
    const normalizedPath = path === "data" ? "/data" : "/metadata";
    return `${normalizedBase}${normalizedPath}`;
  }

  return path === "data" ? DEFAULT_SHEETS_DATA_URL : DEFAULT_SHEETS_METADATA_URL;
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
    const typeLabel = contentType || "unknown";
    throw new Error(
      `Unexpected response from the Google Sheets ${context} endpoint. Expected JSON but received content-type "${typeLabel}". Response preview: ${preview}`,
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
      `Failed to parse Google Sheets ${context} response as JSON (${message}). Response preview: ${preview}`,
    );
  }
}

function generateSubmissionId(index: number): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `submission_${index}_${Math.random().toString(36).slice(2)}`;
}

function normalizeResults(value: unknown): RawSubmission[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item, index) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const submission = { ...(item as Record<string, unknown>) } as RawSubmission;
    if (submission._id == null && submission._uuid == null) {
      submission._id = generateSubmissionId(index);
    }
    return [submission];
  });
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeHeaders(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim());
}

export async function fetchSheetsAnalytics(): Promise<DashboardAnalytics> {
  const url = getSheetsEndpoint("data");
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
      `Unable to reach the Sheets analytics endpoint. Please check your internet connection and configuration. (${details})`,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  const rawBody = await response.text();

  if (!response.ok) {
    throw new Error(`Failed to fetch Google Sheets data (${response.status}): ${summarizeBody(rawBody)}`);
  }

  const payload = parseJsonResponse(rawBody, contentType, "data");
  const results = normalizeResults((payload as SheetsDataResponse | null | undefined)?.results);

  const analytics = buildAnalytics(results);

  return analytics;
}

export async function fetchSheetsMetadata(): Promise<SheetMetadataSummary> {
  const url = getSheetsEndpoint("metadata");
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
      `Unable to reach the Sheets metadata endpoint. Please verify your configuration. (${details})`,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  const rawBody = await response.text();

  if (!response.ok) {
    throw new Error(`Failed to fetch Sheets metadata (${response.status}): ${summarizeBody(rawBody)}`);
  }

  const payload = parseJsonResponse(rawBody, contentType, "metadata") as SheetsMetadataResponse | null;

  const spreadsheetId =
    typeof payload?.spreadsheetId === "string" && payload.spreadsheetId.trim().length > 0
      ? payload.spreadsheetId.trim()
      : "";
  if (!spreadsheetId) {
    throw new Error("Sheets metadata is missing a spreadsheetId field.");
  }

  const spreadsheetUrl =
    typeof payload?.spreadsheetUrl === "string" && payload.spreadsheetUrl.trim().length > 0
      ? payload.spreadsheetUrl.trim()
      : null;
  const title =
    typeof payload?.title === "string" && payload.title.trim().length > 0
      ? payload.title.trim()
      : "Untitled spreadsheet";
  const timeZone =
    typeof payload?.timeZone === "string" && payload.timeZone.trim().length > 0
      ? payload.timeZone.trim()
      : null;
  const totalRows = parseNumber(payload?.totalRows) ?? 0;
  const totalColumns = parseNumber(payload?.totalColumns) ?? 0;
  const headers = normalizeHeaders(payload?.headers);
  const lastUpdated =
    typeof payload?.lastUpdated === "string" && payload.lastUpdated.trim().length > 0
      ? payload.lastUpdated.trim()
      : null;

  return {
    spreadsheetId,
    spreadsheetUrl,
    title,
    timeZone,
    totalRows,
    totalColumns,
    headers,
    lastUpdated,
  };
}
