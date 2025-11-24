export interface SpreadsheetMetadata {
  spreadsheetId: string;
  spreadsheetUrl: string | null;
  title: string;
  timeZone: string | null;
  primarySheetTitle: string;
}

export type SheetRecord = Record<string, unknown>;

type HeaderInfo = {
  label: string;
  normalized: string;
  baseNormalized: string;
};

type GvizCell = {
  v: unknown;
  f?: string;
};

type GvizRow = {
  c?: (GvizCell | null)[];
};

type GvizColumn = {
  label?: string;
  id?: string;
};

type GvizTable = {
  cols?: GvizColumn[];
  rows?: GvizRow[];
  props?: {
    sheetName?: string;
    title?: string;
    timeZone?: string;
  };
};

type GvizResponse = {
  table?: GvizTable;
};

const SPREADSHEET_ID = "1yKC2mbdaHO3o7e4JRu9GEGyjlhSl9GhvEeC9pUIxxoQ";
const PRIMARY_SHEET_GID = "0";
const SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit?gid=${PRIMARY_SHEET_GID}`;

let cachedMetadata: SpreadsheetMetadata | null = null;
const cachedValues = new Map<string, unknown[][]>();

function cloneValues(values: unknown[][]): unknown[][] {
  return values.map((row) => (Array.isArray(row) ? [...row] : []));
}

function normalizeKey(value: string, fallback: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_");

  return normalized.length > 0 ? normalized : fallback;
}

function dedupeValue(value: string, seen: Map<string, number>): string {
  const count = seen.get(value) ?? 0;
  seen.set(value, count + 1);
  return count === 0 ? value : `${value} (${count + 1})`;
}

function buildHeaderInfo(values: unknown[][]): HeaderInfo[] {
  if (!Array.isArray(values) || values.length === 0) {
    return [];
  }

  const headerRow = values[0];
  if (!Array.isArray(headerRow)) {
    return [];
  }

  const displayCounts = new Map<string, number>();
  const normalizedCounts = new Map<string, number>();

  return headerRow.map((cell, index) => {
    const baseLabel =
      typeof cell === "string" && cell.trim().length > 0 ? cell.trim() : `Column ${index + 1}`;
    const label = dedupeValue(baseLabel, displayCounts);

    const baseNormalized = normalizeKey(baseLabel, `column_${index + 1}`);
    const normalized = dedupeValue(baseNormalized, normalizedCounts);

    return { label, normalized, baseNormalized };
  });
}

function parseGvizResponse(raw: string): GvizResponse {
  const match = raw.match(/google\.visualization\.Query\.setResponse\((.*)\);?/s);
  if (!match || !match[1]) {
    throw new Error("Unexpected response format from Google Sheets.");
  }

  return JSON.parse(match[1]);
}

function extractValuesFromTable(table: GvizTable | undefined): unknown[][] {
  if (!table) {
    return [];
  }

  const headers = (table.cols ?? []).map((column, index) => {
    if (column.label && column.label.trim().length > 0) {
      return column.label.trim();
    }
    if (column.id && column.id.trim().length > 0) {
      return column.id.trim();
    }
    return `Column ${index + 1}`;
  });

  const rows = (table.rows ?? []).map((row) => {
    const cells = row.c ?? [];
    return headers.map((_, index) => {
      const cell = cells[index];
      if (!cell) return null;
      if (typeof cell === "object" && "f" in cell && cell.f != null) {
        return cell.f;
      }
      if (typeof cell === "object" && "v" in cell) {
        return (cell as GvizCell).v;
      }
      return null;
    });
  });

  return [headers, ...rows];
}

function trimLeadingEmptyColumns(values: unknown[][]): unknown[][] {
  if (!Array.isArray(values) || values.length === 0) {
    return values;
  }

  const headerRow = values[0];
  if (!Array.isArray(headerRow) || headerRow.length === 0) {
    return values;
  }

  const firstNonEmptyHeaderIndex = headerRow.findIndex(
    (cell) => typeof cell === "string" && cell.trim().length > 0,
  );

  if (firstNonEmptyHeaderIndex <= 0) {
    return values;
  }

  return values.map((row) => {
    if (!Array.isArray(row)) {
      return row;
    }

    return row.slice(firstNonEmptyHeaderIndex);
  });
}

function buildMetadata(table: GvizTable | undefined): SpreadsheetMetadata {
  if (cachedMetadata) {
    return cachedMetadata;
  }

  const primarySheetTitle =
    table?.props?.sheetName?.trim() && table.props.sheetName.trim().length > 0
      ? table.props.sheetName.trim()
      : `gid:${PRIMARY_SHEET_GID}`;

  const title =
    table?.props?.title?.trim() && table.props.title.trim().length > 0
      ? table.props.title.trim()
      : "Google Sheets Data";

  cachedMetadata = {
    spreadsheetId: SPREADSHEET_ID,
    spreadsheetUrl: SPREADSHEET_URL,
    title,
    timeZone: table?.props?.timeZone ?? null,
    primarySheetTitle,
  };

  return cachedMetadata;
}

function getCacheKey(range?: string): string {
  if (range?.startsWith("gid:")) {
    return range;
  }

  if (range && range.trim().length > 0) {
    return range.trim();
  }

  return `gid:${PRIMARY_SHEET_GID}`;
}

async function fetchRemoteSheet(range?: string): Promise<{ values: unknown[][]; metadata: SpreadsheetMetadata }> {
  const params = new URLSearchParams({
    tqx: "out:json",
  });

  const cacheKey = getCacheKey(range);

  if (range?.startsWith("gid:")) {
    params.set("gid", range.replace(/^gid:/, ""));
  } else {
    params.set("gid", PRIMARY_SHEET_GID);
  }

  if (range && !range.startsWith("gid:")) {
    params.set("sheet", range);
  }

  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load Google Sheet data (status ${response.status}).`);
  }

  const raw = await response.text();
  const parsed = parseGvizResponse(raw);
  const values = trimLeadingEmptyColumns(extractValuesFromTable(parsed.table));
  const metadata = buildMetadata(parsed.table);

  cachedValues.set(cacheKey, values);
  return { values, metadata };
}

export async function fetchSheetValues(range?: string): Promise<unknown[][]> {
  const cacheKey = getCacheKey(range);
  const cached = cachedValues.get(cacheKey);
  if (cached) {
    return cloneValues(cached);
  }

  const { values } = await fetchRemoteSheet(range);
  return cloneValues(values);
}

export async function fetchSpreadsheetMetadata(): Promise<SpreadsheetMetadata> {
  if (cachedMetadata) {
    return cachedMetadata;
  }

  const { metadata } = await fetchRemoteSheet();
  return metadata;
}

export async function getPrimarySheetTitle(): Promise<string> {
  if (cachedMetadata) {
    return cachedMetadata.primarySheetTitle;
  }

  const metadata = await fetchSpreadsheetMetadata();
  return metadata.primarySheetTitle;
}

export function extractHeaders(values: unknown[][]): string[] {
  return buildHeaderInfo(values).map((header) => header.label);
}

export function convertSheetValuesToRecords(values: unknown[][]): SheetRecord[] {
  const headers = buildHeaderInfo(values);
  if (headers.length === 0) {
    return [];
  }

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

      record[header.label] = rawValue;

      if (header.normalized && header.normalized !== header.label) {
        record[header.normalized] = rawValue;
      }

      const mapped = specialMap[header.baseNormalized];
      if (mapped) {
        record[mapped] = rawValue;
      }
    });

    if (record._id == null) {
      record._id = rowIndex + 1;
    }

    return Object.keys(record).length > 0 ? [record] : [];
  });
}
