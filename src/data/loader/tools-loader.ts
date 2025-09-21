import type { Vendor } from '../tools-model';
// Statically import vendor JSONs so Parcel bundles them
import microsoft from '../tools/microsoft.json';
import databricks from '../tools/databricks.json';

const vendorMap: Record<string, Vendor> = {
  './tools/microsoft.json': microsoft as Vendor,
  './tools/databricks.json': databricks as Vendor,
};

export function loadVendors(imports: string[]): Vendor[] {
  return imports.map((p) => {
    const mod = vendorMap[p];
    if (!mod) {
      throw new Error(`Vendor JSON not bundled: ${p}. Add a static import in tools-loader.ts`);
    }
    // Resolve logo URL via Parcel's URL dependency handling. Our JSON uses './logos/...' relative to tools/ folder.
    // Build a URL relative to this module file to point at '../tools/logos/...'
    const logoFileName = (mod.logo || '').split('/').pop() || '';
    const logoUrl = new URL(`../tools/logos/${logoFileName}`, import.meta.url).toString();
    const resolvedTools = (mod.tools || []).map((t) => {
      const tLogoFileName = (t.logo || '').split('/').pop() || '';
      const tLogoUrl = new URL(`../tools/logos/${tLogoFileName}`, import.meta.url).toString();
      return {
        ...t,
        logo: tLogoUrl,
      };
    });
    return {
      ...mod,
      logo: logoUrl,
      tools: resolvedTools,
    } as Vendor;
  });
}
