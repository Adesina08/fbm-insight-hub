import { createSign } from "node:crypto";

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
const TOKEN_LIFETIME_SECONDS = 3600;

interface ServiceAccountConfig {
  clientEmail: string;
  privateKey: string;
  tokenUri: string;
}

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

interface SpreadsheetConfig {
  spreadsheetId: string;
}

export interface SpreadsheetMetadata {
  spreadsheetId: string;
  spreadsheetUrl: string | null;
  title: string;
  timeZone: string | null;
}

let cachedServiceAccount: ServiceAccountConfig | null = null;
let cachedToken: CachedToken | null = null;
let cachedSpreadsheetConfig: SpreadsheetConfig | null = null;

function base64UrlEncode(value: string | Buffer): string {
  const buffer = typeof value === "string" ? Buffer.from(value) : value;
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function getServiceAccount(): ServiceAccountConfig {
  if (cachedServiceAccount) {
    return cachedServiceAccount;
  }

  const raw = process.env.GOOGLE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error("Missing required environment variable GOOGLE_SERVICE_ACCOUNT.");
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT must contain valid JSON credentials.");
  }

  const clientEmail = typeof parsed.client_email === "string" ? parsed.client_email : undefined;
  const privateKeyRaw = typeof parsed.private_key === "string" ? parsed.private_key : undefined;
  const tokenUri =
    typeof parsed.token_uri === "string" && parsed.token_uri.trim().length > 0
      ? parsed.token_uri.trim()
      : "https://oauth2.googleapis.com/token";

  if (!clientEmail || !privateKeyRaw) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT must include client_email and private_key fields.",
    );
  }

  const privateKey = privateKeyRaw.includes("BEGIN PRIVATE KEY")
    ? privateKeyRaw.replace(/\\n/g, "\n")
    : privateKeyRaw;

  cachedServiceAccount = {
    clientEmail,
    privateKey,
    tokenUri,
  };

  return cachedServiceAccount;
}

function getSpreadsheetConfig(): SpreadsheetConfig {
  if (cachedSpreadsheetConfig) {
    return cachedSpreadsheetConfig;
  }

  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  if (!spreadsheetId) {
    throw new Error("Missing required environment variable GOOGLE_SHEETS_ID.");
  }

  cachedSpreadsheetConfig = { spreadsheetId };
  return cachedSpreadsheetConfig;
}

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt - 60 > now) {
    return cachedToken.accessToken;
  }

  const { clientEmail, privateKey, tokenUri } = getServiceAccount();

  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      iss: clientEmail,
      scope: SHEETS_SCOPE,
      aud: tokenUri,
      exp: now + TOKEN_LIFETIME_SECONDS,
      iat: now,
    }),
  );

  const unsignedToken = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();
  const signature = base64UrlEncode(signer.sign(privateKey));
  const assertion = `${unsignedToken}.${signature}`;

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });

  const response = await fetch(tokenUri, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data || typeof data.access_token !== "string") {
    const details =
      data && typeof data.error_description === "string"
        ? data.error_description
        : data && typeof data.error === "string"
          ? data.error
          : "Unable to obtain Google access token.";
    throw new Error(details);
  }

  const expiresIn = typeof data.expires_in === "number" ? data.expires_in : TOKEN_LIFETIME_SECONDS;

  cachedToken = {
    accessToken: data.access_token,
    expiresAt: now + expiresIn,
  };

  return cachedToken.accessToken;
}

async function googleRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  let parsed: T | null = null;
  if (text.length > 0) {
    try {
      parsed = JSON.parse(text) as T;
    } catch (error) {
      throw new Error(`Failed to parse Google Sheets response: ${text.slice(0, 200)}`);
    }
  }

  if (!response.ok) {
    const message = parsed && typeof parsed === "object" && "error" in parsed
      ? JSON.stringify((parsed as Record<string, unknown>).error)
      : text || response.statusText;
    throw new Error(`Google Sheets request failed (${response.status}): ${message}`);
  }

  if (!parsed) {
    throw new Error("Google Sheets response was empty.");
  }

  return parsed;
}

export async function fetchSheetValues(range: string): Promise<unknown[][]> {
  const { spreadsheetId } = getSpreadsheetConfig();
  const encodedRange = encodeURIComponent(range);
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}` +
    "?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING";

  const payload = await googleRequest<{ values?: unknown[][] }>(url);
  return Array.isArray(payload.values) ? payload.values : [];
}

export async function fetchSpreadsheetMetadata(): Promise<SpreadsheetMetadata> {
  const { spreadsheetId } = getSpreadsheetConfig();
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}` +
    "?fields=spreadsheetId,spreadsheetUrl,properties(title,timeZone)";

  const payload = await googleRequest<{
    spreadsheetId?: string;
    spreadsheetUrl?: string;
    properties?: { title?: string; timeZone?: string };
  }>(url);

  const id = typeof payload.spreadsheetId === "string" ? payload.spreadsheetId : spreadsheetId;
  const spreadsheetUrl =
    typeof payload.spreadsheetUrl === "string" && payload.spreadsheetUrl.length > 0
      ? payload.spreadsheetUrl
      : null;
  const title =
    typeof payload.properties?.title === "string" && payload.properties.title.trim().length > 0
      ? payload.properties.title.trim()
      : "Untitled spreadsheet";
  const timeZone =
    typeof payload.properties?.timeZone === "string" && payload.properties.timeZone.trim().length > 0
      ? payload.properties.timeZone.trim()
      : null;

  return {
    spreadsheetId: id,
    spreadsheetUrl,
    title,
    timeZone,
  };
}

export interface SheetRecord extends Record<string, unknown> {}

export function convertSheetValuesToRecords(values: unknown[][]): SheetRecord[] {
  if (!Array.isArray(values) || values.length === 0) {
    return [];
  }

  const headerRow = values[0];
  if (!Array.isArray(headerRow)) {
    return [];
  }

  const headers = headerRow.map((cell, index) => {
    if (typeof cell === "string" && cell.trim().length > 0) {
      return cell.trim();
    }
    return `column_${index + 1}`;
  });

  const specialMap: Record<string, string> = {
    submission_time: "_submission_time",
    start_time: "start",
    end_time: "end",
    uuid: "_uuid",
    id: "_id",
  };

  return values.slice(1).flatMap((row, rowIndex) => {
    if (!Array.isArray(row)) {
      return [];
    }

    const record: SheetRecord = {};

    headers.forEach((header, columnIndex) => {
      const rawValue = row[columnIndex];
      if (rawValue === undefined || rawValue === null || rawValue === "") {
        return;
      }

      record[header] = rawValue;

      if (typeof header === "string") {
        const normalized = header
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "");

        if (normalized && normalized !== header) {
          record[normalized] = rawValue;
        }

        const mapped = specialMap[normalized];
        if (mapped) {
          record[mapped] = rawValue;
        }
      }
    });

    if (record._id == null) {
      record._id = rowIndex + 1;
    }

    return Object.keys(record).length > 0 ? [record] : [];
  });
}
