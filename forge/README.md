# Forge Deployment

This directory contains the Forge scaffolding required to publish the Parcel-generated site as a Confluence macro.

- `manifest.yml` – declares the macro module, static asset resource, function resolver, runtime configuration, and scopes.
- `src/resolver.js` – placeholder resolver that exposes macro metadata to the custom UI layer. Extend this file if the frontend needs server-side data.
- `static/` – repopulated automatically from the project-level `dist/` output during deployment. Only the `.gitkeep` placeholder is committed.

## Prerequisites

1. **Node.js** – use the active project version (v22 works today).
2. **Atlassian site access** – you need Confluence Cloud site-admin rights to install Forge apps.
3. **Atlassian API token** – required for `forge login`.
   1. Visit <https://id.atlassian.com/manage-profile/security/api-tokens>.
   2. Create a token and copy it (you only see it once).
   3. Run `forge login` and paste the token when prompted.
4. **Forge CLI** – install once per machine:

   ```sh
   npm install -g @forge/cli
   ```

   (You can also rely on the repo’s local dependency and invoke `npx forge <command>` from within `forge/`.)

## One-time app registration

```sh
cd forge
npx forge register
```

Registration creates an `appId`. Replace the placeholder under `app.id` in `forge/manifest.yml` with the returned value so future deploys reference the correct app.

## Deploy workflow

Most changes require two commands:

```sh
npm run deploy:forge -- --environment production
npx forge install --environment production --site stefans.atlassian.net --product confluence --upgrade
```

`npm run deploy:forge` performs the following:

1. Builds the Parcel bundle with relative asset URLs.
2. Copies `dist/` into `forge/static/`.
3. Runs `npx forge deploy --environment <env>` from inside the `forge/` directory.

Pass `--environment development` (or set `FORGE_ENVIRONMENT=development`) to deploy to the Forge “development” slot. You can create additional environments (e.g., `staging`) using `forge environments create staging`. Each environment maintains its own deployment history and installation bindings.

After deploying, run `npx forge install ...` to install or upgrade the app on a specific Confluence site. The install command must match the environment you just deployed (e.g., deploy to `staging`, then `forge install --environment staging --site <site> --product confluence`). Use `--upgrade` when the app is already installed.

### Staging vs. production

- **Development/staging**: Use `--environment development` (or a dedicated `staging` environment) to test against an internal Confluence site. This keeps production users unaffected while you iterate.
- **Production**: Deploy with `--environment production` once you are satisfied with staging validation, then run the install command with the same environment flag to roll out the update on the live site.

Because each environment is isolated, you can have different site installations pointing at different Forge environments simultaneously (e.g., `stefans-dev.atlassian.net` using `development` and `stefans.atlassian.net` using `production`).

## Helpful commands

- `forge login` – authenticate with your Atlassian account (uses the API token above).
- `forge deploy --verbose` – adds more diagnostics if the deployment pipeline fails.
- `forge deployments list --environment <env>` – shows recent releases per environment.
- `forge logs --environment <env>` – streams resolver/runtime logs for debugging.

Refer to <https://developer.atlassian.com/platform/forge/> for deeper platform details, tunneling instructions, and full CLI documentation.
