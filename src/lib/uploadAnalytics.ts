import { buildAnalytics, type DashboardAnalytics, type RawSubmission } from "./analytics";

interface CsvParseOptions {
  delimiter?: string;
}

function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n?/g, "\n");
}

function stripBom(text: string): string {
  return text.replace(/^\uFEFF/, "");
}

function parseCsvRows(input: string, options: CsvParseOptions = {}): string[][] {
  const delimiter = options.delimiter ?? ",";
  const normalized = normalizeLineEndings(stripBom(input));
  const rows: string[][] = [];
  let currentField = "";
  let currentRow: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];

    if (inQuotes) {
      if (char === "\"") {
        const nextChar = normalized[index + 1];
        if (nextChar === "\"") {
          currentField += "\"";
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
      continue;
    }

    if (char === "\"") {
      inQuotes = true;
      continue;
    }

    if (char === delimiter) {
      currentRow.push(currentField);
      currentField = "";
      continue;
    }

    if (char === "\n") {
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = "";
      continue;
    }

    currentField += char;
  }

  if (inQuotes) {
    throw new Error("The CSV file appears to have an unterminated quoted value.");
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows.filter((row) => row.some((cell) => cell.trim().length > 0));
}

function makeUniqueHeaders(headers: string[]): string[] {
  const seen = new Map<string, number>();
  return headers.map((rawHeader, index) => {
    const normalized = rawHeader.trim();
    if (!normalized) {
      return `column_${index + 1}`;
    }
    const count = seen.get(normalized) ?? 0;
    seen.set(normalized, count + 1);
    if (count === 0) {
      return normalized;
    }
    return `${normalized}_${count + 1}`;
  });
}

function convertRowsToSubmissions(rows: string[][]): RawSubmission[] {
  if (rows.length === 0) {
    return [];
  }

  const [headerRow, ...dataRows] = rows;
  const headers = makeUniqueHeaders(headerRow);

  return dataRows
    .map((row, rowIndex) => {
      const submission: RawSubmission = {};
      headers.forEach((header, columnIndex) => {
        if (!header) {
          return;
        }
        const rawValue = row[columnIndex] ?? "";
        const value = rawValue.trim();
        if (value.length === 0) {
          return;
        }
        submission[header] = value;
      });

      if (!submission._id && !submission._uuid) {
        submission._id = `upload_row_${rowIndex + 1}`;
      }

      return submission;
    })
    .filter((submission) => Object.keys(submission).length > 0);
}

export interface UploadedAnalyticsResult {
  analytics: DashboardAnalytics;
  submissions: RawSubmission[];
  rowCount: number;
}

export function parseCsvToAnalytics(csvText: string): UploadedAnalyticsResult {
  const rows = parseCsvRows(csvText);
  if (rows.length === 0) {
    throw new Error("The uploaded file is empty.");
  }

  const submissions = convertRowsToSubmissions(rows);
  if (submissions.length === 0) {
    throw new Error("No valid rows were detected in the uploaded CSV.");
  }

  const analytics = buildAnalytics(submissions);
  return {
    analytics,
    submissions,
    rowCount: submissions.length,
  };
}

export async function parseUploadedDataset(file: File): Promise<UploadedAnalyticsResult> {
  const text = await file.text();
  if (!text || text.trim().length === 0) {
    throw new Error("The uploaded file did not contain any data.");
  }
  return parseCsvToAnalytics(text);
}
