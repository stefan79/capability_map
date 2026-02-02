import type { Capability } from './capabilities-model';

export const getStatusMaturity = (capability: Capability): number => {
  const { status } = capability;
  if (status === 'implemented') return 4;
  if (status === 'partially') return 2;
  if (status === 'not implemented') return 0;
  if (typeof status === 'number' && Number.isFinite(status)) {
    return Math.max(0, Math.min(4, Math.floor(status)));
  }
  return 0;
};
