import type { IncomingMessage, ServerResponse } from "http";

import { handleOptionsRequest, jsonResponse, sendError, setCorsHeaders } from "./_lib/http";
import { convertSheetValuesToRecords, fetchSheetValues } from "./_lib/sheets";

interface SheetsDataResponse {
  count: number;
  results: Array<Record<string, unknown>>;
}

function getDataRange(): string {
  const range = process.env.GOOGLE_SHEETS_DATA_RANGE;
  if (!range || range.trim().length === 0) {
    throw new Error("Missing required environment variable GOOGLE_SHEETS_DATA_RANGE.");
  }
  return range.trim();
}

function sendJson(res: ServerResponse, payload: SheetsDataResponse): void {
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
    const values = await fetchSheetValues(range);
    const results = convertSheetValuesToRecords(values);
    return jsonResponse({
      count: results.length,
      results,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load Google Sheet data. Please try again later.";
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
    const values = await fetchSheetValues(range);
    const results = convertSheetValuesToRecords(values);
    sendJson(res, {
      count: results.length,
      results,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load Google Sheet data. Please try again later.";
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
