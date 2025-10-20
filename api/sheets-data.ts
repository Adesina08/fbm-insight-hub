import type { IncomingMessage, ServerResponse } from "http";

import {
  fetchSheetRows,
  handleOptionsRequest,
  sendError,
  setCorsHeaders,
} from "./_lib/googleSheets";

const DEFAULT_RANGE = "Form Responses 1!A1:Z";

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (handleOptionsRequest(req, res)) {
    return;
  }

  if (req.method?.toUpperCase() !== "GET") {
    sendError(res, 405, "Method Not Allowed");
    return;
  }

  let spreadsheetId: string;
  let range: string;

  try {
    spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim() ?? "";
    if (!spreadsheetId) {
      throw new Error("Missing required environment variable GOOGLE_SHEETS_SPREADSHEET_ID.");
    }
    range = process.env.GOOGLE_SHEETS_DATA_RANGE?.trim() || DEFAULT_RANGE;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Missing Google Sheets configuration.";
    sendError(res, 500, message);
    return;
  }

  try {
    const rows = await fetchSheetRows({ spreadsheetId, range });
    setCorsHeaders(res);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ results: rows }));
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Failed to contact Google Sheets. Please try again later.";
    sendError(res, 502, message);
  }
}
