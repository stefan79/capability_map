export type CapabilityStatus = 'implemented' | 'not implemented' | 'partially';
export type CapabilityType = 'technology' | 'pattern' | 'policy';

export interface Capability {
  title: string;
  description: string;
  status: CapabilityStatus;
  type: CapabilityType;
}

export interface Cluster {
  title?: string;
  description?: string;
  foundational?: boolean;
  children: (Cluster | Capability)[];
}

// Helper type guard to differentiate between Cluster and Capability
export function isCluster(node: Cluster | Capability): node is Cluster {
  return (node as Cluster).children !== undefined;
}
