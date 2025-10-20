import type { IncomingMessage, ServerResponse } from "http";

export function setCorsHeaders(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
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
