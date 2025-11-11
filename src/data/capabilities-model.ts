// Import resolved object types for exploded details
import type { UseCase } from './hvias-model';
import type { CapabilityMaturitySummary, RawMaturityMap } from './maturity-types';
import type { Product } from './products-model';
import type { Tool } from './tools-model';

export type CapabilityStatus = 'implemented' | 'not implemented' | 'partially';
// Some capability JSONs may encode status as a numeric maturity flag (0|1)
export type CapabilityMaturity = 0 | 1;
export type CapabilityType = 'technology' | 'pattern' | 'policy';

// New: explicit HVIA use case reference with maturity per reference
export type UseCaseRef = {
  hviaId: string;
  useCaseId: string;
  // 0=not-started, 1=requested, 2=in-use, 3=established
  maturity: 0 | 1 | 2 | 3;
};

// Resolved use case record that carries the maturity value forward
export type ResolvedUseCaseRef = UseCase & { maturity: 0 | 1 | 2 | 3; hviaId: string; hviaName: string };

export type Capability = {
  id: string;
  title: string;
  description: string;
  link?: string;
  reviewed?: boolean;
  status: CapabilityStatus | CapabilityMaturity;
  type: CapabilityType;
  productId?: string;
  productOverrides?: RawMaturityMap;
  // Optional raw references (as present in JSON)
  toolId?: string; // references Tool.id
  useCaseRefs?: UseCaseRef[]; // references UseCase within an HVIA, each with maturity
  maturityInputs?: RawMaturityMap;
  // Exploded/resolved fields for easy UI iteration (populated by loader)
  tool?: Tool; // resolved from toolId
  useCases?: ResolvedUseCaseRef[]; // resolved from useCaseRefs (includes maturity)
  product?: Product;
  maturity?: CapabilityMaturitySummary;
};

export type Cluster = {
  id: string;
  title?: string;
  description?: string;
  foundational?: boolean;
  productId?: string;
  children: (Cluster | Capability)[];
}

// Helper type guard to differentiate between Cluster and Capability
export function isCluster(node: Cluster | Capability): node is Cluster {
  return (node as Cluster).children !== undefined;
}
