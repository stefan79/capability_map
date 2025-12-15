// Statically import known capability JSONs so Parcel bundles them
import analyticalAi from '../capabilities/analytical-ai.json';
import foundationServices from '../capabilities/foundation-services.json';
import agenticAi from '../capabilities/agentic-ai.json';
import generativeAi from '../capabilities/generative-ai.json';
import governanceObservability from '../capabilities/governance-observability.json';
import type {
  Capability,
  CapabilityDocumentationLink,
  Cluster,
  ResolvedUseCaseRef,
} from '../capabilities-model';
import { getStatusMaturity } from '../capability-helpers';
import type { HVIA } from '../hvias-model';
import { MATURITY_DIMENSIONS, type MaturitySource } from '../maturity-config';
import type { CapabilityMaturitySummary, RawMaturityMap } from '../maturity-types';
import { createZeroMaturitySummary, mergeMaturityMaps, sanitizeMaturityEntries } from '../maturity-utils';
import type { Product, ProductDocumentationLink } from '../products-model';
import type { Tool } from '../tools-model';

const capabilityMap: Record<string, Cluster> = {
  './capabilities/analytical-ai.json': analyticalAi as Cluster,
  './capabilities/agentic-ai.json': agenticAi as Cluster,
  './capabilities/governance-observability.json': governanceObservability as Cluster,
  './capabilities/generative-ai.json': generativeAi as Cluster,
  './capabilities/foundation-services.json': foundationServices as Cluster,
};

// Helper: deep traverse cluster and resolve capability links
const defaultReasonBySource: Record<MaturitySource, string> = {
  capability: 'Baseline capability signal not provided.',
  implementation: 'Implementation does not expose this maturity data.',
  hvia: 'No HVIA usage recorded yet.',
  product: 'Product maturity signal not provided.',
};

const hasDocLink = (doc?: ProductDocumentationLink | null): doc is ProductDocumentationLink =>
  Boolean(doc && typeof doc.url === 'string' && doc.url.trim().length > 0);

const normalizeDocLink = (doc: ProductDocumentationLink): ProductDocumentationLink => ({
  url: doc.url,
  title: doc.title ?? doc.description,
  description: doc.description,
});

const resolveDocumentationLink = (
  capability: Capability,
  product?: Product
): CapabilityDocumentationLink | undefined => {
  if (hasDocLink(capability.productDocumentation)) {
    const normalized = normalizeDocLink(capability.productDocumentation);
    return {
      ...normalized,
      productId: capability.productId ?? product?.id,
      source: 'capability',
    };
  }
  if (product && hasDocLink(product.documentation)) {
    const normalized = normalizeDocLink(product.documentation);
    return {
      ...normalized,
      title: normalized.title ?? product.name,
      productId: product.id,
      source: 'product',
    };
  }
  return undefined;
};

const countActiveUseCases = (capability: Capability): { active: number; requested: number } => {
  const useCases = capability.useCases ?? [];
  let active = 0;
  let requested = 0;
  for (const uc of useCases) {
    if ((uc as ResolvedUseCaseRef).maturity >= 1) {
      requested += 1;
    }
    if ((uc as ResolvedUseCaseRef).maturity >= 2) {
      active += 1;
    }
  }
  return { active, requested };
};

const deriveCapabilityDefaults = (capability: Capability): RawMaturityMap => {
  const statusScore = Math.max(1, getStatusMaturity(capability) || 1);
  const { active } = countActiveUseCases(capability);
  const documentationLength = (capability.description ?? '').length;
  let documentationValue = 1;
  if (documentationLength > 400) documentationValue = 4;
  else if (documentationLength > 250) documentationValue = 3;
  else if (documentationLength > 120) documentationValue = 2;
  if (capability.link) documentationValue = Math.min(4, documentationValue + 1);

  const devBoost = active >= 5 ? 1 : active >= 2 ? 0.5 : 0;
  const developmentValue = Math.min(4, statusScore + devBoost);

  return {
    'adoption.effort': {
      value: Math.min(4, statusScore),
      reason: `Derived from capability status "${capability.status}".`,
    },
    'technology.development-activity': {
      value: developmentValue,
      reason: active > 0 ? `Active in ${active} HVIA use cases.` : 'No HVIA activity yet.',
    },
    'process.documentation': {
      value: documentationValue,
      reason: capability.link ? 'Detailed description with external reference.' : 'Limited documentation available.',
    },
  };
};

const deriveHviaDefaults = (capability: Capability): RawMaturityMap => {
  const { active, requested } = countActiveUseCases(capability);
  const reason = active > 0
    ? `Active in ${active} HVIA use case${active === 1 ? '' : 's'}.`
    : requested > 0
      ? 'Requested by HVIA teams but not in active use.'
      : 'No linked HVIA use cases.';

  let value = 1;
  if (active === 0) value = 1;
  else if (active <= 2) value = 1;
  else if (active <= 5) value = 2;
  else if (active <= 10) value = 3;
  else value = 4;

  return {
    'adoption.use-case': {
      value,
      reason,
    },
  };
};

const buildCapabilityMaturity = (capability: Capability): { summary: CapabilityMaturitySummary; inputs: RawMaturityMap } => {
  if (!capability.tool) {
    return {
      summary: createZeroMaturitySummary('Capability has no linked implementation.'),
      inputs: {},
    };
  }

  const defaults = deriveCapabilityDefaults(capability);
  const overrides = sanitizeMaturityEntries(`Capability ${capability.id}`, capability.maturityInputs, ['capability']);
  const capabilityInputs = mergeMaturityMaps(defaults, overrides);
  const hviaInputs = deriveHviaDefaults(capability);
  const implementationInputs = mergeMaturityMaps({}, capability.tool.maturityInputs ?? {});
  const productBase = capability.product?.maturityInputs ?? {};
  const productInputs = capability.productOverrides
    ? mergeMaturityMaps(productBase, capability.productOverrides)
    : { ...productBase };

  const summary: CapabilityMaturitySummary = {
    total: 0,
    dimensions: {},
  };

  let totalWeight = 0;
  let weightedSum = 0;

  for (const dimension of MATURITY_DIMENSIONS) {
    const subSnapshots: CapabilityMaturitySummary['dimensions'][string]['subdimensions'] = {};
    let dimensionWeightSum = 0;
    let dimensionValueSum = 0;

    for (const subdimension of dimension.subdimensions) {
      let sourceMap: RawMaturityMap;
      if (subdimension.source === 'capability') sourceMap = capabilityInputs;
      else if (subdimension.source === 'implementation') sourceMap = implementationInputs;
      else if (subdimension.source === 'product') sourceMap = productInputs;
      else sourceMap = hviaInputs;

      const entry = sourceMap[subdimension.id];
      const rawValue = entry?.value;
      const isSkipped = rawValue === null;
      let value = isSkipped ? 0 : rawValue ?? 0;
      let reason = entry?.reason;

      if (!capability.tool) {
        value = 0;
      }

      if (!reason) {
        if (isSkipped) {
          reason = 'Not scored; excluded from maturity calculation.';
        } else if (subdimension.source === 'implementation' && !capability.tool) {
          reason = 'No implementation linked to this capability.';
        } else {
          reason = defaultReasonBySource[subdimension.source];
        }
      }

      subSnapshots[subdimension.id] = {
        id: subdimension.id,
        name: subdimension.name,
        weight: subdimension.weight,
        value,
        reason,
      };

      if (!isSkipped) {
        dimensionWeightSum += subdimension.weight;
        dimensionValueSum += value * subdimension.weight;
      }
    }

    const hasScoredSubdimensions = dimensionWeightSum > 0;
    const dimensionValue = hasScoredSubdimensions ? dimensionValueSum / dimensionWeightSum : 0;
    summary.dimensions[dimension.id] = {
      id: dimension.id,
      name: dimension.name,
      color: dimension.color,
      iconPath: dimension.iconPath,
      iconViewBox: dimension.iconViewBox,
      weight: dimension.weight,
      value: Number(dimensionValue.toFixed(2)),
      subdimensions: subSnapshots,
    };

    if (hasScoredSubdimensions) {
      totalWeight += dimension.weight;
      weightedSum += dimensionValue * dimension.weight;
    }
  }

  summary.total = totalWeight ? Number((weightedSum / totalWeight).toFixed(2)) : 0;

  return { summary, inputs: capabilityInputs };
};

function resolveCluster(
  node: Cluster | Capability,
  toolIndex: Record<string, Tool>,
  hviaIndex: Record<string, HVIA>,
  productIndex: Record<string, Product>,
  inheritedProductId?: string
): Cluster | Capability {
  // If it's a capability, resolve its links
  if ((node as Capability).type) {
    const cap = node as Capability;
    const resolved: Capability = {
      ...cap,
      reviewed: cap.reviewed ?? false,
    };
    const productId = resolved.productId ?? inheritedProductId;
    if (cap.toolId) {
      resolved.tool = toolIndex[cap.toolId];
    }
    if (cap.useCaseRefs && cap.useCaseRefs.length) {
      const collected: ResolvedUseCaseRef[] = cap.useCaseRefs
        .map(({ hviaId, useCaseId, maturity }) => {
          const hvia = hviaIndex[hviaId];
          if (!hvia) return undefined;
          const uc = hvia.useCases.find((u) => u.id === useCaseId);
          if (!uc) return undefined;
          return { ...uc, maturity, hviaId, hviaName: hvia.name } as ResolvedUseCaseRef;
        })
        .filter((v): v is ResolvedUseCaseRef => Boolean(v));
      resolved.useCases = collected;
    }
    if (productId) {
      resolved.productId = productId;
      resolved.product = productIndex[productId];
    }
    const productOverrides = sanitizeMaturityEntries(
      `Capability ${cap.id} product overrides`,
      cap.productOverrides,
      ['product']
    );
    if (Object.keys(productOverrides).length) {
      resolved.productOverrides = productOverrides;
    }
    const documentationLink = resolveDocumentationLink(resolved, resolved.product);
    if (documentationLink) {
      resolved.documentationLink = documentationLink;
    }
    const { summary, inputs } = buildCapabilityMaturity(resolved);
    resolved.maturityInputs = inputs;
    resolved.maturity = summary;
    return resolved;
  }

  // Otherwise it's a cluster; recurse into children
  const cluster = node as Cluster;
  const nextProductId = cluster.productId ?? inheritedProductId;
  const newChildren = (cluster.children || []).map((child) =>
    resolveCluster(child, toolIndex, hviaIndex, productIndex, nextProductId)
  );
  return { ...cluster, children: newChildren };
}

export function loadCapabilities(
  imports: string[],
  opts?: { toolIndex?: Record<string, Tool>; hviaIndex?: Record<string, HVIA>; productIndex?: Record<string, Product> }
): Cluster[] {
  const toolIndex = opts?.toolIndex ?? {};
  const hviaIndex = opts?.hviaIndex ?? {};
  const productIndex = opts?.productIndex ?? {};
  return imports.map((p) => {
    const mod = capabilityMap[p];
    if (!mod) {
      throw new Error(`Capability JSON not bundled: ${p}. Add a static import in capabilities-loader.ts`);
    }
    // Return a deep-resolved copy so original JSON shape remains untouched
    return resolveCluster(mod, toolIndex, hviaIndex, productIndex) as Cluster;
  });
}
