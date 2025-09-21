import type { Capability,Cluster } from '../capabilities-model';
import globalDataJson from '../data.json';
import type { HVIA } from '../hvias-model';
import type { Tool,Vendor } from '../tools-model';
import { loadCapabilities } from './capabilities-loader';
import { loadHVIAs } from './hvias-loader';
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
  hviasData: {
    imports: string[];
    children: HVIA[];
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
    hviasData: base.hviasData ?? { imports: [], children: [] },
  };

  // tools (load first)
  const vendors = loadVendors(globalData.toolsData.imports || []);
  globalData.toolsData.children.push(...vendors);

  // hvias (load second)
  const hvias = loadHVIAs(globalData.hviasData.imports || []);
  globalData.hviasData.children.push(...hvias);

  // Build indexes for linking
  const toolIndex: Record<string, Tool> = {};
  for (const vendor of globalData.toolsData.children) {
    for (const tool of vendor.tools || []) {
      toolIndex[tool.id] = tool;
    }
  }
  const hviaIndex: Record<string, HVIA> = {};
  for (const h of globalData.hviasData.children) {
    hviaIndex[h.id] = h;
  }

  // capabilities (load last, resolving links)
  const capabilities = loadCapabilities(globalData.capabilitiesData.imports, {
    toolIndex,
    hviaIndex,
  });
  globalData.capabilitiesData.children.push(...capabilities);

  return globalData;
}
