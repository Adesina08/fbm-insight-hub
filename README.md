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

## Reusable FBM coding prompt

Need to spin up new dashboard ideas quickly? Use the master prompt in [`docs/fbm-dashboard-master-prompt.md`](docs/fbm-dashboard-master-prompt.md) to brief ChatGPT/Copilot on the contraception FBM dashboard, including the data structure, derived metrics, quadrants, segmentation rules, and tab-by-tab visualization needs.

## Connecting to Google Sheets

The dashboard now reads live data from a Google Sheet. Each row is treated like a survey submission, so the analytics continue to work without code changes. By default the application points to the following spreadsheet:

- https://docs.google.com/spreadsheets/d/1yKC2mbdaHO3o7e4JRu9GEGyjlhSl9GhvEeC9pUIxxoQ/edit?gid=0#gid=0

To enable the integration:

1. Copy `.env.example` to `.env` and populate the following **server-side** variables (no `VITE_` prefix):
   - (Optional) `GOOGLE_SHEETS_SPREADSHEET_ID` to read from your own spreadsheet instead of the default ID above.
   - (Optional) `GOOGLE_SHEETS_PRIMARY_GID` if your primary tab uses a gid other than `0`.
   - `GOOGLE_SERVICE_ACCOUNT` – the entire JSON credentials document for a service account with access to the sheet (base64 or raw JSON both work). Alternatively, provide `GOOGLE_CLIENT_EMAIL` and `GOOGLE_PRIVATE_KEY`.
   - (Optional) override the frontend field mappings (`VITE_SHEETS_FIELD_*`) if the column names in the sheet differ from the default question names used in the analytics module.
2. Share the sheet with the service account email so it can read values.
3. Redeploy or restart `npm run dev` so the environment variables are picked up. The `/api/sheets-data` endpoint now streams rows from Google Sheets, and `/api/sheets-metadata` exposes sheet metadata for the UI card.

Netlify builds run `npm run verify-env` before the Vite build, so deployments will fail fast if service account credentials are missing.

If the sheet cannot be reached, the UI surfaces descriptive error messages with retry actions.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/f1fdd8b2-afa5-4b33-abf6-7f8164905e4a) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
