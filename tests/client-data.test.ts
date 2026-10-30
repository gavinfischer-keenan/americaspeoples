import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import * as client from "../src/client-data";
import type { AtlasManifest } from "../src/api-contracts";
import type { CatalogRecord, Dataset, EvidenceRecord } from "../src/model";
import { fixture } from "./fixtures";

const version = "client-contract-test";
const manifest: AtlasManifest = {
  schemaVersion: 1,
  version,
  reviewedAt: "2026-10-29",
  coverage: "Synthetic contract checks",
  license: "Test fixture",
  apiVersion: 1,
  recordCount: 2,
  hazardCount: 0,
  iceIndex: [],
};
const records = [
  { ...fixture(), id: "first" },
  { ...fixture(), id: "second" },
];
const complete: Dataset = {
  schemaVersion: 1,
  version,
  reviewedAt: manifest.reviewedAt,
  coverage: manifest.coverage,
  license: manifest.license,
  records,
};
const catalog = (record: EvidenceRecord): CatalogRecord => {
  const { sources, claims, review, ...mapFields } = record;
  return {
    ...mapFields,
    detailLevel: "catalog",
    claims: claims.map(({ id, text, status }) => ({ id, text, status })),
    review: {
      summary: review.summary,
      limitations: review.limitations,
      reviewedAt: review.reviewedAt,
      relatedIds: review.relatedIds,
    },
  };
};
function response(body: unknown, status = 200, headerVersion = version) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Atlas-Version": headerVersion,
    },
  });
}
type RequestCall = { url: URL; init?: RequestInit };
function backend(
  t: TestContext,
  handle?: (call: RequestCall) => Response | Promise<Response> | undefined,
) {
  const calls: RequestCall[] = [];
  t.mock.method(
    globalThis,
    "fetch",
    async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(
        input instanceof Request ? input.url : String(input),
        "http://atlas.test",
      );
      const call = { url, init };
      calls.push(call);
      const custom = handle?.(call);
      if (custom) return custom;
      if (url.pathname === "/api/manifest") return response(manifest);
      if (url.pathname === "/api/catalog") {
        const offset = Number(url.searchParams.get("offset"));
        return response({
          records: [catalog(records[offset])],
          total: 2,
          nextOffset: offset === 0 ? 1 : null,
          version,
        });
      }
      if (url.pathname === "/api/export") return response(complete);
      if (url.pathname.startsWith("/api/records/"))
        return response(
          records.find(
            (r) =>
              r.id ===
              decodeURIComponent(url.pathname.slice("/api/records/".length)),
          ) ?? records[0],
        );
      throw new Error("Unexpected test request: " + url.pathname);
    },
  );
  return calls;
}

test("catalog initialization paginates and full detail/snapshot never replace catalog identities", async (t) => {
  const calls = backend(t);
  await client.initializeDataset();
  const originalDataset = client.dataset;
  const originalRows = client.dataset.records;
  const originalRow = originalRows[0];
  const before = structuredClone(originalDataset);
  assert.deepEqual(
    originalRows.map((r) => r.id),
    ["first", "second"],
  );
  assert.equal(originalRow.detailLevel, "catalog");
  assert.ok(!("sources" in originalRow));
  assert.equal((await client.fullRecord("first")).sources.length, 1);
  assert.deepEqual(await client.completeDataset(), complete);
  assert.strictEqual(client.dataset, originalDataset);
  assert.strictEqual(client.dataset.records, originalRows);
  assert.strictEqual(client.dataset.records[0], originalRow);
  assert.deepEqual(client.dataset, before);
  assert.deepEqual(
    calls
      .filter((c) => c.url.pathname === "/api/catalog")
      .map((c) => c.url.searchParams.get("offset")),
    ["0", "1"],
  );
  // Incomplete map rows cannot become correction/export evidence accidentally.
  if (false) {
    // @ts-expect-error CatalogRecord deliberately lacks bibliography/full review.
    const full: EvidenceRecord = originalRow;
    void full;
  }
});

test("concurrent detail and full snapshot reads share requests and initialization clears caches", async (t) => {
  const calls = backend(t);
  await client.initializeDataset();
  const first = client.fullRecord("first");
  assert.strictEqual(client.fullRecord("first"), first);
  await first;
  assert.strictEqual(client.fullRecord("first"), first);
  const snapshot = client.completeDataset();
  assert.strictEqual(client.completeDataset(), snapshot);
  await snapshot;
  assert.equal(
    calls.filter((c) => c.url.pathname === "/api/records/first").length,
    1,
  );
  assert.equal(calls.filter((c) => c.url.pathname === "/api/export").length, 1);
  await client.initializeDataset();
  await client.fullRecord("first");
  await client.completeDataset();
  assert.equal(
    calls.filter((c) => c.url.pathname === "/api/records/first").length,
    2,
  );
  assert.equal(calls.filter((c) => c.url.pathname === "/api/export").length, 2);
});

test("failed detail and full snapshot requests can be retried", async (t) => {
  const attempts = new Map<string, number>();
  backend(t, ({ url }) => {
    if (!["/api/records/first", "/api/export"].includes(url.pathname)) return;
    const count = (attempts.get(url.pathname) ?? 0) + 1;
    attempts.set(url.pathname, count);
    if (count === 1) return response({ error: "Temporary" }, 503);
  });
  await client.initializeDataset();
  await assert.rejects(client.fullRecord("first"), /503/);
  assert.equal((await client.fullRecord("first")).id, "first");
  await assert.rejects(client.completeDataset(), /503/);
  assert.deepEqual(await client.completeDataset(), complete);
  assert.deepEqual([...attempts.values()], [2, 2]);
});

test("header, page body and full snapshot versions reject mixed editions", async (t) => {
  let mode = "header";
  backend(t, ({ url }) => {
    if (url.pathname === "/version-test")
      return response({}, 200, "different-edition");
    if (url.pathname === "/api/search")
      return response({
        ids: ["first"],
        total: 1,
        nextOffset: null,
        version: "different-edition",
      });
    if (url.pathname === "/api/export" && mode === "snapshot")
      return response({ ...complete, version: "different-edition" });
  });
  await client.initializeDataset();
  await assert.rejects(client.getJSON("/version-test"), /Atlas updated/);
  await assert.rejects(
    client.searchRecordIds("first"),
    /updated during loading/,
  );
  mode = "snapshot";
  await assert.rejects(client.completeDataset(), /Reload before importing/);
  mode = "fixed";
  assert.deepEqual(await client.completeDataset(), complete);
});

test("search requests only IDs, encodes text, paginates and propagates cancellation", async (t) => {
  const controller = new AbortController();
  const calls = backend(t, ({ url, init }) => {
    if (url.pathname !== "/api/search") return;
    assert.equal(init?.signal?.aborted, false);
    const offset = Number(url.searchParams.get("offset"));
    return response({
      ids: offset === 0 ? ["first"] : ["second", "first"],
      total: 3,
      nextOffset: offset === 0 ? 1 : null,
      version,
    });
  });
  await client.initializeDataset();
  assert.deepEqual(
    await client.searchRecordIds("A & B/é", controller.signal),
    new Set(["first", "second"]),
  );
  const searches = calls.filter((c) => c.url.pathname === "/api/search");
  assert.equal(searches.length, 2);
  assert.deepEqual(
    searches.map((c) => c.url.searchParams.get("offset")),
    ["0", "1"],
  );
  assert.ok(
    searches.every(
      (c) =>
        c.url.searchParams.get("q") === "A & B/é" &&
        c.url.searchParams.get("limit") === "1000" &&
        c.init?.signal instanceof AbortSignal,
    ),
  );
  assert.ok(!calls.some((c) => c.url.pathname === "/api/records"));
});

test("search cancellation between pages aborts the next fetch and prevents further paging", async (t) => {
  const controller = new AbortController();
  const reason = new Error("Superseded search");
  let pages = 0;
  backend(t, ({ url, init }) => {
    if (url.pathname !== "/api/search") return;
    pages++;
    if (pages === 1) {
      controller.abort(reason);
      return response({ ids: ["first"], total: 3, nextOffset: 1, version });
    }
    assert.equal(init?.signal?.aborted, true);
    assert.strictEqual(init?.signal?.reason, reason);
    return Promise.reject(init?.signal?.reason);
  });
  await client.initializeDataset();
  await assert.rejects(
    client.searchRecordIds("first", controller.signal),
    reason,
  );
  assert.equal(pages, 2);
});

test("pagination rejects a repeated cursor instead of looping indefinitely", async (t) => {
  backend(t, ({ url }) =>
    url.pathname === "/api/search"
      ? response({ ids: ["first"], total: 2, nextOffset: 0, version })
      : undefined,
  );
  await client.initializeDataset();
  await assert.rejects(
    client.searchRecordIds("first"),
    /Invalid atlas paging cursor/,
  );
});

test("caller cancellation stays connected while the response JSON body is being read", async (t) => {
  const controller = new AbortController();
  const reason = new Error("Cancelled during response body");
  let requestSignal: AbortSignal | undefined;
  let startBody!: () => void;
  const bodyStarted = new Promise<void>((resolve) => {
    startBody = resolve;
  });
  let rejectBody!: (error: Error) => void;
  backend(t, ({ url, init }) => {
    if (url.pathname !== "/slow-body") return;
    requestSignal = init?.signal ?? undefined;
    const result = response({});
    result.json = () =>
      new Promise((_resolve, reject) => {
        rejectBody = reject;
        startBody();
        requestSignal?.addEventListener(
          "abort",
          () => reject(requestSignal?.reason),
          { once: true },
        );
      });
    return result;
  });
  await client.initializeDataset();
  const request = client.getJSON("/slow-body", controller.signal);
  // Attach a rejection handler before triggering cancellation.
  const rejected = assert.rejects(request, reason);
  await bodyStarted;
  controller.abort(reason);
  try {
    assert.equal(requestSignal?.aborted, true);
  } finally {
    rejectBody(reason);
    await rejected;
  }
});
