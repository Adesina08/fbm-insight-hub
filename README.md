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

## Connecting to KoboCollect

The dashboard now reads live data directly from KoboCollect/KoboToolbox and refreshes automatically when new submissions arrive. To enable the integration:

1. Copy `.env.example` to `.env` and populate the **server-side** values (do **not** prefix them with `VITE_`):
   - `KOBO_ASSET_ID` – the UID of your Kobo form (e.g. `a1b2cd34ef56gh7ijk890l`).
   - `KOBO_TOKEN` – a Kobo API token with access to the form's submissions.
   - (Optional) `KOBO_BASE_URL` if you use the EU Kobo deployment or a self-hosted instance.
   - (Optional) override the frontend field mappings (`VITE_KOBO_FIELD_*`) if your survey question names differ from the defaults.
   - (Optional) set `VITE_KOBO_PROXY_BASE_URL` if your deployment exposes the API proxy behind a shared base path (legacy `/api/kobo` style routes).
   - (Optional) override `VITE_KOBO_PROXY_DATA_URL` and/or `VITE_KOBO_PROXY_ASSETS_URL` when your hosting platform rewrites the API routes to custom endpoints.
2. Restart `npm run dev` so Vite picks up the environment variables. During local development, the Vite dev server serves both `/api/kobo-data` and `/api/kobo-assets` (plus the legacy `/api/kobo/*` paths) using the values above. In production, deploy the bundled `api/kobo-*.ts` functions (e.g. on Vercel/Netlify) so the browser never talks to Kobo directly.

The frontend polls Kobo every 60 seconds to keep charts and metrics up to date. If the connection fails, each widget shows contextual error messaging with a retry option.

### Troubleshooting Kobo 404 errors

If Kobo returns a `404`, the API endpoint exists but the specific asset cannot be found. Use the checklist below to isolate the mismatch quickly:

1. **Verify the three coordinates** – the base URL (`https://kf.kobotoolbox.org` for the Global server or `https://eu.kobotoolbox.org` for the EU server), the asset UID (taken from the project URL: `/assets/<UID>/`), and the API token must all belong to the same Kobo account and server region.
2. **Run a quick `curl` sanity check** outside the app. Both of the requests below should return `200`; replace the placeholders with your values:

   ```bash
   curl -sS -H "Authorization: Token <KOBO_TOKEN>" \
        "https://<kf-or-eu>.kobotoolbox.org/api/v2/assets/<ASSET_UID>/?format=json" -i

   curl -sS -H "Authorization: Token <KOBO_TOKEN>" \
        "https://<kf-or-eu>.kobotoolbox.org/api/v2/assets/<ASSET_UID>/data/?format=json" -i
   ```

   A `404` response indicates a wrong server, UID, or permissions for the token, not a frontend issue.
3. **Confirm the exact path** in your fetch call. The Kobo v2 submissions endpoint requires `/api/v2/assets/<ASSET_UID>/data/` with the trailing slash before any query string.
4. **Log the resolved request URL** in your app or API proxy when debugging. Check that the base URL, UID, trailing slash, and token all match the known-good values from the curl test. For server-side proxies, log Kobo's upstream response when the status is not `200` so you can see the precise error message.
5. **Revisit common causes** – wrong server (`kf` vs `eu`), incorrect UID (using a numeric ID instead of the asset UID), missing trailing slash, token/account mismatch, or mixing v1 and v2 API routes.

Once both curl checks succeed, the frontend should also resolve the asset without returning a `404`.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/f1fdd8b2-afa5-4b33-abf6-7f8164905e4a) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
