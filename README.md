# Volvo AI Capabilities Map

Interactive map that visualizes Volvo’s AI capabilities, vendors, and high-value impact areas (HVIAs). The frontend is built with Parcel + TypeScript and can run locally or inside a Confluence macro via Atlassian Forge.

## Prerequisites

- Node.js ≥ 22
- npm (ships with Node)
- Optional: Atlassian Forge CLI for deployments (see `forge/README.md`)

## Install & Run Locally

```sh
npm install
npm run start
```

`npm run start` launches Parcel in dev mode with hot reload at <http://localhost:1234>. You can also build the static bundle with `npm run build`, lint with `npm run lint`, or invoke the Forge deploy script (`npm run deploy:forge -- --environment <env>`).

## Project Layout

- `src/index.ts` – app bootstrap: loads data, wires the view manager, and handles Forge iframe resizing.
- `src/views/` – feature views that extend `src/views/view.ts`. Register new views through `ViewManager` (`src/view-manager/view-manager.ts`).
- `src/data/` – JSON sources, TypeScript models, and loaders that stitch together the capability map.
- `forge/` – Forge-specific scaffolding (manifest, resolver, deployment assets). See `forge/README.md`.

## Data Model

All data sources live in `src/data/`:

| Path | Purpose |
| --- | --- |
| `src/data/data.json` | Entry point describing which JSON fragments to import (`imports`) and seed data for simple views. |
| `src/data/capabilities-model.ts`<br>`src/data/tools-model.ts`<br>`src/data/hvias-model.ts` | Type aliases that define the shape of the nested data. |
| `src/data/loader/*.ts` | Loader helpers that statically import JSON files so Parcel bundles them and resolve cross-links (e.g., capability → tool). |

`loadAllData()` (`src/data/loader/data-loader.ts`) orchestrates the loaders:

1. Starts with the base object from `data.json`.
2. Loads vendors (`loadVendors`), then HVIAs (`loadHVIAs`), building lookup indexes.
3. Resolves capability clusters (`loadCapabilities`), linking `toolId` and `useCaseRefs` to the indexed objects.

### Extending the Data Model

1. **Add a JSON fragment** under the appropriate folder (`src/data/capabilities`, `src/data/tools`, `src/data/hvias`). Keep IDs unique so lookups succeed.
2. **Register the fragment in the corresponding loader** (`src/data/loader/*.ts`). Each loader holds a `map` of import paths to JSON modules. Add a static import and entry there so Parcel includes the file.
3. **Reference the JSON in `src/data/data.json`** by appending the relative path (e.g., `"./capabilities/new-cluster.json"`) to the relevant `imports` array. The `loadAllData` pipeline will automatically pull it in.
4. **Update types if needed.** If the new JSON introduces additional properties, adjust the relevant model file so TypeScript knows about them.

Because the loaders build indexes (`toolIndex`, `hviaIndex`), capabilities can safely reference new vendors or HVIAs as soon as they exist in the datasets.

## Forge Deployment

The Forge macro code, manifest, and deployment walkthrough live under `forge/`. After you are comfortable running the app locally, follow `forge/README.md` for:

- Installing and authenticating the Forge CLI
- Registering the app and managing environments (development/staging/production)
- Running the deploy + install commands (`npm run deploy:forge -- --environment …` and `npx forge install …`)

That document also explains how to create an Atlassian API token, configure staging vs. production environments, and troubleshoot Forge deployments.

## Scripts

| Command | Description |
| --- | --- |
| `npm run start` | Parcel dev server with hot reload. |
| `npm run build` | Production build with assets copied into `dist/`. |
| `npm run lint` | ESLint over `src/**/*.{ts,tsx}`. |
| `npm run deploy:forge -- --environment <env>` | Builds, copies `dist/` into `forge/static/`, then runs `npx forge deploy`. |

Feel free to add tests under `src/__tests__/` once Jest or another runner is integrated (currently `npm test` is a placeholder).
