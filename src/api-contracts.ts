import type { CatalogRecord, Dataset } from "./model";
export interface IceIndexEntry {
  scenario: string;
  ageCalBP: number;
}
export interface AtlasManifest extends Omit<Dataset, "records"> {
  apiVersion: 1;
  recordCount: number;
  hazardCount: number;
  iceIndex: IceIndexEntry[];
}
export interface ApiPage<T> {
  records: T[];
  total: number;
  nextOffset: number | null;
  version: string;
}
export interface SearchPage {
  ids: string[];
  total: number;
  nextOffset: number | null;
  version: string;
}
export interface CatalogDataset extends Omit<Dataset, "records"> {
  readonly records: readonly CatalogRecord[];
}
