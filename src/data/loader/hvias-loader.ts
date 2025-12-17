// Statically import HVIA JSONs so Parcel bundles them
import hviaVolvo from '../hvias/hvia-volvo.json';
import hviaPenta from '../hvias/hvia-penta.json';
import hviaRenault from '../hvias/hvia-renault.json';
import hviaMack from '../hvias/hvia-mack.json';
import hviaNonHvia from '../hvias/non-hvia.json';
import type { HVIA } from '../hvias-model';
import { sanitizeMaturityEntries } from '../maturity-utils';

const hviaMap: Record<string, HVIA> = {
  './hvias/hvia-volvo.json': hviaVolvo as HVIA,
  './hvias/hvia-penta.json': hviaPenta as HVIA,
  './hvias/hvia-renault.json': hviaRenault as HVIA,
  './hvias/hvia-mack.json': hviaMack as HVIA,
  './hvias/non-hvia.json': hviaNonHvia as HVIA,
};

export function loadHVIAs(imports: string[]): HVIA[] {
  return imports.map((p) => {
    const mod = hviaMap[p];
    if (!mod) {
      throw new Error(`HVIA JSON not bundled: ${p}. Add a static import in hvias-loader.ts`);
    }
    return {
      ...mod,
      reviewed: mod.reviewed ?? false,
      maturityInputs: sanitizeMaturityEntries(`HVIA ${mod.id}`, mod.maturityInputs, ['hvia']),
    };
  });
}
