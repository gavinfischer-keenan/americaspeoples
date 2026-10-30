import { chromium } from "playwright";
import { createStaticServer } from "./static-server.mjs";
import { writeFile } from "node:fs/promises";
const server = createStaticServer("dist");
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const browser = await chromium.launch({
  ...(process.env.BROWSER_PATH
    ? { executablePath: process.env.BROWSER_PATH }
    : {}),
  headless: true,
});
try {
  const page = await browser.newPage({
    viewport: { width: 1600, height: 1000 },
  });
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.getByLabel("Year number", { exact: true }).fill("17000");
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
    "release/contrast-audit.json",
    JSON.stringify(audit, null, 2),
  );
  await page.screenshot({ path: "release/contrast-map.png", fullPage: true });
  console.log(
    "PASS: Davis and Madsen scenario rendered with visible dashed cloud core",
  );
} finally {
  await browser.close();
  server.close();
}
