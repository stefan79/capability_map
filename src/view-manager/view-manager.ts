import { View } from '../views/view';

export class ViewManager {
  private currentView: View | null = null;
  private views: { [key: string]: View } = {};

  constructor(private containerId: string) {}

  registerView(name: string, view: View): void {
    this.views[name] = view;
  }

  switchView(name: string, data: any): void {
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
      } else if (name === 'capability-view') {
        viewData = {
          root: data.capabilitiesData,
          hvias: data.hviasData?.children ?? [],
        };
      }

      newView.render(viewData);
      this.currentView = newView;
    }
  }
}
