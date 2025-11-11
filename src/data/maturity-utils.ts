import { clampMaturityValue, MATURITY_DIMENSIONS, MATURITY_SUBDIMENSION_MAP, type MaturitySource } from './maturity-config';
import type {
  CapabilityMaturitySummary,
  MaturitySubdimensionSnapshot,
  RawMaturityMap,
} from './maturity-types';

export const sanitizeMaturityEntries = (
  entityLabel: string,
  raw: RawMaturityMap | undefined,
  allowedSources?: MaturitySource[]
): RawMaturityMap => {
  if (!raw) return {};
  const allowed = allowedSources ? new Set(allowedSources) : null;
  return Object.entries(raw).reduce<RawMaturityMap>((acc, [key, value]) => {
    const definition = MATURITY_SUBDIMENSION_MAP[key];
    if (!definition) {
      throw new Error(`${entityLabel} references unknown maturity subdimension "${key}". Update maturity-config.ts.`);
    }
    if (allowed && !allowed.has(definition.source)) {
      throw new Error(`${entityLabel} cannot set ${definition.name} because it belongs to ${definition.source}.`);
    }
    acc[key] = {
      value: clampMaturityValue(value?.value),
      reason: value?.reason,
    };
    return acc;
  }, {});
};

export const mergeMaturityMaps = (base: RawMaturityMap, overrides?: RawMaturityMap): RawMaturityMap => {
  if (!overrides) return { ...base };
  const merged: RawMaturityMap = { ...base };
  for (const [key, entry] of Object.entries(overrides)) {
    merged[key] = { ...entry };
  }
  return merged;
};

export const createZeroMaturitySummary = (reason: string): CapabilityMaturitySummary => {
  const dimensions = MATURITY_DIMENSIONS.reduce<CapabilityMaturitySummary['dimensions']>((dimAcc, dimension) => {
    const subdimensions = dimension.subdimensions.reduce<Record<string, MaturitySubdimensionSnapshot>>((subAcc, sub) => {
      subAcc[sub.id] = {
        id: sub.id,
        name: sub.name,
        weight: sub.weight,
        value: 0,
        reason,
      };
      return subAcc;
    }, {});

    dimAcc[dimension.id] = {
      id: dimension.id,
      name: dimension.name,
      color: dimension.color,
      iconPath: dimension.iconPath,
      iconViewBox: dimension.iconViewBox,
      weight: dimension.weight,
      value: 0,
      subdimensions,
    };
    return dimAcc;
  }, {});

  return {
    total: 0,
    dimensions,
  };
};
