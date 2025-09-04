import { ViewManager } from './view-manager/view-manager';
import { View1 } from './views/view1/view1';
import { View2 } from './views/view2/view2';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('./data/data.json');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const globalData = await response.json();

    const viewManager = new ViewManager('content');

    // Register views
    viewManager.registerView('view1', new View1('content'));
    viewManager.registerView('view2', new View2('content'));

    // Set up navigation
    document.getElementById('view1-btn')?.addEventListener('click', () => {
      viewManager.switchView('view1', globalData);
    });

    document.getElementById('view2-btn')?.addEventListener('click', () => {
      viewManager.switchView('view2', globalData);
    });

    // Set initial view
    viewManager.switchView('view1', globalData);

  } catch (error) {
    console.error('Failed to load or process data:', error);
    const content = document.getElementById('content');
    if (content) {
      content.innerHTML = '<p style="color: red;">Failed to load data. Please check the console for details.</p>';
    }
  }
});
