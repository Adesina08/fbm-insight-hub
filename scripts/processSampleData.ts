import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildAnalytics } from "../src/lib/googleSheets";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const dataPath = path.resolve(__dirname, "../fixtures/sample-sheets-data.json");
  const raw = JSON.parse(await fs.readFile(dataPath, "utf8"));
  const results = Array.isArray(raw.results) ? raw.results : [];
  const analytics = buildAnalytics(results as any);

  const summary = {
    totalRespondents: analytics.stats.totalRespondents.value,
    currentUsers: analytics.stats.currentUsers.value,
    quadrantCounts: analytics.quadrants.map((quadrant) => ({ id: quadrant.id, count: quadrant.count })),
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
