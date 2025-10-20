# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/f1fdd8b2-afa5-4b33-abf6-7f8164905e4a

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/f1fdd8b2-afa5-4b33-abf6-7f8164905e4a) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Connecting to Google Sheets

The dashboard now reads live data from Google Sheets (or a compatible proxy) and refreshes automatically when new rows are synced. To enable the integration:

1. Copy `.env.example` to `.env` and populate the **server-side** values (do **not** prefix them with `VITE_`):
   - Provide either `SHEETS_DATA_URL`/`SHEETS_METADATA_URL` that point to JSON endpoints, **or** set `SHEETS_BASE_URL` plus `SHEETS_SPREADSHEET_ID` so the proxy can compose Google Sheets API calls automatically.
   - (Optional) define `SHEETS_WORKSHEET_NAME` when targeting a specific tab instead of the default first sheet.
   - (Optional) configure authentication helpers such as `SHEETS_API_KEY`, `SHEETS_BEARER_TOKEN`, or `SHEETS_BASIC_USER`/`SHEETS_BASIC_PASSWORD` if your proxy requires them.
   - (Optional) override the frontend field mappings (`VITE_SHEETS_FIELD_*`) if your sheet column names differ from the defaults.
   - (Optional) set `VITE_SHEETS_PROXY_BASE_URL`, `VITE_SHEETS_PROXY_DATA_URL`, or `VITE_SHEETS_PROXY_ASSETS_URL` when your hosting platform rewrites the API routes to custom endpoints.
2. Restart `npm run dev` so Vite picks up the environment variables. During local development, the Vite dev server serves `/api/sheets-data` and `/api/sheets-metadata` using the values above. In production, deploy the bundled `api/sheets-*.ts` functions (e.g. on Vercel/Netlify) so the browser never talks to Sheets directly.

The frontend polls Google Sheets every 60 seconds to keep charts and metrics up to date. If the connection fails, each widget shows contextual error messaging with a retry option.

### Troubleshooting Google Sheets responses

If the proxy returns an error (e.g. `401`, `403`, or `404`), work through the checklist below:

1. **Verify credentials** – confirm the configured service account or API key has read access to the spreadsheet.
2. **Double-check the spreadsheet ID and worksheet name** – copy them directly from the Google Sheets URL to avoid typos.
3. **Inspect the resolved request URL** by hitting the proxy with `curl` or logging outbound requests. Ensure the base URL, spreadsheet ID, and any ranges match the sheet you expect.
4. **Review sharing settings** – spreadsheets must be shared with the service account email or published to the web when using an API key only.

Once the proxy returns `200 OK` for both data and metadata endpoints, the dashboard will ingest rows and refresh automatically.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/f1fdd8b2-afa5-4b33-abf6-7f8164905e4a) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
