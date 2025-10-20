import { defineConfig } from "vite";
import type { PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

export default defineConfig(({ mode }) => {
  const plugins: PluginOption[] = [react()];

  if (mode === "development") {
    plugins.push(componentTagger());
    plugins.push({
      name: "api-middleware",
      configureServer(server) {
        const sheetsData = require("./api/sheets-data").default;
        const sheetsMeta = require("./api/sheets-metadata").default;

        server.middlewares.use(async (req, res, next) => {
          const url = req.url?.split("?")[0] ?? "";
          const method = req.method?.toUpperCase();

          if (method === "GET" && url === "/api/sheets-data") {
            await sheetsData(req, res);
            return;
          }

          if (method === "GET" && url === "/api/sheets-metadata") {
            await sheetsMeta(req, res);
            return;
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
