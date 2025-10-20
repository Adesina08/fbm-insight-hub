import { buildAnalytics, type DashboardAnalytics, type RawSubmission } from "./analytics";

const DEFAULT_SHEETS_API_URL = "/api";

interface SheetsApiResponse {
  headers?: unknown;
  rows?: unknown;
  updatedAt?: unknown;
}

export async function fetchSheetsAnalytics(): Promise<DashboardAnalytics> {
  const url = getSheetsApiUrl();
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
      `Unable to reach the analytics API. Please check your internet connection and configuration. (${details})`,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  const rawBody = await response.text();

  if (!response.ok) {
    throw new Error(`Failed to fetch analytics data (${response.status}): ${summarizeBody(rawBody)}`);
  }

  if (!contentType.toLowerCase().includes("json")) {
    const preview = summarizeBody(rawBody);
    const typeLabel = contentType || "unknown";
    throw new Error(
      `Unexpected response from the analytics API. Expected JSON but received content-type \"${typeLabel}\". Response preview: ${preview}`,
    );
  }

  let payload: SheetsApiResponse = {};
  if (rawBody.trim().length > 0) {
    try {
      payload = JSON.parse(rawBody) as SheetsApiResponse;
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : "Unknown parser error.";
      const preview = summarizeBody(rawBody);
      throw new Error(`Failed to parse analytics response as JSON (${message}). Response preview: ${preview}`);
    }
  }

  const headers = normalizeHeaders(payload.headers);
  const rows = normalizeRows(payload.rows);
  const submissions = convertToRawSubmissions(headers, rows);

  const analytics = buildAnalytics(submissions);

  if (typeof payload.updatedAt === "string" && payload.updatedAt.trim().length > 0) {
    analytics.lastUpdated = payload.updatedAt;
  }

  return analytics;
}

function getSheetsApiUrl(): string {
  const env = import.meta.env as Record<string, string | undefined> | undefined;
  const override = env?.VITE_SHEETS_API_URL;
  if (override && override.trim().length > 0) {
    return override.trim();
  }
  return DEFAULT_SHEETS_API_URL;
}

function normalizeHeaders(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim());
}

function normalizeRows(value: unknown): unknown[][] {
  if (!Array.isArray(value)) return [];
  return value.filter((row): row is unknown[] => Array.isArray(row));
}

function convertToRawSubmissions(headers: string[], rows: unknown[][]): RawSubmission[] {
  return rows.map((row, index) => {
    const submission: RawSubmission = {};
    headers.forEach((header, columnIndex) => {
      if (row.length <= columnIndex) return;
      submission[header] = row[columnIndex];
    });

    if (submission._id == null && submission._uuid == null) {
      submission._id = index;
    }

    return submission;
  });
}

function summarizeBody(body: string, limit = 120): string {
  if (!body) return "<empty response>";
  const normalized = body.replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit)}…`;
}
