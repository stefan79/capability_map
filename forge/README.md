# Forge Deployment

This directory contains the Forge scaffolding required to publish the Parcel-generated site as a Confluence macro.

- `manifest.yml` – declares a native Confluence macro that serves the static bundle from `static/` and uses `src/resolver.js` for future bridge calls.
- `src/resolver.js` – placeholder resolver that exposes macro metadata to the custom UI layer. Extend this file if the frontend needs server-side data.
- `static/` – populated automatically from the project-level `dist/` output during deployment. Only the `.gitkeep` placeholder is committed.

## Deploying

1. Build and bundle the site plus Forge app:

   ```sh
   npm run deploy:forge -- --environment production
   ```

   The script runs `npm run build`, syncs `dist/` into `forge/static/`, and then executes `npx forge deploy` from this directory. Pass `FORGE_ENVIRONMENT=development` or `--environment development` to target a different Forge environment.

2. After the first deployment, register the app (if you have not already) and install it on the target Confluence site via the Forge CLI prompts.

> Replace the placeholder `app.id` inside `forge/manifest.yml` with the value returned by `forge register` before deploying to a production site.
