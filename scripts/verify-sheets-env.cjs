#!/usr/bin/env node

const requiredFields = ["GOOGLE_SHEETS_ID", "GOOGLE_SHEETS_DATA_RANGE"];
const missing = requiredFields.filter((key) => !process.env[key] || process.env[key].trim().length === 0);

const apiKey = process.env.GOOGLE_SHEETS_API_KEY || process.env.GOOGLE_API_KEY;
const hasApiKey = typeof apiKey === "string" && apiKey.trim().length > 0;

if (missing.length > 0 || !hasApiKey) {
  console.error("Google Sheets configuration is missing required environment variables:\n");
  missing.forEach((key) => {
    console.error(`- ${key} is required.`);
  });

  if (!hasApiKey) {
    console.error("- Provide GOOGLE_SHEETS_API_KEY or GOOGLE_API_KEY.");
  }

  console.error("\nSet these variables in your Netlify site settings or your local .env file before building.");
  process.exit(1);
}

console.log("Google Sheets environment variables detected. Proceeding with build.");
