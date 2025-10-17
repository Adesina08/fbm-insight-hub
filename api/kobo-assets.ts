import type { IncomingMessage, ServerResponse } from "http";

import {
  fetchFromKobo,
  handleOptionsRequest,
  relayKoboResponse,
  sendError,
} from "./_lib/kobo";

const DEFAULT_QUERY = new URLSearchParams({
  format: "json",
  metadata: "on",
  ordering: "-date_modified",
  collections_first: "true",
});

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (handleOptionsRequest(req, res)) {
    return;
  }

  if (req.method?.toUpperCase() !== "GET") {
    sendError(res, 405, "Method Not Allowed");
    return;
  }

  const query = DEFAULT_QUERY.toString();

  try {
    const response = await fetchFromKobo(`/api/v2/assets/?${query}`);
    await relayKoboResponse(res, response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to contact Kobo. Please try again later.";
    sendError(res, 502, message);
  }
}
