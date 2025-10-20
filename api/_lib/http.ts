import type { IncomingMessage, ServerResponse } from "http";
import type { Headers as FetchHeaders, Request as FetchRequest } from "undici";

type CorsTarget = ServerResponse | FetchHeaders;

function isFetchRequest(value: unknown): value is FetchRequest {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as FetchRequest).method === "string" &&
    typeof (value as FetchRequest).headers === "object"
  );
}

function isServerResponse(value: unknown): value is ServerResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ServerResponse).setHeader === "function" &&
    typeof (value as ServerResponse).end === "function"
  );
}

const CORS_ENTRIES: Array<[string, string]> = [
  ["Access-Control-Allow-Origin", "*"],
  ["Access-Control-Allow-Headers", "Content-Type, Authorization"],
  ["Access-Control-Allow-Methods", "GET,OPTIONS"],
];

export function setCorsHeaders(target: CorsTarget): void {
  for (const [key, value] of CORS_ENTRIES) {
    if (target instanceof Headers) {
      target.set(key, value);
    } else {
      target.setHeader(key, value);
    }
  }
}

export function createCorsHeaders(): FetchHeaders {
  const headers = new Headers();
  setCorsHeaders(headers);
  return headers;
}

export function handleOptionsRequest(req: IncomingMessage, res: ServerResponse): boolean;
export function handleOptionsRequest(req: FetchRequest): Response | null;
export function handleOptionsRequest(
  req: IncomingMessage | FetchRequest,
  res?: ServerResponse,
): boolean | Response | null {
  const method = (req as IncomingMessage).method ?? (req as FetchRequest).method;
  if (!method || method.toUpperCase() !== "OPTIONS") {
    return isFetchRequest(req) ? null : false;
  }

  if (isFetchRequest(req)) {
    return new Response(null, {
      status: 204,
      headers: createCorsHeaders(),
    });
  }

  if (!res) {
    return false;
  }

  setCorsHeaders(res);
  res.statusCode = 204;
  res.end();
  return true;
}

export function sendError(res: ServerResponse, status: number, message: string): void;
export function sendError(status: number, message: string): Response;
export function sendError(
  resOrStatus: ServerResponse | number,
  statusOrMessage: number | string,
  maybeMessage?: string,
): void | Response {
  if (isServerResponse(resOrStatus)) {
    const status = statusOrMessage as number;
    const message = maybeMessage ?? "Unknown error";
    setCorsHeaders(resOrStatus);
    resOrStatus.statusCode = status;
    resOrStatus.setHeader("Content-Type", "application/json");
    resOrStatus.end(JSON.stringify({ error: message }));
    return;
  }

  const status = resOrStatus;
  const message = statusOrMessage as string;
  return jsonResponse({ error: message }, status);
}

export function jsonResponse(payload: unknown, status = 200): Response {
  const headers = createCorsHeaders();
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(payload), {
    status,
    headers,
  });
}
