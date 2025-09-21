// Statically import known capability JSONs so Parcel bundles them
import analyticalAi from '../capabilities/analytical-ai.json';
import foundationServices from '../capabilities/foundation-services.json';
import generativeAi from '../capabilities/generative-ai.json';
import governanceObservability from '../capabilities/governance-observability.json';
import type { Capability,Cluster } from '../capabilities-model';
import type { HVIA } from '../hvias-model';
import type { Tool } from '../tools-model';

const capabilityMap: Record<string, Cluster> = {
  './capabilities/analytical-ai.json': analyticalAi as Cluster,
  './capabilities/governance-observability.json': governanceObservability as Cluster,
  './capabilities/generative-ai.json': generativeAi as Cluster,
  './capabilities/foundation-services.json': foundationServices as Cluster,
};

// Helper: deep traverse cluster and resolve capability links
function resolveCluster(
  node: Cluster | Capability,
  toolIndex: Record<string, Tool>,
  hviaIndex: Record<string, HVIA>
): Cluster | Capability {
  // If it's a capability, resolve its links
  if ((node as Capability).type) {
    const cap = node as Capability;
    const resolved: Capability = { ...cap };
    if (cap.toolId) {
      resolved.tool = toolIndex[cap.toolId];
    }
    if (cap.useCaseRefs && cap.useCaseRefs.length) {
      const collected = cap.useCaseRefs
        .map(({ hviaId, useCaseId }) => {
          const hvia = hviaIndex[hviaId];
          if (!hvia) return undefined;
          return hvia.useCases.find((u) => u.id === useCaseId);
        })
        .filter(Boolean);
      resolved.useCases = collected as NonNullable<Capability['useCases']>;
    }
    return resolved;
  }

  // Otherwise it's a cluster; recurse into children
  const cluster = node as Cluster;
  const newChildren = (cluster.children || []).map((child) => resolveCluster(child, toolIndex, hviaIndex));
  return { ...cluster, children: newChildren };
}

export function loadCapabilities(
  imports: string[],
  opts?: { toolIndex?: Record<string, Tool>; hviaIndex?: Record<string, HVIA> }
): Cluster[] {
  const toolIndex = opts?.toolIndex ?? {};
  const hviaIndex = opts?.hviaIndex ?? {};
  return imports.map((p) => {
    const mod = capabilityMap[p];
    if (!mod) {
      throw new Error(`Capability JSON not bundled: ${p}. Add a static import in capabilities-loader.ts`);
    }
    // Return a deep-resolved copy so original JSON shape remains untouched
    return resolveCluster(mod, toolIndex, hviaIndex) as Cluster;
  });
}
