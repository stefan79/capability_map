# Repository Guidelines

## Project Structure & Module Organization
- `src/index.ts` bootstraps the Parcel entry declared in `src/index.html` and coordinates views through `src/view-manager/view-manager.ts` beneath the `#content` root.
- Data loaders and type definitions live under `src/data` and `src/types`; keep new datasets with their loader utilities for predictable imports.
- Feature views reside in `src/views/<feature>` and share base contracts from `src/views/view.ts`; colocate view-specific styles when needed.
- Static assets are served from `public/`; the build step mirrors files from `public`, `assets`, and `src/assets` into `dist/` alongside Parcel output.

## Build, Test, and Development Commands
- `npm install` pulls Parcel, TypeScript, and lint dependencies.
- `npm run start` launches the Parcel dev server with hot reload and no cache for fast iteration.
- `npm run build` produces production assets in `dist/`, copying any supplemental files gathered during development.
- `npm run lint` validates TypeScript sources with the flat ESLint config; `npm run lint:fix` applies safe fixes.

## Coding Style & Naming Conventions
- Use TypeScript with 2-space indentation and semicolons; keep modules ES2020-friendly for Parcel.
- Prefer `type` aliases over `interface` to satisfy `@typescript-eslint/consistent-type-definitions`.
- Imports are kept tidy via `simple-import-sort`; remove dead imports to appease `unused-imports/no-unused-imports`.
- Apply `camelCase` to functions/variables, `PascalCase` to classes and view components, and `kebab-case` to folders under `src/views/`.

## Testing Guidelines
- Automated tests are not yet wired (`npm test` exits intentionally); when introducing coverage, place specs in `src/__tests__/` (or alongside modules) and add an appropriate runner before enabling the script.
- Manually validate features in the Parcel dev server and re-run `npm run build` to ensure asset copies remain intact.
- Update sample data under `src/data/loader/` so reviewers can reproduce new scenarios during review.

## Commit & Pull Request Guidelines
- Mirror the existing history: short sentence-case summaries (e.g., `Cleaned up the tool tip detail view`) under ~60 characters.
- Group logical changes per commit and document data or asset adjustments in the body.
- Pull requests should explain motivation, list manual test steps, and attach screenshots or SVG exports when UI updates affect rendered maps.
- Reference tracking issues and ping reviewers when shipping new views, loaders, or major data refreshes.
