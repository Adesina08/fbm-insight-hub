import type { IncomingMessage, ServerResponse } from "http";

import {
  fetchFromKobo,
  getKoboAssetId,
  handleOptionsRequest,
  relayKoboResponse,
  sendError,
} from "./_lib/kobo";

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (handleOptionsRequest(req, res)) {
    return;
  }

  if (req.method?.toUpperCase() !== "GET") {
    sendError(res, 405, "Method Not Allowed");
    return;
  }

  let assetId: string;
  try {
    assetId = getKoboAssetId();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Missing Kobo configuration.";
    sendError(res, 500, message);
    return;
  }

  try {
    const response = await fetchFromKobo(`/api/v2/assets/${assetId}/data/?format=json`);
    await relayKoboResponse(res, response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to contact Kobo. Please try again later.";
    sendError(res, 502, message);
  }
}
