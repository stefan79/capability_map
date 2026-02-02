import type { RawMaturityMap } from './maturity-types';

export type UseCase = {
  id: string;
  name: string;
  url: string;
};

export type HVIA = {
  id: string;
  name: string;
  url: string;
  reviewed?: boolean;
  maturityInputs?: RawMaturityMap;
  useCases: UseCase[];
};

// Type guard
export function isHVIA(node: HVIA | UseCase): node is HVIA {
  return (node as HVIA).useCases !== undefined;
}
