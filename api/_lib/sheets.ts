interface SpreadsheetConfig {
  spreadsheetId: string;
  apiKey: string;
}

export interface SpreadsheetMetadata {
  spreadsheetId: string;
  spreadsheetUrl: string | null;
  title: string;
  timeZone: string | null;
}

let cachedSpreadsheetConfig: SpreadsheetConfig | null = null;

function getSpreadsheetConfig(): SpreadsheetConfig {
  if (cachedSpreadsheetConfig) {
    return cachedSpreadsheetConfig;
  }

  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  if (!spreadsheetId) {
    throw new Error("Missing required environment variable GOOGLE_SHEETS_ID.");
  }

  const apiKey = process.env.GOOGLE_SHEETS_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("Missing required environment variable GOOGLE_SHEETS_API_KEY or GOOGLE_API_KEY.");
  }

  cachedSpreadsheetConfig = { spreadsheetId: spreadsheetId.trim(), apiKey: apiKey.trim() };
  return cachedSpreadsheetConfig;
}

function buildSheetsUrl(path: string, searchParams?: Record<string, string>): string {
  const { apiKey } = getSpreadsheetConfig();
  const url = new URL(path, "https://sheets.googleapis.com");
  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  url.searchParams.set("key", apiKey);
  return url.toString();
}

async function googleRequest<T>(path: string, searchParams?: Record<string, string>, init?: RequestInit): Promise<T> {
  const response = await fetch(buildSheetsUrl(path, searchParams), {
    ...init,
    headers: {
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
  const payload = await googleRequest<{ values?: unknown[][] }>(
    `/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}`,
    {
      majorDimension: "ROWS",
      valueRenderOption: "UNFORMATTED_VALUE",
      dateTimeRenderOption: "FORMATTED_STRING",
    },
  );
  return Array.isArray(payload.values) ? payload.values : [];
}

export async function fetchSpreadsheetMetadata(): Promise<SpreadsheetMetadata> {
  const { spreadsheetId } = getSpreadsheetConfig();
  const payload = await googleRequest<{
    spreadsheetId?: string;
    spreadsheetUrl?: string;
    properties?: { title?: string; timeZone?: string };
  }>(`/v4/spreadsheets/${spreadsheetId}`, {
    fields: "spreadsheetId,spreadsheetUrl,properties(title,timeZone)",
  });

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
