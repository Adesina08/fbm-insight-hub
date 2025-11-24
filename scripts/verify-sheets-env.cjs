#!/usr/bin/env node

const requiredFields = ["GOOGLE_SHEETS_ID"];
const missing = requiredFields.filter((key) => !process.env[key] || process.env[key].trim().length === 0);

const hasServiceAccountJson = (key) => typeof key === "string" && key.trim().length > 0;
const hasServiceAccount =
  hasServiceAccountJson(process.env.GOOGLE_SERVICE_ACCOUNT) ||
  hasServiceAccountJson(process.env.GOOGLE_SERVICE_ACCOUNT_BASE64) ||
  hasServiceAccountJson(process.env.GOOGLE_SERVICE_ACCOUNT_B64) ||
  (hasServiceAccountJson(process.env.GOOGLE_CLIENT_EMAIL) && hasServiceAccountJson(process.env.GOOGLE_PRIVATE_KEY));

if (missing.length > 0 || !hasServiceAccount) {
  console.error("Google Sheets configuration is missing required environment variables:\n");
  missing.forEach((key) => {
    console.error(`- ${key} is required.`);
  });

  if (!hasServiceAccount) {
    console.error("- Provide GOOGLE_SERVICE_ACCOUNT (JSON or base64) or GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY.");
  }

  console.error("\nSet these variables in your Netlify site settings or your local .env file before building.");
  process.exit(1);
}

console.log("Google Sheets environment variables detected. Proceeding with build.");
