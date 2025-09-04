export interface View {
  render(data: any): void;
  unmount(): void;
}
