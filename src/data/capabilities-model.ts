// Import resolved object types for exploded details
import type { UseCase } from './hvias-model';
import type { Tool } from './tools-model';

export type CapabilityStatus = 'implemented' | 'not implemented' | 'partially';
export type CapabilityType = 'technology' | 'pattern' | 'policy';

export type Capability = {
  id: string;
  title: string;
  description: string;
  status: CapabilityStatus;
  type: CapabilityType;
  // Optional raw references (as present in JSON)
  toolId?: string; // references Tool.id
  useCaseRefs?: { hviaId: string; useCaseId: string }[]; // references UseCase within an HVIA
  // Exploded/resolved fields for easy UI iteration (populated by loader)
  tool?: Tool; // resolved from toolId
  useCases?: UseCase[]; // resolved from useCaseRefs
}

export type Cluster = {
  id: string;
  title?: string;
  description?: string;
  foundational?: boolean;
  children: (Cluster | Capability)[];
}

// Helper type guard to differentiate between Cluster and Capability
export function isCluster(node: Cluster | Capability): node is Cluster {
  return (node as Cluster).children !== undefined;
}
