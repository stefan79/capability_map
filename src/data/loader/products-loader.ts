import { sanitizeMaturityEntries } from '../maturity-utils';
import genaiHub from '../products/genai-hub.json';
import mlops from '../products/mlops.json';
import volvoGpt from '../products/volvo-gpt.json';
import type { Product } from '../products-model';

const productMap: Record<string, Product> = {
  './products/volvo-gpt.json': volvoGpt as Product,
  './products/genai-hub.json': genaiHub as Product,
  './products/mlops.json': mlops as Product,
};

export function loadProducts(imports: string[]): Product[] {
  return imports.map((p) => {
    const mod = productMap[p];
    if (!mod) {
      throw new Error(`Product JSON not bundled: ${p}. Add a static import in products-loader.ts`);
    }
    return {
      ...mod,
      reviewed: mod.reviewed ?? false,
      maturityInputs: sanitizeMaturityEntries(`Product ${mod.id}`, mod.maturityInputs, ['product']),
    };
  });
}
