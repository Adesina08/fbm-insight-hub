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

The dashboard now reads live data directly from a Google Sheets workbook and refreshes automatically when new responses are appended. To enable the integration:

1. Copy `.env.example` to `.env` and populate the **server-side** values (do **not** prefix them with `VITE_`):
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` – the email of the service account that will access your sheet.
   - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` – the service account private key. Preserve newlines or replace them with `\n` when storing in plain text.
   - `GOOGLE_SHEETS_SPREADSHEET_ID` – the ID from the Google Sheets URL that hosts the Behaviour360 responses.
   - (Optional) `GOOGLE_SHEETS_DATA_RANGE` if your data lives on a different tab or range than the default `Form Responses 1!A1:Z`.
   - (Optional) override the frontend field mappings (`VITE_SHEETS_FIELD_*`) if your sheet headers differ from the defaults listed in `.env.example`.
2. Share the spreadsheet with the service account email so it can read the data.
3. Restart `npm run dev` so Vite picks up the environment variables. During local development the dev server returns the bundled sample fixture at `/api/sheets-data`; once credentials are provided the serverless `api/sheets-data.ts` endpoint will query Google directly in production.

The frontend polls Google Sheets every 60 seconds to keep charts and metrics up to date. If the connection fails, each widget shows contextual error messaging with a retry option.

### Troubleshooting Google Sheets connectivity

1. **Verify service account access** – ensure the spreadsheet is shared with the service account email with at least Viewer permissions.
2. **Check the private key formatting** – copy the key from the Google Cloud console and keep the `-----BEGIN PRIVATE KEY-----` block intact. When using `.env` files, replace actual newlines with `\n`.
3. **Confirm the range** – if you renamed your sheet tab or require a narrower range, update `GOOGLE_SHEETS_DATA_RANGE` to match.
4. **Inspect the API response** – deploy `api/sheets-data.ts` (e.g. to Vercel/Netlify) and log any non-200 responses from Google Sheets to surface permission or range errors quickly.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/f1fdd8b2-afa5-4b33-abf6-7f8164905e4a) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
