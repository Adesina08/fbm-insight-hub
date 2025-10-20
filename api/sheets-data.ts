import type { IncomingMessage, ServerResponse } from "http";

import {
  fetchFromSheets,
  getSheetsDataUrl,
  handleOptionsRequest,
  relaySheetsResponse,
  sendError,
} from "./_lib/sheets";

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (handleOptionsRequest(req, res)) {
    return;
  }

  if (req.method?.toUpperCase() !== "GET") {
    sendError(res, 405, "Method Not Allowed");
    return;
  }

  let dataUrl: string;
  try {
    dataUrl = getSheetsDataUrl();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Missing Google Sheets configuration. Set SHEETS_DATA_URL or related env vars.";
    sendError(res, 500, message);
    return;
  }

  try {
    const response = await fetchFromSheets(dataUrl);
    await relaySheetsResponse(res, response);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to contact Google Sheets. Please try again later.";
    sendError(res, 502, message);
  }
}
