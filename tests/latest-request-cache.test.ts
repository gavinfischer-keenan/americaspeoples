import { test } from "node:test";
import assert from "node:assert/strict";
import { LatestRequestCache } from "../src/latest-request-cache";
const flush = () => new Promise((r) => setTimeout(r, 0));
test("latest desired snapshot is drained after stale failures without inheriting their error", async () => {
  const work = new Map<
    string,
    { resolve: (value: string) => void; reject: (error: Error) => void }
  >();
  const calls: string[] = [];
  const cache = new LatestRequestCache<string>((key) => {
    calls.push(key);
    return new Promise((resolve, reject) => work.set(key, { resolve, reject }));
  });
  try {
    cache.request("old-a");
    cache.request("old-b");
    cache.request("current");
    assert.deepEqual(calls, ["old-a", "old-b"]);
    work.get("old-a")!.reject(new Error("old failed"));
    await flush();
    assert.deepEqual(calls, ["old-a", "old-b", "current"]);
    assert.equal(cache.state(), "loading");
    work.get("current")!.resolve("right geometry");
    await flush();
    assert.equal(cache.state(), "ready");
    work.get("old-b")!.reject(new Error("late failure"));
    await flush();
    assert.equal(cache.state(), "ready");
    assert.equal(cache.get("current"), "right geometry");
  } finally {
    cache.dispose();
  }
});
test("a failed current snapshot retries automatically and bounded cache retains the selection", async (t) => {
  // The error state lasts only five milliseconds in this fixture. Control the
  // clock so parallel test load cannot expire it before the assertion runs.
  t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: 1000 });
  const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
  let tries = 0;
  const cache = new LatestRequestCache(
    async () => {
      if (++tries === 1) throw new Error("temporary");
      return "ok";
    },
    1,
    1,
    5,
  );
  try {
    cache.request("current");
    await settle();
    assert.equal(cache.state(), "error");
    t.mock.timers.tick(6);
    await settle();
    assert.equal(tries, 2);
    assert.equal(cache.state(), "ready");
  } finally {
    cache.dispose();
  }
});
