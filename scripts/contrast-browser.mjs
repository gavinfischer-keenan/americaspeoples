import { chromium } from "playwright";
import { createStaticServer } from "./static-server.mjs";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
const server = createStaticServer("dist");
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const executablePath = process.env.BROWSER_PATH || (existsSync(edge) ? edge : undefined);
const browser = await chromium.launch({
  ...(executablePath ? { executablePath } : {}),
  headless: true,
});
try {
  const page = await browser.newPage({
    viewport: { width: 1600, height: 1000 },
  });
  await mkdir("test-results", { recursive: true });
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.locator("#story-select").selectOption("free");
  await page.getByRole("button", { name: "Reset map view", exact: true }).click();
  await page.locator("#time-settings-toggle").click();
  await page.getByLabel("Year number", { exact: true }).fill("17000");
  await page.getByLabel("Era", { exact: true }).selectOption("BCE");
  await page.getByRole("button", { name: "Go to year", exact: true }).click();
  const audit = await page.evaluate(() =>
    [...document.querySelectorAll(".cloud-core")].map((e) => ({
      title: e.parentElement.querySelector("title").textContent,
      stroke: getComputedStyle(e).stroke,
      width: getComputedStyle(e).strokeWidth,
    })),
  );
  if (!audit.some((x) => x.title.includes("Davis and Madsen")))
    throw Error("Target scenario missing");
  if ((await page.locator(".direction-symbol").count()) < 1)
    throw Error("Direction cue missing");
  await writeFile(
    "test-results/contrast-audit.json",
    JSON.stringify(audit, null, 2),
  );
  await page.screenshot({ path: "test-results/contrast-map.png", fullPage: true });
  console.log(
    "PASS: Davis and Madsen scenario rendered with visible dashed cloud core",
  );
} finally {
  await browser.close();
  server.close();
}
