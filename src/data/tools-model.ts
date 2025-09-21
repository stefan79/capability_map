export type Tool = {
  id: string;
  name: string;
  description: string;
  url: string;
  logo: string; // path/URL to logo asset
};

export type Vendor = {
  id: string; // mnemonic from the name
  name: string;
  url: string;
  logo: string; // path/URL to logo asset
  tools: Tool[];
};

// Type guard
export function isVendor(node: Vendor | Tool): node is Vendor {
  return (node as Vendor).tools !== undefined;
}
