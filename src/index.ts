import { Capability,Cluster } from './data/capabilities-model';
// Statically import JSON assets so Parcel parses and includes them correctly.
import globalDataJson from './data/data.json';
import analyticalAi from './data/capabilities/analytical-ai.json';
import governanceObservability from './data/capabilities/governance-observability.json';
import generativeAi from './data/capabilities/generative-ai.json';
import foundationServices from './data/capabilities/foundation-services.json';
import { ViewManager } from './view-manager/view-manager';
import { CapabilityView } from './views/capability-view/capability-view';
import { View1 } from './views/view1/view1';
import { View2 } from './views/view2/view2';

// Define the structure of our data files
type GlobalData = {
  view1Data: { value: number }[];
  view2Data: { category: string; amount: number }[];
  capabilitiesData: {
    imports: string[];
    children: (Cluster | Capability)[];
  };
};

// No fetch needed; Parcel handles JSON imports and gives us parsed objects.

/**
 * Dynamically loads capability data based on the import paths in data.json.
 * This function first loads the main data.json file, then dynamically imports
 * each capability module specified in the 'imports' array.
 */
async function loadData(): Promise<GlobalData> {
  // Use the statically imported main data.
  const globalData: GlobalData = globalDataJson as GlobalData;

  // Map known capability JSON modules by their relative paths as listed in data.json.
  const capabilityMap: Record<string, Cluster> = {
    './capabilities/analytical-ai.json': analyticalAi as Cluster,
    './capabilities/governance-observability.json': governanceObservability as Cluster,
    './capabilities/generative-ai.json': generativeAi as Cluster,
    './capabilities/foundation-services.json': foundationServices as Cluster,
  };

  const capabilities: Cluster[] = globalData.capabilitiesData.imports.map((p) => {
    const mod = capabilityMap[p];
    if (!mod) {
      throw new Error(`Capability JSON not bundled: ${p}. Ensure it is statically imported in index.ts.`);
    }
    return mod;
  });

  // Populate the children array with the loaded capabilities.
  globalData.capabilitiesData.children.push(...capabilities);

  return globalData;
}

/**
 * Initializes the application after all data has been loaded.
 */
async function main(): Promise<void> {
  const globalData = await loadData();
  const viewManager = new ViewManager('content');

  // Register views
  viewManager.registerView('view1', new View1('content'));
  viewManager.registerView('view2', new View2('content'));
  viewManager.registerView('capability-view', new CapabilityView('content'));

  // Set up navigation
  document.getElementById('view1-btn')?.addEventListener('click', (): void => {
    viewManager.switchView('view1', globalData);
  });

  document.getElementById('view2-btn')?.addEventListener('click', (): void => {
    viewManager.switchView('view2', globalData);
  });

  document.getElementById('capability-view-btn')?.addEventListener('click', (): void => {
    viewManager.switchView('capability-view', globalData);
  });

  // Set initial view
  viewManager.switchView('capability-view', globalData);
}

// Start the application once the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', (): void => {
  main().catch((err) => {
    // Ensure unhandled rejections in the async init do not get swallowed
    // and keep the event listener return type as void.
    console.error('Failed to initialize application:', err);
  });
});


