import { loadAllData, type GlobalData } from './data/loader/data-loader';
import { ViewManager } from './view-manager/view-manager';
import { CapabilityView } from './views/capability-view/capability-view';
import { View1 } from './views/view1/view1';
import { View2 } from './views/view2/view2';

// Data loading is centralized in data/loader/data-loader.ts

/**
 * Initializes the application after all data has been loaded.
 */
async function main(): Promise<void> {
  const globalData = await loadAllData();
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


