// Browser regressions share the actual Python/SQLite API, never a mock dataset.
import { chromium } from "playwright";
import { existsSync } from "node:fs";
import { gunzipSync, strFromU8 } from "fflate";
import assert from "node:assert/strict";
import { createStaticServer } from "./static-server.mjs";

export async function browserFixture(options = {}) {
  const server = createStaticServer(process.env.DIST_PATH || "dist");
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    const response = await fetch(origin + "/api/export");
    assert.equal(
      response.status,
      200,
      "The actual release API must start before browser checks",
    );
    const dataset = await response.json();
    const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
    const executablePath =
      process.env.BROWSER_PATH || (existsSync(edge) ? edge : undefined);
    browser = await chromium.launch({
      headless: true,
      ...(executablePath ? { executablePath } : {}),
    });
    const context = await browser.newContext({
      acceptDownloads: true,
      viewport: { width: 1440, height: 1000 },
      ...options,
    });
    const page = await context.newPage();
    const requests = [],
      errors = [];
    page.on("request", (request) =>
      requests.push({ url: request.url(), method: request.method() }),
    );
    page.on("pageerror", (error) => errors.push(error.message));
    return {
      browser,
      context,
      page,
      dataset,
      requests,
      errors,
      url: origin + "/",
      assertPrivacy() {
        assert.deepEqual(errors, []);
        assert.ok(requests.length > 0);
        assert.ok(
          requests.every(
            (r) => r.url.startsWith(origin + "/") && r.method === "GET",
          ),
          "Only same-origin public GETs are allowed; suggestions stay local",
        );
        assert.ok(
          requests.some((r) => new URL(r.url).pathname === "/api/manifest"),
        );
      },
      async close() {
        await browser.close();
        await new Promise((resolve) => server.close(resolve));
      },
    };
  } catch (error) {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
    throw error;
  }
}

export async function localPackage(page) {
  const stored = await page.evaluate(() =>
    localStorage.getItem("americas-peoples-proposals-v1"),
  );
  assert.ok(stored, "A proposal collection must have been persisted");
  const prefix = "ap-gzip-v1:";
  return JSON.parse(
    stored.startsWith(prefix)
      ? strFromU8(
          gunzipSync(Buffer.from(stored.slice(prefix.length), "base64")),
        )
      : stored,
  );
}

export async function previewSuggestions(page) {
  const disclosure = page.locator(".culture-disclosure");
  if (!(await disclosure.evaluate((el) => el.open)))
    await disclosure.locator("summary").click();
  await page.getByLabel("Preview complete suggestions").check();
}

export async function layerOptions(page) {
  if (!(await page.locator("#layer-options").isVisible()))
    await page.locator("#toggle-layers").click();
}
