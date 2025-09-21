import type { Cluster } from '../capabilities-model';
// Statically import known capability JSONs so Parcel bundles them
import analyticalAi from '../capabilities/analytical-ai.json';
import governanceObservability from '../capabilities/governance-observability.json';
import generativeAi from '../capabilities/generative-ai.json';
import foundationServices from '../capabilities/foundation-services.json';

const capabilityMap: Record<string, Cluster> = {
  './capabilities/analytical-ai.json': analyticalAi as Cluster,
  './capabilities/governance-observability.json': governanceObservability as Cluster,
  './capabilities/generative-ai.json': generativeAi as Cluster,
  './capabilities/foundation-services.json': foundationServices as Cluster,
};

export function loadCapabilities(imports: string[]): Cluster[] {
  return imports.map((p) => {
    const mod = capabilityMap[p];
    if (!mod) {
      throw new Error(`Capability JSON not bundled: ${p}. Add a static import in capabilities-loader.ts`);
    }
    return mod;
  });
}
