// Run from the repository root. A failure stops publication checks immediately.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { chromium } from "playwright";

const require = createRequire(import.meta.url);
const node = process.execPath;
const phases = [
  [
    "Unit tests",
    node,
    [
      "--import",
      "tsx",
      "--test",
      ...readdirSync("tests")
        .filter((name) => name.endsWith(".test.ts"))
        .sort()
        .map((name) => "tests/" + name),
    ],
  ],
  [
    "TypeScript contracts",
    node,
    [require.resolve("typescript/bin/tsc"), "--noEmit"],
  ],
  [
    "Published evidence validation",
    node,
    ["--import", "tsx", "scripts/validate.ts"],
  ],
  [
    "Production build and self-host package",
    node,
    ["--import", "tsx", "scripts/build.ts"],
  ],
  ["Python API integration", null, ["server/test_api.py"]],
  [
    "Hosted privacy, CSP and full snapshot",
    node,
    ["scripts/hosted-browser.mjs"],
  ],
  ["Extracted self-host package", null, ["scripts/selfhost-smoke.py"]],
  [
    "Spreadsheet import, editing and sharing",
    node,
    ["scripts/bulk-browser.mjs"],
  ],
  [
    "Layout, chronology and draft regressions",
    node,
    ["scripts/regression-browser.mjs"],
  ],
  [
    "Complete researched workbook and reviews",
    node,
    ["scripts/research-browser.mjs"],
  ],
  [
    "Overlay selection, filters and persistence",
    node,
    ["scripts/overlay-browser.mjs"],
  ],
  [
    "Map panels, viewport and mobile layout",
    node,
    ["tests/map-panels.browser.mjs"],
  ],
  ["Smart timeline and keyboard control", node, ["tests/timeline.browser.mjs"]],
  ["Physical layers and source reviews", node, ["tests/physical.browser.mjs"]],
  [
    "Map rendering and interaction contracts",
    node,
    ["tests/map-rendering.browser.mjs"],
  ],
  ["Map contrast and direction cues", node, ["scripts/contrast-browser.mjs"]],
  [
    "Keyed panel focus and DOM identity",
    node,
    ["tests/map-panel-controller.browser.mjs"],
  ],
  [
    "Network failure, queue and search resilience",
    node,
    ["tests/hybrid-resilience.browser.mjs"],
  ],
];
if (process.argv.includes("--list")) {
  for (const [index, [label]] of phases.entries())
    console.log(`${index + 1}. ${label}`);
} else {
  const pythonCandidates = process.env.PYTHON_PATH
    ? [process.env.PYTHON_PATH]
    : ["python", "python3"];
  const python = pythonCandidates.find(
    (command) =>
      spawnSync(command, ["--version"], { windowsHide: true, stdio: "ignore" })
        .status === 0,
  );
  if (!python)
    throw Error(
      "Python was not found. Set PYTHON_PATH to a Python 3.11+ executable.",
    );
  const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
  const browserPath =
    process.env.BROWSER_PATH ||
    (existsSync(edge) ? edge : chromium.executablePath());
  if (!existsSync(browserPath))
    throw Error(
      "No browser executable found. Set BROWSER_PATH or run npx playwright install chromium.",
    );
  const env = {
    ...process.env,
    PYTHON_PATH: python,
    BROWSER_PATH: browserPath,
  };
  for (const [index, [label, command, args]] of phases.entries()) {
    console.log(`\n[${index + 1}/${phases.length}] ${label}`);
    const result = spawnSync(command || python, args, {
      env,
      stdio: "inherit",
      windowsHide: true,
    });
    if (result.error || result.status !== 0) {
      console.error(
        `FAILED: ${label}${result.error ? ": " + result.error.message : ""}`,
      );
      process.exit(result.status || 1);
    }
    console.log(`PASS: ${label}`);
  }
  console.log(
    "\nRelease verification passed. No publication or deployment was performed.",
  );
}
