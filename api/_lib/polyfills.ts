import {
  fetch as undiciFetch,
  Headers as UndiciHeaders,
  Request as UndiciRequest,
  Response as UndiciResponse,
} from "undici";

let polyfilled = false;

export function ensureFetchPolyfill(): void {
  if (polyfilled) return;

  if (typeof globalThis.fetch !== "function") {
    globalThis.fetch = undiciFetch as typeof globalThis.fetch;
  }

  if (typeof globalThis.Headers !== "function") {
    globalThis.Headers = UndiciHeaders as typeof globalThis.Headers;
  }

  if (typeof globalThis.Request !== "function") {
    globalThis.Request = UndiciRequest as typeof globalThis.Request;
  }

  if (typeof globalThis.Response !== "function") {
    globalThis.Response = UndiciResponse as typeof globalThis.Response;
  }

  polyfilled = true;
}
