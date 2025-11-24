import type { IncomingMessage, ServerResponse } from "http";

import { handleOptionsRequest, jsonResponse, sendError, setCorsHeaders } from "./_lib/http";
import {
  convertSheetValuesToRecords,
  extractHeaders,
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

  try {
    const metadata = await fetchSpreadsheetMetadata();
    const values = await fetchSheetValues(metadata.primarySheetTitle);

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

  try {
    const metadata = await fetchSpreadsheetMetadata();
    const values = await fetchSheetValues(metadata.primarySheetTitle);

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
