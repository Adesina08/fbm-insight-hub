import { defineConfig } from "vite";
import type { PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs/promises";
import type { ServerResponse } from "http";
import { componentTagger } from "lovable-tagger";

const SAMPLE_DATA_PATH = path.resolve(__dirname, "fixtures/sample-sheets-data.json");

function setCors(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
}

function createSheetsDevProxyPlugin(): PluginOption {
  return {
    name: "sheets-dev-proxy",
    async configureServer(server) {
      let samplePayload: string | null = null;

      try {
        samplePayload = await fs.readFile(SAMPLE_DATA_PATH, "utf8");
      } catch (error) {
        console.warn(
          "[sheets-dev-proxy] Unable to load fixtures/sample-sheets-data.json. Requests will return an error until a Google Sheets backend is configured.",
          error instanceof Error ? error.message : error,
        );
      }

      server.middlewares.use("/api/sheets-data", async (req, res, next) => {
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

        if (!samplePayload) {
          res.statusCode = 502;
          setCors(res);
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({ error: "Google Sheets dev proxy is not configured and no sample data is available." }),
          );
          return;
        }

        res.statusCode = 200;
        setCors(res);
        res.setHeader("Content-Type", "application/json");
        res.end(samplePayload);
      });
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
