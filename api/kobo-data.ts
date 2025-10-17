import type { IncomingMessage, ServerResponse } from "http";

import { handleOptionsRequest, sendError, setCorsHeaders } from "./_lib/kobo";
import { convertSheetValuesToRecords, fetchSheetValues } from "./_lib/sheets";

interface KoboLikeResponse {
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

function sendJson(res: ServerResponse, payload: KoboLikeResponse): void {
  setCorsHeaders(res);
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
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
    const message =
      error instanceof Error ? error.message : "Missing Google Sheets configuration.";
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
