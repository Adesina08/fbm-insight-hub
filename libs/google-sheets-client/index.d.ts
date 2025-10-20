export interface GoogleSheetsClientOptions {
  clientEmail: string;
  privateKey: string;
  scopes?: string[];
}

export declare class GoogleSheetsClient {
  constructor(options: GoogleSheetsClientOptions);
  fetchValues(spreadsheetId: string, range: string): Promise<string[][]>;
}
