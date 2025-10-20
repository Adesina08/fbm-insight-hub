import { defineConfig } from "vite";
import type { PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
export default defineConfig(({ mode }) => {
  const plugins: PluginOption[] = [react()];

  if (mode === "development") {
    plugins.push(componentTagger());
    plugins.push({
      name: "api-middleware",
      async configureServer(server) {
        let sheetsDataHandler: any;
        let sheetsMetaHandler: any;

        async function loadHandlers() {
          if (!sheetsDataHandler || !sheetsMetaHandler) {
            const [dataModule, metaModule] = await Promise.all([
              import("./api/sheets-data.ts"),
              import("./api/sheets-metadata.ts"),
            ]);

            sheetsDataHandler = dataModule.default;
            sheetsMetaHandler = metaModule.default;
          }
        }

        server.middlewares.use(async (req, res, next) => {
          const rawUrl = req.url?.split("?")[0] ?? "";
          const base = (server.config.base ?? "").replace(/\/$/, "");
          const strippedUrl =
            base && rawUrl.startsWith(base) ? rawUrl.slice(base.length) : rawUrl;
          const url = strippedUrl.startsWith("/") ? strippedUrl : `/${strippedUrl}`;
          const method = req.method?.toUpperCase();

          if (
            method === "GET" &&
            (url === "/api/sheets-data" || url === "/api/sheets-metadata")
          ) {
            await loadHandlers();
            if (url === "/api/sheets-data") {
              return sheetsDataHandler(req, res);
            }

            return sheetsMetaHandler(req, res);
          }

          return next();
        });
      },
    } as PluginOption);
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
