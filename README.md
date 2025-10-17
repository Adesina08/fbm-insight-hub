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

1. Copy `.env.example` to `.env` and populate the values:
   - `VITE_KOBO_ASSET_ID` – the UID of your Kobo form (e.g. `a1b2cd34ef56gh7ijk890l`).
   - `VITE_KOBO_TOKEN` – a Kobo API token with access to the form's submissions.
   - (Optional) `VITE_KOBO_BASE_URL` if you use a regional Kobo deployment.
   - (Optional) override the field mappings (`VITE_KOBO_FIELD_*`) if your survey question names differ from the defaults.
2. Restart `npm run dev` so Vite picks up the environment variables.

The frontend polls Kobo every 60 seconds to keep charts and metrics up to date. If the connection fails, each widget shows contextual error messaging with a retry option.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/f1fdd8b2-afa5-4b33-abf6-7f8164905e4a) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
