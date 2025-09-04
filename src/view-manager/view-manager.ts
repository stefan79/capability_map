import { View } from '../views/view';
import { GlobalData } from '../data/global-model';

export class ViewManager {
  private currentView: View | null = null;
  private views: { [key: string]: View } = {};

  constructor(private containerId: string) {}

  registerView(name: string, view: View): void {
    this.views[name] = view;
  }

  switchView(name: string, data: GlobalData): void {
    if (this.currentView) {
      this.currentView.unmount();
    }

    const newView = this.views[name];
    if (newView) {
      let viewData: any;
      if (name === 'view1') {
        viewData = data.view1Data;
      } else if (name === 'view2') {
        viewData = data.view2Data;
      }

      newView.render(viewData);
      this.currentView = newView;
    }
  }
}
