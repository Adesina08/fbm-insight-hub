import type { IncomingMessage, ServerResponse } from "http";
import { GoogleSheetsClient } from "@fbm/google-sheets-client";

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";

let cachedClient: GoogleSheetsClient | null = null;

function normalizePrivateKey(key: string): string {
  return key.replace(/\\n/g, "\n");
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable ${name}.`);
  }
  return value.trim();
}

function getSheetsClient(): GoogleSheetsClient {
  if (cachedClient) {
    return cachedClient;
  }

  const clientEmail = requireEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const privateKey = normalizePrivateKey(requireEnv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"));

  cachedClient = new GoogleSheetsClient({
    clientEmail,
    privateKey,
    scopes: [SHEETS_SCOPE],
  });
  return cachedClient;
}

export function setCorsHeaders(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
}

export function handleOptionsRequest(req: IncomingMessage, res: ServerResponse): boolean {
  if (req.method?.toUpperCase() !== "OPTIONS") {
    return false;
  }

  setCorsHeaders(res);
  res.statusCode = 204;
  res.end();
  return true;
}

export function sendError(res: ServerResponse, status: number, message: string): void {
  setCorsHeaders(res);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ error: message }));
}

export interface SheetFetchOptions {
  spreadsheetId: string;
  range: string;
}

function mapValuesToObjects(values: string[][]): Record<string, unknown>[] {
  if (values.length === 0) {
    return [];
  }

  const [headerRow, ...dataRows] = values;
  const headers = headerRow.map((cell) => (cell ?? "").trim());

  return dataRows.map((row, index) => {
    const entry: Record<string, unknown> = {};
    headers.forEach((header, columnIndex) => {
      if (!header) {
        return;
      }
      entry[header] = row[columnIndex] ?? "";
    });
    entry._rowIndex = index + 2; // account for header
    return entry;
  });
}

export async function fetchSheetRows({ spreadsheetId, range }: SheetFetchOptions): Promise<Record<string, unknown>[]> {
  const client = getSheetsClient();
  const values = await client.fetchValues(spreadsheetId, range);
  return mapValuesToObjects(values);
}
