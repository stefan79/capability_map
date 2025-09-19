export type View = {
  render(data: any): void;
  unmount(): void;
}
