import { defineConfig } from "vite";
import type { PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

type SheetsProxyTarget = "data" | "metadata";

type HeadersMap = Record<string, string>;

function setCors(res: import("http").ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
}

function buildAuthHeaders(): HeadersMap {
  const headers: HeadersMap = { Accept: "application/json" };

  const apiKey = process.env.SHEETS_API_KEY;
  if (apiKey && apiKey.trim().length > 0) {
    headers["X-API-Key"] = apiKey.trim();
  }

  const bearer = process.env.SHEETS_BEARER_TOKEN;
  if (bearer && bearer.trim().length > 0) {
    headers.Authorization = `Bearer ${bearer.trim()}`;
  }

  const basicUser = process.env.SHEETS_BASIC_USER;
  const basicPass = process.env.SHEETS_BASIC_PASSWORD;
  if (basicUser && basicPass && basicUser.trim().length > 0 && basicPass.trim().length > 0) {
    const credentials = Buffer.from(`${basicUser.trim()}:${basicPass.trim()}`, "utf8").toString("base64");
    headers.Authorization = `Basic ${credentials}`;
  }

  return headers;
}

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/$/, "");
}

function resolveTargetUrl(target: SheetsProxyTarget): string | null {
  const directKey = target === "data" ? "SHEETS_DATA_URL" : "SHEETS_METADATA_URL";
  const directValue = process.env[directKey];
  if (directValue && directValue.trim().length > 0) {
    return directValue.trim();
  }

  const base = process.env.SHEETS_BASE_URL;
  const spreadsheetId = process.env.SHEETS_SPREADSHEET_ID;

  if (!base || !spreadsheetId) {
    return null;
  }

  const normalizedBase = normalizeBaseUrl(base);

  if (target === "metadata") {
    return `${normalizedBase}/spreadsheets/${spreadsheetId}`;
  }

  const worksheet = process.env.SHEETS_WORKSHEET_NAME;
  const sheetPath = worksheet ? `values/${encodeURIComponent(worksheet)}` : "values:batchGet";
  const query = worksheet ? "?alt=json" : `?ranges=${encodeURIComponent("A:ZZ")}`;
  return `${normalizedBase}/spreadsheets/${spreadsheetId}/${sheetPath}${query}`;
}

function createProxyHandler(targetUrl: string): import("connect").NextHandleFunction {
  const headers = buildAuthHeaders();

  return async (req, res, next) => {
    if (!req.url) {
      next();
      return;
    }

    const method = req.method?.toUpperCase() ?? "GET";
    if (method === "OPTIONS") {
      res.statusCode = 204;
      setCors(res);
      res.end();
      return;
    }

    if (method !== "GET") {
      next();
      return;
    }

    try {
      const response = await fetch(targetUrl, { headers });
      res.statusCode = response.status;
      setCors(res);
      res.setHeader("Content-Type", response.headers.get("content-type") ?? "application/json");
      const body = await response.text();
      res.end(body);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to contact Google Sheets.";
      res.statusCode = 502;
      setCors(res);
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: message }));
    }
  };
}

function createSheetsDevProxyPlugin(): PluginOption {
  return {
    name: "sheets-dev-proxy",
    configureServer(server) {
      const dataUrl = resolveTargetUrl("data");
      const metadataUrl = resolveTargetUrl("metadata");

      if (!dataUrl && !metadataUrl) {
        console.warn(
          "[sheets-dev-proxy] Configure SHEETS_DATA_URL/SHEETS_METADATA_URL (or SHEETS_BASE_URL + SHEETS_SPREADSHEET_ID) to enable local proxying.",
        );
        return;
      }

      if (dataUrl) {
        server.middlewares.use("/api/sheets-data", createProxyHandler(dataUrl));
      }
      if (metadataUrl) {
        server.middlewares.use("/api/sheets-metadata", createProxyHandler(metadataUrl));
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins: PluginOption[] = [react()];

  if (mode === "development") {
    plugins.push(componentTagger());
    plugins.push(createSheetsDevProxyPlugin());
  }

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
