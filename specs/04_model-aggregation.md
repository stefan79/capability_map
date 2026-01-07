# 04 — Aggregated data model & markdown export

Goal: a small JS/TS script that reads the source JSON models, joins related entities, and exposes a single aggregated object that can be fed into a Markdown template (Mustache/Handlebars/etc.).

## Inputs
- `src/data/capabilities/*.json`: nested clusters with capabilities. Each capability may include `productId`, `toolId`, `useCaseRefs`, and optional `productDocumentation`.
- `src/data/products/*.json`: products with `id`, `name`, contacts, documentation.
- `src/data/tools/*.json`: tools with `id`, `name`, `logo`, `vendorName` (optional).
- `src/data/hvias/*.json`: HVIAs, each with `useCases` array.
- `src/data/maturity-*.ts` if you want to include maturity summaries (not required for basic Markdown export).

## Joins to perform
1. Index all products, tools, vendors, hvias, and hvia.useCases by `id`.
2. Walk each capabilities JSON (root cluster → children) and for every capability node:
   - `product`: attach `productById[productId]` (if present).
   - `tool`: attach `toolById[toolId]` (if present).
   - `useCases`: resolve `useCaseRefs` → `{ ...useCase, hviaId, hviaName, maturity }` by matching `hviaId/useCaseId`.
   - `documentationLink`: pick `productDocumentation` if set, else fall back to the attached product’s `documentation` if available.
3. Preserve the cluster hierarchy but emit a parallel flattened list for easy templating.

## Aggregated object shape (suggested)
```ts
type AggregatedModel = {
  clusters: Cluster[];        // original trees from capabilities JSONs so callers can navigate hierarchy
  capabilities: ResolvedCap[]; // flattened capabilities with joins applied
  products: Product[];
  tools: Tool[];
  vendors: Vendor[];
  hvias: HVIA[];
};

type ResolvedCap = Capability & {
  description?: string;
  maturity?: CapabilityMaturitySummary; // optional, reuse existing maturity summary shape
  product?: Product;
  tool?: Tool;
  useCases?: Array<UseCase & { hviaId: string; hviaName: string; maturity: 0|1|2|3 }>;
  documentationLink?: ProductDocumentationLink & { productId?: string; source: 'capability'|'product' };
};
```

## Example resolution snippet
```js
function resolveCapability(cap, idx) {
  const product = cap.productId && idx.products.get(cap.productId);
  const tool = cap.toolId && idx.tools.get(cap.toolId);
  const useCases = (cap.useCaseRefs || []).map(({ hviaId, useCaseId, maturity }) => {
    const hvia = idx.hvias.get(hviaId);
    const uc = hvia?.useCases.find(u => u.id === useCaseId);
    return hvia && uc ? { ...uc, hviaId, hviaName: hvia.name, maturity } : null;
  }).filter(Boolean);
  const documentationLink = cap.productDocumentation
    ? { ...cap.productDocumentation, productId: cap.productId, source: 'capability' }
    : product?.documentation
      ? { ...product.documentation, productId: product.id, source: 'product' }
      : undefined;
  // optional: attach maturity if you want it in the aggregated payload
  // const maturity = buildCapabilityMaturity(cap, product, tool); // reuse existing maturity utils
  return { ...cap, product, tool, useCases, documentationLink /*, maturity */ };
}
```

## Markdown templating expectations
- Feed the `AggregatedModel` (or subsets) into a template engine; keep templating engine pluggable (Mustache/Handlebars/ETC).
- Provide two ready-to-use template entry points:
  1) **Capability sheet** per capability:
     ```
     ## {{title}}
     {{description}}

     - Type: {{type}}
     - Product: {{product.name}}
     - Tool: {{tool.name}}
     - Use cases: {{#useCases}}{{hviaName}} / {{name}} (maturity {{maturity}})
     {{/useCases}}

     Docs: {{documentationLink.url}}
     ```
  2) **Catalog** listing:
     ```
     # Capability Catalog
     {{#capabilities}}
     - **{{title}}** ({{type}}) — {{shortDescription}}
     {{/capabilities}}
     ```
- Consider deriving `shortDescription` as the first sentence of `description`.

## Details on Maturity
- Optional enrichment: reuse the existing maturity summary shape (`CapabilityMaturitySummary` from `src/data/maturity-types.ts`).
- Compute once per capability (independent of where inputs come from) using the same weighted approach as `src/data/loader/capabilities-loader.ts` and set it on `ResolvedCap.maturity`.
- The maturity summary should include:
  - A single weighted overall value.
  - Per-dimension averages.
  - Per-subdimension values and reasoning.

## Output contract
- Emit one aggregated Markdown files rendered from templates.
- Create a sample template for customization
- Keep file names deterministic and avoid network access; read only local JSONs under `src/data/**`.

## Error handling
- Warn (do not throw) on dangling `productId`, `toolId`, or `useCaseRefs` that cannot be resolved; include them in a `warnings` array in the aggregated output for debugging.

## Optional maturity enrichment
- If needed, reuse maturity helpers from `src/data/maturity-utils.ts` or include raw `maturityInputs` fields directly; not required for Markdown export.
