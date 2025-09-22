import databricks from '../tools/databricks.json';
// Statically import vendor JSONs so Parcel bundles them
import microsoft from '../tools/microsoft.json';
import pyuthon from '../tools/python.json';
import type { Vendor } from '../tools-model';

const vendorMap: Record<string, Vendor> = {
  './tools/microsoft.json': microsoft as Vendor,
  './tools/databricks.json': databricks as Vendor,
  './tools/python.json': pyuthon as Vendor,
};

export function loadVendors(imports: string[]): Vendor[] {
  return imports.map((p) => {
    const mod = vendorMap[p];
    if (!mod) {
      throw new Error(`Vendor JSON not bundled: ${p}. Add a static import in tools-loader.ts`);
    }
    // Pass through JSON as-is; logos should already be public URLs
    const resolvedTools = (mod.tools || []).map((t) => ({ ...t }));
    return {
      ...mod,
      tools: resolvedTools,
    } as Vendor;
  });
}
