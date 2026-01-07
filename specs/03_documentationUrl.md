  # Capability Documentation Links Spec
  *Owner:* Stefan Siprell _(confirm owner)_
  *Date:* 2025-11-14
  *Related work:* specs/01_maturity.md, specs/02_product-dimension-template.md, _link Jira/Confluence item_

## 1. Problem & Goals
- **Motivation:** Each capability → product relationship references product-specific documentation, but today there is no place to store or surface those URLs.
- **Current pain:** Tooltips and exported SVGs lack deep links, so viewers must hunt for enablement docs elsewhere.
- **Goals / Success criteria:**
  1. Authors can supply a documentation URL for every capability/product pairing.
  2. Tooltip UI shows the clickable link (open in new tab) with clear labeling.
  3. Exported SVG embeds the same hyperlink so downstream consumers retain navigation when viewing the static asset.
  4. Data contract stays backward compatible for capabilities without documentation yet.

## 2. Scope & Non-Goals
- **In scope:** Data schema additions, loaders, tooltip wiring, SVG export changes, basic link styling/state (hover/focus).
- **Out of scope:** Authoring UI/editor, documentation hosting/migration, validation of URL reachability, analytics on link usage.

## 3. Data Model & Content Strategy
### 3.1 Source of Truth
- The data should be added in the capability descibing json files when the product is referenced. 
- Define update cadence + owners (e.g., product SA or DPO).

### 3.2 Schema Changes
| File / Entity | Proposed Field | Notes / Open Questions |
| ------------- | -------------- | ---------------------- |
| `src/data/capabilities/*.json` | `documentationUrl` on the capability-level product block | Only when a capability references a product. |
| Loader DTOs | Extend types (`Capability`, `ProductCapabilityLink`, tooltip view-model) | Ensure undefined URLs don't break tooltips. |

### 3.3 Authoring Workflow
- Document how to add/update URLs (e.g., `npm run lint` check for http/https prefix?).
- Provide placeholder value conventions (empty string vs. omit field).
- Optional JSON schema validation / ESLint rule to ensure valid format.

## 4. UI Behavior
### 4.1 Tooltip Updates (`src/views/capability-view/...`)
- Display documentation link beneath the capability → product section.
- Tooltip link opens in a new browser tab/window; add `rel="noopener noreferrer"`.
- If multiple products per capability, list each as bullet or stacked chips.
- Handle overflow (ellipsis + title attribute) and keyboard focus order.

### 4.2 Accessibility & Styling
- Meet AA contrast; underline on hover/focus.
- Provide visually hidden text for screen readers (“Open documentation in new tab”).
- Confirm tooltip width/height adjustments keep layout stable.

## 5. Exported SVG Behavior
### 5.1 Hyperlink Embedding
- When generating/exporting the SVG map, wrap the capability tile or explicit icon/text with an `<a xlink:href="...">`.
- Use absolute URLs; ensure they survive downstream consumers (Confluence, Forge apps) that sanitize attributes.
- Confirm clicking within Confluence renders the hyperlink (testing checklist).
- Provide fallback text or icon when URL missing—no anchor tag should be emitted.

### 5.2 Interaction Notes
- Hover styles in the SVG (if supported) should mirror tooltip theme but degrade gracefully.
- Clicking in exported artifact must not require modifier keys; verify on Mac/Windows.

## 6. Technical Plan (Draft Checklist)
1. Extend capability/product JSON schema + TypeScript types with optional documentation URL field(s).
2. Update loaders (`capabilities-loader`, `products-loader`, tooltip view-model builder) to propagate URLs.
3. Add tooltip UI fragment rendering the link; ensure sanitized text and analytics hooks (if needed).
4. Adjust SVG export logic to create `<a>` elements with `target="_blank"` & `rel` attributes.
5. Backfill sample data (at least one capability per product) and document authoring steps in README.
6. Verify lint/tests/build; add unit snapshot for tooltip + exported SVG DOM.

## 7. Acceptance Criteria
1. **Data:** Repo can represent per capability/product documentation URLs without breaking existing data.
2. **Tooltip:** Hovering a capability shows the documentation link when available; absent when not provided.
3. **SVG Export:** Generated SVG contains functional hyperlinks (tested in browser + Confluence preview).
4. **Accessibility:** Links are keyboard reachable and include screen-reader-friendly text.
5. **Docs:** README/spec updated with instructions for adding documentation URLs and testing the behavior.
