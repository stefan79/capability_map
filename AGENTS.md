# Repository Guidelines

## Project Structure & Module Organization
`src/index.ts` boots Parcel from `src/index.html` and hands routing to `src/view-manager/view-manager.ts`, which mounts feature views inside `#content`. Shared types and loaders live under `src/types` and `src/data`, so keep new datasets colocated with their fetch helpers. Views live in `src/views/<feature>` and inherit from `src/views/view.ts`; store any feature styles beside the view to simplify Parcel’s tree-shaking. Static files under `public/`, `assets/`, or `src/assets/` are copied into `dist/` during builds, so only check in source assets. The Forge packaging lives under `forge/` (`manifest.yml`, resolver, and `static/` that mirrors `dist/`) so keep Forge-specific tweaks there instead of in the Parcel sources.

## Build, Test, and Development Commands
- `npm install` – installs Parcel, TypeScript, and lint plugins.
- `npm run start` – launches the Parcel dev server with hot reload and an empty cache for rapid UX checks.
- `npm run build` – emits production assets into `dist/` and mirrors the static folders above.
- `npm run deploy:forge -- --environment <env>` – builds with relative asset paths, copies `dist/` into `forge/static/`, and runs `forge deploy` for the requested environment (`development`, `staging`, `production`, etc.).
- `npx forge install --environment <env> --site <site>.atlassian.net --product confluence [--upgrade]` – binds the recently deployed bundle to a specific Confluence site after `npm run deploy:forge`.
- `npm run lint` / `npm run lint:fix` – validates TypeScript with the flat ESLint config and applies safe import/formatting fixes.

## Coding Style & Naming Conventions
Code in TypeScript, using 2-space indentation, semicolons, and ES2020 modules that work in Parcel. Prefer `type` aliases over `interface` to satisfy `@typescript-eslint/consistent-type-definitions`. `simple-import-sort` governs import order while `unused-imports/no-unused-imports` enforces hygiene, so delete dead symbols as you refactor. Use `camelCase` for variables and functions, `PascalCase` for classes and views, and `kebab-case` for folders under `src/views/`.

## Testing Guidelines
`npm test` currently exits by design, so add new specs under `src/__tests__/` (or beside the module) and wire a runner before enabling the script. Until automated coverage exists, validate changes in `npm run start`, then re-run `npm run build` to confirm asset copies. Refresh any demonstration data under `src/data/loader/` so reviewers can reproduce map states.

## Commit & Pull Request Guidelines
Follow the existing history: short, sentence-case summaries under ~60 characters (e.g., `Cleaned up the tool tip detail view`). Keep each commit focused and describe asset or data adjustments in the body. Pull requests should explain motivation, enumerate manual test steps, cite linked issues, and attach screenshots or SVG exports whenever a view or map styling shifts.

## Security & Configuration Tips
Do not commit secrets or API keys; Parcel reads environment values at build time, so prefer `.env.local` files that remain untracked. Avoid checking in the generated `dist/` output or Parcel caches. When loading remote datasets, gate URLs through the loaders in `src/data` so swapping endpoints later only touches one module.

## Local vs. Forge Workflows
- **Local development**: Use `npm run start` for hot-reload testing against Parcel’s dev server and `npm run build` before validating static output.
- **Forge packaging**: After a successful local build, run `npm run deploy:forge -- --environment <env>` from the project root; this command syncs `dist/` to `forge/static/` and issues the Forge deploy inside `forge/`.
- **Forge installation**: Complete the flow with `npx forge install --environment <env> --site <site> --product confluence --upgrade` to install or update the macro on a Confluence tenant. Each environment maintains separate deploy/install bindings, so match the `--environment` flag between deploy and install.
