import type { Cluster, Capability } from '../capabilities-model';
import type { Vendor } from '../tools-model';

import globalDataJson from '../data.json';
import { loadCapabilities } from './capabilities-loader';
import { loadVendors } from './tools-loader';

export type GlobalData = {
  view1Data: { value: number }[];
  view2Data: { category: string; amount: number }[];
  capabilitiesData: {
    imports: string[];
    children: (Cluster | Capability)[];
  };
  toolsData: {
    imports: string[];
    children: Vendor[];
  };
};

export async function loadAllData(): Promise<GlobalData> {
  // start from the base JSON; cast via unknown to satisfy TS overlap
  const base = globalDataJson as unknown as Partial<GlobalData>;
  const globalData: GlobalData = {
    view1Data: base.view1Data ?? [],
    view2Data: base.view2Data ?? [],
    capabilitiesData: base.capabilitiesData ?? { imports: [], children: [] },
    toolsData: base.toolsData ?? { imports: [], children: [] },
  };

  // capabilities
  const capabilities = loadCapabilities(globalData.capabilitiesData.imports);
  globalData.capabilitiesData.children.push(...capabilities);

  // tools
  const vendors = loadVendors(globalData.toolsData.imports || []);
  globalData.toolsData.children.push(...vendors);

  return globalData;
}
