export interface SpreadsheetMetadata {
  spreadsheetId: string;
  spreadsheetUrl: string | null;
  title: string;
  timeZone: string | null;
  primarySheetTitle: string;
}

type LocalSheetData = {
  metadata: SpreadsheetMetadata;
  values: Record<string, unknown[][]>;
};

const LOCAL_PRIMARY_SHEET = "Survey Data";

const LOCAL_SHEETS: LocalSheetData = {
  metadata: {
    spreadsheetId: "local-spreadsheet",
    spreadsheetUrl: null,
    title: "Local Behavioural Insights",
    timeZone: "UTC",
    primarySheetTitle: LOCAL_PRIMARY_SHEET,
  },
  values: {
    [LOCAL_PRIMARY_SHEET]: [
      [
        "_submission_time",
        "motivation_score",
        "ability_score",
        "descriptive_norms",
        "injunctive_norms",
        "system_score",
        "current_use",
        "prompt_facilitator",
        "prompt_spark",
        "prompt_signal",
        "A1",
        "A2",
        "A3",
        "A4",
        "A5",
        "A6",
        "A7",
        "A8",
        "A9",
        "A10",
        "parity",
      ],
      [
        "2024-04-01T10:15:00Z",
        4,
        4.5,
        3.8,
        4.1,
        4.3,
        "yes",
        4,
        3.5,
        4.2,
        "Lagos",
        "Ikeja",
        "Urban",
        "Female",
        28,
        "Married",
        "Tertiary",
        "Christianity",
        "Employed",
        "Teacher",
        2,
      ],
      [
        "2024-04-03T09:05:00Z",
        3.2,
        3.6,
        3.1,
        3.4,
        3.7,
        "no",
        3,
        2.8,
        3.1,
        "Kano",
        "Nasarawa",
        "Rural",
        "Male",
        32,
        "Single",
        "Secondary",
        "Islam",
        "Self-employed",
        "Farmer",
        3,
      ],
      [
        "2024-04-06T14:40:00Z",
        4.7,
        4.2,
        4.5,
        4.6,
        4.4,
        "yes",
        4.8,
        4.2,
        4.5,
        "Lagos",
        "Alimosho",
        "Urban",
        "Female",
        24,
        "Single",
        "Tertiary",
        "Christianity",
        "Employed",
        "Nurse",
        1,
      ],
      [
        "2024-04-10T08:30:00Z",
        2.9,
        3,
        2.6,
        2.9,
        3.2,
        "no",
        2.4,
        2.1,
        2.7,
        "Kaduna",
        "Zaria",
        "Rural",
        "Male",
        30,
        "Married",
        "Secondary",
        "Islam",
        "Unemployed",
        "Student",
        0,
      ],
      [
        "2024-04-12T16:10:00Z",
        3.9,
        3.4,
        3.7,
        3.6,
        3.9,
        "yes",
        3.5,
        3.3,
        3.2,
        "Rivers",
        "Port Harcourt",
        "Urban",
        "Female",
        27,
        "Married",
        "Tertiary",
        "Christianity",
        "Employed",
        "Engineer",
        1,
      ],
    ],
  },
};

let cachedMetadata: SpreadsheetMetadata | null = null;

function cloneValues(values: unknown[][]): unknown[][] {
  return values.map((row) => (Array.isArray(row) ? [...row] : []));
}

export async function fetchSheetValues(range?: string): Promise<unknown[][]> {
  const sheetTitle = range ?? LOCAL_SHEETS.metadata.primarySheetTitle;
  const values = LOCAL_SHEETS.values[sheetTitle];

  if (!values) {
    throw new Error(`No local sheet data found for range "${sheetTitle}".`);
  }

  return cloneValues(values);
}

export async function fetchSpreadsheetMetadata(): Promise<SpreadsheetMetadata> {
  if (cachedMetadata) {
    return cachedMetadata;
  }

  cachedMetadata = { ...LOCAL_SHEETS.metadata };
  return cachedMetadata;
}

export async function getPrimarySheetTitle(): Promise<string> {
  if (cachedMetadata) {
    return cachedMetadata.primarySheetTitle;
  }

  const metadata = await fetchSpreadsheetMetadata();
  return metadata.primarySheetTitle;
}

export type SheetRecord = Record<string, unknown>;

type HeaderInfo = {
  label: string;
  normalized: string;
  baseNormalized: string;
};

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
