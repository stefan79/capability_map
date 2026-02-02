export type RawMaturityEntry = {
  value: number | null;
  reason?: string;
};

export type RawMaturityMap = Record<string, RawMaturityEntry>;

export type MaturitySubdimensionSnapshot = {
  id: string;
  name: string;
  weight: number;
  value: number;
  reason?: string;
};

export type MaturityDimensionSnapshot = {
  id: string;
  name: string;
  color: string;
  iconPath: string;
  iconViewBox: string;
  weight: number;
  value: number;
  subdimensions: Record<string, MaturitySubdimensionSnapshot>;
};

export type CapabilityMaturitySummary = {
  total: number;
  dimensions: Record<string, MaturityDimensionSnapshot>;
};
