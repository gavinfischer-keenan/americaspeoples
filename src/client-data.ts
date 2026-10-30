import type { Dataset, EvidenceRecord, CatalogRecord } from "./model";
import type {
  AtlasManifest,
  ApiPage,
  CatalogDataset,
  SearchPage,
} from "./api-contracts";

export let dataset: CatalogDataset;
export let manifest: AtlasManifest;
const details = new Map<string, Promise<EvidenceRecord>>();
let fullSnapshot: Promise<Dataset> | undefined;

/** Cancellation spans pagination. Version checks prevent mixed release data. */
export async function getJSON<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  const timeout = setTimeout(
    () => controller.abort(new Error("Atlas request timed out.")),
    20000,
  );
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) abort();
  try {
    const response = await fetch(path, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok)
      throw new Error(
        `Atlas request failed (${response.status}). Please retry.`,
      );
    const version = response.headers.get("X-Atlas-Version");
    if (manifest && version && version !== manifest.version)
      throw new Error("Atlas updated. Reload to use one consistent edition.");
    return await response.json();
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}
async function collectPages<T>(
  path: string,
  field: "records" | "ids",
  signal?: AbortSignal,
): Promise<T[]> {
  const result: T[] = [];
  let offset: number | null = 0;
  while (offset !== null) {
    const page: ApiPage<T> | SearchPage = await getJSON<
      ApiPage<T> | SearchPage
    >(
      `${path}${path.includes("?") ? "&" : "?"}limit=1000&offset=${offset}`,
      signal,
    );
    if (page.version !== manifest.version)
      throw new Error(
        "Atlas updated during loading. Reload to use one consistent edition.",
      );
    const rows =
      field === "ids" ? (page as SearchPage).ids : (page as ApiPage<T>).records;
    result.push(...(rows as T[]));
    if (
      page.nextOffset !== null &&
      (!Number.isInteger(page.nextOffset) || page.nextOffset <= offset)
    )
      throw new Error("Invalid atlas paging cursor.");
    offset = page.nextOffset;
  }
  return result;
}
export function pages<T>(path: string, signal?: AbortSignal) {
  return collectPages<T>(path, "records", signal);
}
export async function initializeDataset() {
  manifest = await getJSON<AtlasManifest>("/api/manifest");
  if (manifest.apiVersion !== 1)
    throw new Error("Unsupported atlas API version.");
  const records = await pages<CatalogRecord>("/api/catalog");
  // Detail visits never mutate the catalog's completeness or cached map identities.
  dataset = { ...manifest, records };
  details.clear();
  fullSnapshot = undefined;
}
export function fullRecord(id: string): Promise<EvidenceRecord> {
  let request = details.get(id);
  if (!request) {
    request = getJSON<EvidenceRecord>(
      "/api/records/" + encodeURIComponent(id),
    ).catch((error) => {
      details.delete(id);
      throw error;
    });
    details.set(id, request);
  }
  return request;
}
export function completeDataset(): Promise<Dataset> {
  if (!fullSnapshot)
    fullSnapshot = getJSON<Dataset>("/api/export")
      .then((complete) => {
        if (complete.version !== dataset.version)
          throw new Error("Atlas updated. Reload before importing against it.");
        return complete;
      })
      .catch((error) => {
        fullSnapshot = undefined;
        throw error;
      });
  return fullSnapshot;
}
export async function searchRecordIds(
  query: string,
  signal?: AbortSignal,
): Promise<Set<string>> {
  return new Set(
    await collectPages<string>(
      "/api/search?q=" + encodeURIComponent(query),
      "ids",
      signal,
    ),
  );
}
