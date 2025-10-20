import type { IncomingMessage, ServerResponse } from "http";

type HeadersMap = Record<string, string>;

function normalizeUrl(value: string): string {
  return value.trim().replace(/\/$/, "");
}

export function getSheetsDataUrl(): string {
  const direct = process.env.SHEETS_DATA_URL;
  if (direct && direct.trim().length > 0) {
    return direct.trim();
  }

  const base = process.env.SHEETS_BASE_URL;
  const spreadsheetId = process.env.SHEETS_SPREADSHEET_ID;
  const worksheet = process.env.SHEETS_WORKSHEET_NAME;

  if (base && spreadsheetId) {
    const normalizedBase = normalizeUrl(base);
    const sheetPath = worksheet ? `values/${encodeURIComponent(worksheet)}` : "values:batchGet";
    const query = worksheet ? "?alt=json" : `?ranges=${encodeURIComponent("A:ZZ")}`;
    return `${normalizedBase}/spreadsheets/${spreadsheetId}/${sheetPath}${query}`;
  }

  throw new Error(
    "Missing required configuration. Set SHEETS_DATA_URL or provide SHEETS_BASE_URL, SHEETS_SPREADSHEET_ID, and optionally SHEETS_WORKSHEET_NAME.",
  );
}

export function getSheetsMetadataUrl(): string {
  const direct = process.env.SHEETS_METADATA_URL;
  if (direct && direct.trim().length > 0) {
    return direct.trim();
  }

  const base = process.env.SHEETS_BASE_URL;
  const spreadsheetId = process.env.SHEETS_SPREADSHEET_ID;

  if (base && spreadsheetId) {
    const normalizedBase = normalizeUrl(base);
    return `${normalizedBase}/spreadsheets/${spreadsheetId}`;
  }

  throw new Error(
    "Missing required configuration. Set SHEETS_METADATA_URL or provide SHEETS_BASE_URL and SHEETS_SPREADSHEET_ID.",
  );
}

function buildAuthHeaders(): HeadersMap {
  const headers: HeadersMap = { Accept: "application/json" };

  const apiKey = process.env.SHEETS_API_KEY;
  if (apiKey && apiKey.trim().length > 0) {
    headers["X-API-Key"] = apiKey.trim();
  }

  const bearer = process.env.SHEETS_BEARER_TOKEN;
  if (bearer && bearer.trim().length > 0) {
    headers.Authorization = `Bearer ${bearer.trim()}`;
  }

  const basicUser = process.env.SHEETS_BASIC_USER;
  const basicPass = process.env.SHEETS_BASIC_PASSWORD;
  if (basicUser && basicPass && basicUser.trim().length > 0 && basicPass.trim().length > 0) {
    const credentials = Buffer.from(`${basicUser.trim()}:${basicPass.trim()}`, "utf8").toString("base64");
    headers.Authorization = `Basic ${credentials}`;
  }

  return headers;
}

export function setCorsHeaders(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
}

export function handleOptionsRequest(req: IncomingMessage, res: ServerResponse): boolean {
  if (req.method?.toUpperCase() !== "OPTIONS") {
    return false;
  }

  setCorsHeaders(res);
  res.statusCode = 204;
  res.end();
  return true;
}

export function sendError(res: ServerResponse, status: number, message: string): void {
  setCorsHeaders(res);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ error: message }));
}

export async function relaySheetsResponse(res: ServerResponse, response: Response): Promise<void> {
  setCorsHeaders(res);
  res.statusCode = response.status;
  const contentType = response.headers.get("content-type") ?? "application/json";
  res.setHeader("Content-Type", contentType);
  const body = await response.text();
  res.end(body);
}

export async function fetchFromSheets(url: string): Promise<Response> {
  return fetch(url, {
    headers: buildAuthHeaders(),
  });
}
