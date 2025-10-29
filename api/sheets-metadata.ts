import type { IncomingMessage, ServerResponse } from "http";

import { handleOptionsRequest, jsonResponse, sendError, setCorsHeaders } from "./_lib/http";
import {
  convertSheetValuesToRecords,
  fetchSheetValues,
  fetchSpreadsheetMetadata,
  type SheetRecord,
} from "./_lib/sheets";

interface SheetInfoResponse {
  spreadsheetId: string;
  spreadsheetUrl: string | null;
  title: string;
  timeZone: string | null;
  totalRows: number;
  totalColumns: number;
  headers: string[];
  lastUpdated: string | null;
}

function getDataRange(): string {
  const range = process.env.GOOGLE_SHEETS_DATA_RANGE;
  if (!range || range.trim().length === 0) {
    throw new Error("Missing required environment variable GOOGLE_SHEETS_DATA_RANGE.");
  }
  return range.trim();
}

function parseTimestamp(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const time = Date.parse(trimmed);
  if (Number.isNaN(time)) {
    return null;
  }
  return new Date(time).toISOString();
}

function findSubmissionTimestamp(record: SheetRecord): string | null {
  const candidates = [
    "_submission_time",
    "submission_time",
    "end",
    "end_time",
    "start",
    "start_time",
    "timestamp",
    "last_updated",
  ];

  for (const key of candidates) {
    const value = record[key];
    const parsed = parseTimestamp(value);
    if (parsed) {
      return parsed;
    }
  }

  return null;
}

function computeLastUpdated(records: SheetRecord[]): string | null {
  let latest: string | null = null;
  for (const record of records) {
    const timestamp = findSubmissionTimestamp(record);
    if (!timestamp) continue;
    if (!latest || timestamp > latest) {
      latest = timestamp;
    }
  }
  return latest;
}

function extractHeaders(values: unknown[][]): string[] {
  if (!Array.isArray(values) || values.length === 0) {
    return [];
  }

  const headerRow = values[0];
  if (!Array.isArray(headerRow)) {
    return [];
  }

  return headerRow
    .map((cell) => (typeof cell === "string" ? cell.trim() : ""))
    .map((value, index) => (value.length > 0 ? value : `Column ${index + 1}`));
}

function sendJson(res: ServerResponse, payload: SheetInfoResponse): void {
  setCorsHeaders(res);
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function isFetchRequest(req: IncomingMessage | Request): req is Request {
  return typeof (req as Request).method === "string" && typeof (req as Request).headers === "object";
}

async function handleFetchRequest(req: Request): Promise<Response> {
  const optionsResponse = handleOptionsRequest(req);
  if (optionsResponse) {
    return optionsResponse;
  }

  if (req.method.toUpperCase() !== "GET") {
    return sendError(405, "Method Not Allowed");
  }

  let range: string;
  try {
    range = getDataRange();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Missing Google Sheets configuration.";
    return sendError(500, message);
  }

  try {
    const [metadata, values] = await Promise.all([
      fetchSpreadsheetMetadata(),
      fetchSheetValues(range),
    ]);

    const headers = extractHeaders(values);
    const records = convertSheetValuesToRecords(values);
    const lastUpdated = computeLastUpdated(records);

    return jsonResponse({
      spreadsheetId: metadata.spreadsheetId,
      spreadsheetUrl: metadata.spreadsheetUrl,
      title: metadata.title,
      timeZone: metadata.timeZone,
      totalRows: records.length,
      totalColumns: headers.length,
      headers,
      lastUpdated,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load Google Sheet metadata. Please try again later.";
    return sendError(502, message);
  }
}

async function handleNodeRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (handleOptionsRequest(req, res)) {
    return;
  }

  if (req.method?.toUpperCase() !== "GET") {
    sendError(res, 405, "Method Not Allowed");
    return;
  }

  let range: string;
  try {
    range = getDataRange();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Missing Google Sheets configuration.";
    sendError(res, 500, message);
    return;
  }

  try {
    const [metadata, values] = await Promise.all([
      fetchSpreadsheetMetadata(),
      fetchSheetValues(range),
    ]);

    const headers = extractHeaders(values);
    const records = convertSheetValuesToRecords(values);
    const lastUpdated = computeLastUpdated(records);

    sendJson(res, {
      spreadsheetId: metadata.spreadsheetId,
      spreadsheetUrl: metadata.spreadsheetUrl,
      title: metadata.title,
      timeZone: metadata.timeZone,
      totalRows: records.length,
      totalColumns: headers.length,
      headers,
      lastUpdated,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load Google Sheet metadata. Please try again later.";
    sendError(res, 502, message);
  }
}

export default async function handler(
  req: IncomingMessage | Request,
  res?: ServerResponse,
): Promise<Response | void> {
  if (isFetchRequest(req)) {
    return handleFetchRequest(req);
  }

  if (!res) {
    throw new Error("ServerResponse is required for Node.js handlers.");
  }

  await handleNodeRequest(req, res);
}
