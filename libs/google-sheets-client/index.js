import { createSign } from "crypto";

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function fetchAccessToken({ clientEmail, privateKey, scopes }) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: clientEmail,
    scope: scopes.join(" "),
    aud: TOKEN_ENDPOINT,
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  const signature = signer.sign(privateKey);
  const encodedSignature = base64UrlEncode(signature);
  const assertion = `${unsignedToken}.${encodedSignature}`;

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    const preview = await response.text();
    throw new Error(`Failed to obtain Google access token (${response.status}): ${preview}`);
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new Error("Google token response did not include an access token.");
  }

  return {
    token: data.access_token,
    expiresAt: now + (typeof data.expires_in === "number" ? data.expires_in : 3600),
  };
}

export class GoogleSheetsClient {
  constructor({ clientEmail, privateKey, scopes = [] }) {
    this.clientEmail = clientEmail;
    this.privateKey = privateKey;
    this.scopes = Array.isArray(scopes) && scopes.length > 0 ? scopes : ["https://www.googleapis.com/auth/spreadsheets.readonly"];
    this.cachedToken = null;
  }

  async ensureToken() {
    const now = Math.floor(Date.now() / 1000);
    if (this.cachedToken && this.cachedToken.expiresAt - 60 > now) {
      return this.cachedToken.token;
    }

    this.cachedToken = await fetchAccessToken({
      clientEmail: this.clientEmail,
      privateKey: this.privateKey,
      scopes: this.scopes,
    });

    return this.cachedToken.token;
  }

  async fetchValues(spreadsheetId, range) {
    const token = await this.ensureToken();
    const encodedRange = encodeURIComponent(range);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?majorDimension=ROWS`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const preview = await response.text();
      throw new Error(`Google Sheets API request failed (${response.status}): ${preview}`);
    }

    const data = await response.json();
    const values = Array.isArray(data.values) ? data.values : [];
    return values.map((row) => row.map((cell) => (typeof cell === "string" ? cell : String(cell ?? ""))));
  }
}
