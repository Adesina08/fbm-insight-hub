import type { IncomingMessage, ServerResponse } from "http";

const DEFAULT_KOBO_BASE_URL = "https://kf.kobotoolbox.org";

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/$/, "");
}

export function getKoboBaseUrl(): string {
  const raw = process.env.KOBO_BASE_URL ?? DEFAULT_KOBO_BASE_URL;
  return normalizeBaseUrl(raw);
}

export function getKoboToken(): string {
  const token = process.env.KOBO_TOKEN;
  if (!token) {
    throw new Error("Missing required environment variable KOBO_TOKEN.");
  }
  return token;
}

export function getKoboAssetId(): string {
  const assetId = process.env.KOBO_ASSET_ID;
  if (!assetId) {
    throw new Error("Missing required environment variable KOBO_ASSET_ID.");
  }
  return assetId;
}

export function setCorsHeaders(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
}

export function handleOptionsRequest(
  req: IncomingMessage,
  res: ServerResponse,
): boolean {
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

export async function relayKoboResponse(res: ServerResponse, response: Response): Promise<void> {
  setCorsHeaders(res);
  res.statusCode = response.status;
  const contentType = response.headers.get("content-type") ?? "application/json";
  res.setHeader("Content-Type", contentType);
  const body = await response.text();
  res.end(body);
}

export async function fetchFromKobo(path: string): Promise<Response> {
  const baseUrl = getKoboBaseUrl();
  const token = getKoboToken();
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  return fetch(url, {
    headers: {
      Authorization: `Token ${token}`,
      Accept: "application/json",
    },
  });
}
