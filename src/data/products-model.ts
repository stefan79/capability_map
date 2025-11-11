import type { RawMaturityMap } from './maturity-types';

export type ProductContact = {
  name: string;
  email: string;
};

export type Product = {
  id: string;
  name: string;
  description?: string;
  teamName: string;
  teamLink?: string;
  dpo: ProductContact;
  sa: ProductContact;
  reviewed?: boolean;
  maturityInputs?: RawMaturityMap;
};
