export type MaturitySource = 'capability' | 'implementation' | 'hvia' | 'product';

export type MaturitySubdimensionDefinition = {
  id: string;
  dimensionId: string;
  name: string;
  source: MaturitySource;
  weight: number;
  description?: string;
};

export type MaturityDimensionDefinition = {
  id: string;
  name: string;
  weight: number;
  color: string;
  iconPath: string;
  iconViewBox: string;
  subdimensions: MaturitySubdimensionDefinition[];
};

export const MAX_MATURITY_LEVEL = 4;
export const MATURITY_BAND_COUNT = 20;

const dimensionData: MaturityDimensionDefinition[] = [
  {
    id: 'adoption',
    name: 'Adoption',
    weight: 1,
    color: '#1E88E5',
    iconViewBox: '0 0 24 24',
    iconPath: 'M12 2l7 7h-4v9h-6v-9H5l7-7z',
    subdimensions: [
      {
        id: 'adoption.use-case',
        dimensionId: 'adoption',
        name: 'Use Case Adoption',
        source: 'hvia',
        weight: 1,
        description: 'How broadly the capability is active across HVIA use cases.',
      },
    ],
  },
  {
    id: 'technology',
    name: 'Technology',
    weight: 1,
    color: '#6A1B9A',
    iconViewBox: '0 0 24 24',
    iconPath: 'M12 8a4 4 0 100 8 4 4 0 000-8zm9 4l2-2-2-2-2 2a7.96 7.96 0 00-2.34-1.35l-.33-2.82h-4.66l-.33 2.82A7.96 7.96 0 006.99 10L5 8l-2 2 2 2a7.96 7.96 0 001.35 2.34l-2.82.33v4.66l2.82.33A7.96 7.96 0 0010 21l2 2 2-2a7.96 7.96 0 002.34-1.35l2.82.33v-4.66l-2.82-.33A7.96 7.96 0 0021 12z',
    subdimensions: [
      {
        id: 'technology.adoption-effort',
        dimensionId: 'technology',
        name: 'Adoption Effort',
        source: 'capability',
        weight: 1,
        description: 'Ease of adapting the capability to specific use cases.',
      },
      {
        id: 'technology.development-activity',
        dimensionId: 'technology',
        name: 'Development Activity',
        source: 'capability',
        weight: 1,
        description: 'Cadence and structure of capability development.',
      },
    ],
  },
  {
    id: 'process',
    name: 'Process',
    weight: 1,
    color: '#F57C00',
    iconViewBox: '0 0 24 24',
    iconPath: 'M4 4h16v4H4V4zm0 6h10v4H4v-4zm0 6h16v4H4v-4z',
    subdimensions: [
      {
        id: 'process.documentation',
        dimensionId: 'process',
        name: 'Documentation',
        source: 'capability',
        weight: 1,
        description: 'Quality and coverage of integration guidance.',
      },
      {
        id: 'process.self-service',
        dimensionId: 'process',
        name: 'Self-service',
        source: 'product',
        weight: 1,
        description: 'Ability to provision and onboard without central teams.',
      },
    ],
  },
  {
    id: 'people',
    name: 'People',
    weight: 1,
    color: '#2E7D32',
    iconViewBox: '0 0 24 24',
    iconPath: 'M12 12a4 4 0 10-4-4 4 4 0 004 4zm-6 8a6 6 0 0112 0v2H6z M17 8a3 3 0 103-3 3 3 0 00-3 3zm-1 12h8v-1a4 4 0 00-5-3.87 6.92 6.92 0 01-2.8 2.37V20z',
    subdimensions: [
      {
        id: 'people.roles',
        dimensionId: 'people',
        name: 'Roles & Responsibilities',
        source: 'product',
        weight: 1,
        description: 'Clarity of ownership and governance touchpoints.',
      },
      {
        id: 'people.skills',
        dimensionId: 'people',
        name: 'Skills',
        source: 'product',
        weight: 1,
        description: 'Availability of required technical and domain skills.',
      },
      {
        id: 'people.capacity',
        dimensionId: 'people',
        name: 'Capacity',
        source: 'product',
        weight: 1,
        description: 'Ability to support demand at the needed pace.',
      },
      {
        id: 'people.product-guidance',
        dimensionId: 'people',
        name: 'Product Guidance',
        source: 'product',
        weight: 1,
        description: 'Strength of playbooks, enablement, and support paths.',
      },
    ],
  },
];

export const MATURITY_DIMENSIONS = dimensionData;

export const MATURITY_DIMENSION_MAP: Record<string, MaturityDimensionDefinition> =
  Object.fromEntries(MATURITY_DIMENSIONS.map((dim) => [dim.id, dim]));

export const MATURITY_SUBDIMENSION_MAP: Record<string, MaturitySubdimensionDefinition> = MATURITY_DIMENSIONS
  .flatMap((dim) => dim.subdimensions)
  .reduce<Record<string, MaturitySubdimensionDefinition>>((acc, sub) => {
    acc[sub.id] = sub;
    return acc;
  }, {});

export type MaturityDimensionId = keyof typeof MATURITY_DIMENSION_MAP | string;
export type MaturitySubdimensionId = keyof typeof MATURITY_SUBDIMENSION_MAP | string;

export const MATURITY_COLOR_KEYFRAMES = [
  { value: 0, color: '#B0B5BD' },
  { value: 1, color: '#D9534F' },
  { value: 2, color: '#FF8C00' },
  { value: 3, color: '#FFD100' },
  { value: 4, color: '#5CB85C' },
] as const;

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const hexToRgb = (hex: string): [number, number, number] => {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized, 16);
  if (Number.isNaN(bigint)) return [0, 0, 0];
  if (normalized.length === 3) {
    const r = ((bigint >> 8) & 0xf) * 17;
    const g = ((bigint >> 4) & 0xf) * 17;
    const b = (bigint & 0xf) * 17;
    return [r, g, b];
  }
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
};

const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (value: number) => value.toString(16).padStart(2, '0');
  return `#${toHex(Math.round(r)).slice(-2)}${toHex(Math.round(g)).slice(-2)}${toHex(Math.round(b)).slice(-2)}`;
};

const interpolateChannel = (start: number, end: number, t: number): number => start + (end - start) * t;

export const interpolateHexColor = (from: string, to: string, t: number): string => {
  const [fr, fg, fb] = hexToRgb(from);
  const [tr, tg, tb] = hexToRgb(to);
  return rgbToHex(
    interpolateChannel(fr, tr, clamp01(t)),
    interpolateChannel(fg, tg, clamp01(t)),
    interpolateChannel(fb, tb, clamp01(t))
  );
};

export const lightenHexColor = (hex: string, amount = 0.2): string => {
  const [r, g, b] = hexToRgb(hex);
  const blend = (channel: number) => channel + (255 - channel) * clamp01(amount);
  return rgbToHex(blend(r), blend(g), blend(b));
};

export const clampMaturityValue = (value: number | undefined | null): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(MAX_MATURITY_LEVEL, value));
};

export const getMaturityBandColor = (value: number): string => {
  const normalized = Math.max(0, Math.min(MAX_MATURITY_LEVEL, value));
  if (normalized === 0) {
    return MATURITY_COLOR_KEYFRAMES[0].color;
  }

  const totalSteps = MATURITY_BAND_COUNT - 1;
  const stepSize = MAX_MATURITY_LEVEL / totalSteps;
  const quantized = Math.round(normalized / stepSize) * stepSize;

  let lowerKeyframe = MATURITY_COLOR_KEYFRAMES[0];
  let higherKeyframe = MATURITY_COLOR_KEYFRAMES[MATURITY_COLOR_KEYFRAMES.length - 1];
  for (let i = 0; i < MATURITY_COLOR_KEYFRAMES.length; i += 1) {
    const frame = MATURITY_COLOR_KEYFRAMES[i];
    if (frame.value <= quantized) {
      lowerKeyframe = frame;
    }
    if (frame.value >= quantized) {
      higherKeyframe = frame;
      break;
    }
  }

  if (higherKeyframe.value === lowerKeyframe.value) {
    return higherKeyframe.color;
  }

  const segmentSpan = higherKeyframe.value - lowerKeyframe.value;
  const positionInSegment = (quantized - lowerKeyframe.value) / segmentSpan;
  return interpolateHexColor(lowerKeyframe.color, higherKeyframe.color, clamp01(positionInSegment));
};
