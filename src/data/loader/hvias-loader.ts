import salesAcceleration from '../hvias/ai-enabled-sales-acceleration.json';
import warrantyCost from '../hvias/ai-enabled-warranty-cost-reduction.json';
import newServices from '../hvias/building-new-ai-enabled-services.json';
// Statically import HVIA JSONs so Parcel bundles them
import e2eSop from '../hvias/e2e-sop-optimization-automation.json';
import devProductivity from '../hvias/software-developer-productivity.json';
import whiteCollar from '../hvias/white-collar-productivity.json';
import type { HVIA } from '../hvias-model';

const hviaMap: Record<string, HVIA> = {
  './hvias/e2e-sop-optimization-automation.json': e2eSop as HVIA,
  './hvias/ai-enabled-warranty-cost-reduction.json': warrantyCost as HVIA,
  './hvias/ai-enabled-sales-acceleration.json': salesAcceleration as HVIA,
  './hvias/building-new-ai-enabled-services.json': newServices as HVIA,
  './hvias/software-developer-productivity.json': devProductivity as HVIA,
  './hvias/white-collar-productivity.json': whiteCollar as HVIA,
};

export function loadHVIAs(imports: string[]): HVIA[] {
  return imports.map((p) => {
    const mod = hviaMap[p];
    if (!mod) {
      throw new Error(`HVIA JSON not bundled: ${p}. Add a static import in hvias-loader.ts`);
    }
    return mod;
  });
}
