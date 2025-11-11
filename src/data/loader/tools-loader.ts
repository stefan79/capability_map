// Statically import vendor JSONs so Parcel bundles them
import { MATURITY_SUBDIMENSION_MAP } from '../maturity-config';
import type { RawMaturityMap } from '../maturity-types';
import { mergeMaturityMaps, sanitizeMaturityEntries } from '../maturity-utils';
import databricks from '../tools/databricks.json';
import microsoft from '../tools/microsoft.json';
import pyuthon from '../tools/python.json';
import type { Vendor } from '../tools-model';

const vendorMap: Record<string, Vendor> = {
  './tools/microsoft.json': microsoft as Vendor,
  './tools/databricks.json': databricks as Vendor,
  './tools/python.json': pyuthon as Vendor,
};

const implementationSubdimensions = Object.values(MATURITY_SUBDIMENSION_MAP)
  .filter((sub) => sub.source === 'implementation')
  .map((sub) => sub.id);

const vendorImplementationProfiles: Record<string, Record<string, number>> = {
  databricks: {
    'process.self-service': 4,
    'people.roles': 4,
    'people.skills': 4,
    'people.capacity': 3.5,
    'people.product-guidance': 3.5,
  },
  microsoft: {
    'process.self-service': 3.5,
    'people.roles': 3.5,
    'people.skills': 3.5,
    'people.capacity': 3,
    'people.product-guidance': 3,
  },
  python: {
    'process.self-service': 2.5,
    'people.roles': 2,
    'people.skills': 3,
    'people.capacity': 2,
    'people.product-guidance': 2,
  },
  default: {
    'process.self-service': 2.5,
    'people.roles': 2.5,
    'people.skills': 2.5,
    'people.capacity': 2.5,
    'people.product-guidance': 2.5,
  },
};

const buildImplementationDefaults = (toolName: string, vendorId?: string): RawMaturityMap => {
  const profile = vendorImplementationProfiles[vendorId ?? ''] ?? vendorImplementationProfiles.default;
  const reason = `Default maturity for ${toolName}`;
  return implementationSubdimensions.reduce<RawMaturityMap>((acc, key) => {
    acc[key] = { value: profile[key] ?? vendorImplementationProfiles.default[key] ?? 2, reason };
    return acc;
  }, {});
};

export function loadVendors(imports: string[]): Vendor[] {
  return imports.map((p) => {
    const mod = vendorMap[p];
    if (!mod) {
      throw new Error(`Vendor JSON not bundled: ${p}. Add a static import in tools-loader.ts`);
    }
    // Pass through JSON as-is; logos should already be public URLs
    const resolvedTools = (mod.tools || []).map((t) => {
      const defaults = buildImplementationDefaults(t.name, mod.id);
      const sanitized = sanitizeMaturityEntries(`Tool ${t.id}`, t.maturityInputs, ['implementation']);
      return {
        ...t,
        reviewed: t.reviewed ?? false,
        maturityInputs: mergeMaturityMaps(defaults, sanitized),
        vendorId: mod.id,
        vendorName: mod.name,
        vendorLogo: mod.logo,
      };
    });
    return {
      ...mod,
      reviewed: mod.reviewed ?? false,
      tools: resolvedTools,
    } as Vendor;
  });
}
