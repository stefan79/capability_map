  # Product Dimension & Maturity Reassignment Spec (Template)
  *Owner:* _TBD (e.g., Stefan Siprell)_
  *Date:* 2025-11-11
  *Related work:* _Link to Jira / previous specs_

## 1. Problem & Goals
- **Motivation:** Current maturity model only captures HVIA, capability, and tool perspectives. Product-led signals (roadmap readiness, packaging, SLA posture) remain hidden.
- **Pain today:**_Certain capabilities self-service, roles, skills, capacity, product-guidance are tracked on technology level but should be tracked on product level, as the product has the team associated to it. 
- **Goals / success criteria:**
  1. Radar tooltip (and any downstream views) can surface product maturity alongside existing dimensions.
  2. Ownership of subdimensions aligns with real data stewards (product vs. capability vs. implementation).
  3. Data import/export story remains clear for ops teams. 

## 2. Scope & Non-Goals
- **In scope:** Extending data loaders, maturity config, and optional UI wiring to recognize a `product` source.
- **Out of scope:** Nothing comes to mind

## 3. Data Model Updates
### 3.1 Entities
| Entity | Role Today | Change Needed | Open Questions |
| ------ | ---------- | ------------- | -------------- |
| HVIA   | Usage-driven adoption input | None | |
| Capability | Documentation, development signals | Keep capability-derived subs | |
| Tool / Implementation | Self-service + people metrics | No change | |
| **Product (NEW)** | Not yet included | - Introduce a new json document, extend capability tooltip to include product name, move tool maturity dimensions to product | None|

### 3.2 Maturity Subdimension Ownership
| Subdimension | Current Source | Proposed Source | Notes |
| ------------ | -------------- | --------------- | ----- |
| process.self-service | implementation | implementation | |
| people.roles | implementation | implementation | |
| people.skills | implementation | implementation | |
| people.capacity | implementation | implementation | |
| people.product-guidance | implementation | implementation | |


### 3.3 JSON Schema Touchpoints
- `src/data/maturity-config.ts`: add `product` source constants and dimension metadata.
- `src/data/maturity-types.ts`: extend `MaturitySource` union + downstream types.
- `src/data/capabilities-model.ts`: allow capability records to reference product-level maturity overrides (e.g., `productId`, `productInputs`?). _Include an ID for the name of the team, team name, DPO name and email address, SA name and email address, maturity dimenions, team link URL_

## 4. Data Sourcing Plan
- **Authoritative system:** _e.g., Product catalog spreadsheet, ServiceNow, etc._
- **Import path:** _Outline CSV/JSON contract, responsible team, and update cadence._
- **Fallback/defaults:** Describe how `product` subdimensions should behave if no explicit data is provided (inherit from capability, default to status, etc.).

## 5. Implementation Steps (Draft Checklist)
1. Update type definitions (`MaturitySource`, loaders, configs) to include `product`.
2. Decide where product data lives (new `src/data/products/*.json`?). Add sample for a Volvo GPT, GenAiHub and MLOps as the three products.
3. Wire capability loader to pull product maturity inputs (e.g., via `productId` on capability or via tool->product mapping).
4. Adjust `deriveCapabilityDefaults` to skip the moved subdimensions so they only come from product data.
5. Add a new section on the tooltip for the team, show team name, SA with email link and DPO with email link before the capability radar.

## 7. Acceptance Criteria
1. Data schema supports a `product` maturity source without breaking existing loaders.
2. Moved subdimensions display product-derived values in the UI.
3. Tests/lint pass; tooltips still hide the maturity section when aggregate score is 0.
4. Documentation updated (README/specs) to explain how and where to edit product maturity inputs.

