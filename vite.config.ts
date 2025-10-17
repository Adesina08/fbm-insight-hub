import { defineConfig } from "vite";
import type { PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const DEFAULT_KOBO_BASE_URL = "https://kf.kobotoolbox.org";

function createKoboDevProxyPlugin(): PluginOption {
  return {
    name: "kobo-dev-proxy",
    configureServer(server) {
      const assetId = process.env.KOBO_ASSET_ID;
      const token = process.env.KOBO_TOKEN;

      if (!assetId || !token) {
        console.warn(
          "[kobo-dev-proxy] KOBO_ASSET_ID or KOBO_TOKEN is not set. Kobo requests will be skipped in development.",
        );
        return;
      }

      const baseUrl = (process.env.KOBO_BASE_URL ?? DEFAULT_KOBO_BASE_URL).replace(/\/$/, "");

      server.middlewares.use("/api/kobo", async (req, res, next) => {
        if (!req.url) {
          next();
          return;
        }

        const method = req.method?.toUpperCase() ?? "GET";
        if (method === "OPTIONS") {
          res.statusCode = 204;
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
          res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
          res.end();
          return;
        }

        if (method !== "GET") {
          next();
          return;
        }

        const path = req.url.startsWith("/") ? req.url : `/${req.url}`;

        let target: string | null = null;
        if (path === "/data" || path.startsWith("/data?")) {
          target = `${baseUrl}/api/v2/assets/${assetId}/data/?format=json`;
        } else if (path === "/assets" || path.startsWith("/assets")) {
          const params = new URLSearchParams({
            format: "json",
            metadata: "on",
            ordering: "-date_modified",
            collections_first: "true",
          });
          target = `${baseUrl}/api/v2/assets/?${params.toString()}`;
        }

        if (!target) {
          next();
          return;
        }

        try {
          const response = await fetch(target, {
            headers: {
              Authorization: `Token ${token}`,
              Accept: "application/json",
            },
          });

          res.statusCode = response.status;
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
          res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
          res.setHeader("Content-Type", response.headers.get("content-type") ?? "application/json");
          const body = await response.text();
          res.end(body);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to contact Kobo.";
          res.statusCode = 502;
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
          res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: message }));
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins: PluginOption[] = [react()];

  if (mode === "development") {
    plugins.push(componentTagger());
    plugins.push(createKoboDevProxyPlugin());
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
