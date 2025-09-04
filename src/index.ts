import { ViewManager } from './view-manager/view-manager';
import { View1 } from './views/view1/view1';
import { View2 } from './views/view2/view2';
import { CapabilityView } from './views/capability-view/capability-view';
import globalData from './data/data.json';

document.addEventListener('DOMContentLoaded', () => {
  const viewManager = new ViewManager('content');

  // Register views
  viewManager.registerView('view1', new View1('content'));
  viewManager.registerView('view2', new View2('content'));
  viewManager.registerView('capability-view', new CapabilityView('content'));

  // Set up navigation
  document.getElementById('view1-btn')?.addEventListener('click', () => {
    viewManager.switchView('view1', globalData);
  });

  document.getElementById('view2-btn')?.addEventListener('click', () => {
    viewManager.switchView('view2', globalData);
  });

  document.getElementById('capability-view-btn')?.addEventListener('click', () => {
    viewManager.switchView('capability-view', globalData);
  });

  // Set initial view
  viewManager.switchView('view1', globalData);
});
