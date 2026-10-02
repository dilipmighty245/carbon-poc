export interface PassportSharingSettings {
  audience: string;
  recipient: string;
  expiry: string;
  fields: string[];
  demo?: boolean;
}

export interface IssuedPassportRecord {
  id: string;
  product: string;
  batch: string;
  version: string;
  intensity: number;
  issuedAt: string;
  status: string;
  demo?: boolean;
}

export interface PassportVersionEntry {
  version: string;
  date: string;
  author: string;
  changes: string;
  hash: string;
  status: string;
}
