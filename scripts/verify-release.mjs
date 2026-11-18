// Run from the repository root. A failure stops publication checks immediately.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { chromium } from "playwright";

const require = createRequire(import.meta.url);
const node = process.execPath;
const phases = [
  ["Canonical regional coverage audit", null, ["scripts/coverage-audit.py"]],
  ["Ten sparse regions coverage and source report", node, ["--import", "tsx", "scripts/sparse-ten-audit.ts"]],
  ["Current broad coverage report", node, ["--import", "tsx", "scripts/world-coverage-audit.ts"]],
  ["Eastern Brazil coverage and source report", node, ["--import", "tsx", "scripts/eastern-brazil-audit.ts"]],
  ["Trade activity-window audit", node, ["--import", "tsx", "scripts/trade-coverage-audit.ts"]],
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
  ["Packaged history documentation", node, ["--import", "tsx", "--test", "tests/history-release.artifact.ts"]],
  ["Python API integration and release retention", null, ["-m", "unittest", "discover", "-s", "server", "-p", "test_*.py"]],
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
  ["Exact event navigation", node, ["tests/evidence-date.browser.mjs"]],
  ["Physical layers and source reviews", node, ["tests/physical.browser.mjs"]],
  ["Site and culture guides, road maps and natural events", node, ["tests/site-guides.browser.mjs"]],
  ["Dated geography, journeys, local selection and mobile", node, ["tests/expansion.browser.mjs"]],
  ["Guided stories, discovery and responsive UI", node, ["tests/watch-explore.browser.mjs"]],
  ["Shared world movie, scoped expeditions and local terrain", node, ["tests/shared-movie.browser.mjs"]],
  ["Independent topic movies, geography and state restoration", node, ["--test", "tests/topic-dives.browser.mjs", "tests/topic-regressions.browser.mjs", "tests/topic-geography.browser.mjs", "tests/topic-review-fixes.browser.mjs"]],
  ["Community topics, queue promotion and tablet navigation", node, ["--import", "tsx", "tests/community-topics.browser.mjs"]],
  ["Land and sovereignty topics, later-date isolation and tablet navigation", node, ["--import", "tsx", "tests/sovereignty-topics.browser.mjs"]],
  ["Complete topic queue, current chapter evidence and packaged gap guides", node, ["--import", "tsx", "tests/remaining-topics.browser.mjs"]],
  ["Categorized deep dives, existing content and legacy navigation", node, ["tests/deep-dives.browser.mjs"]],
  ["Early continuity, contextual place movies and guide navigation", node, ["--import", "tsx", "tests/early-continuity.browser.mjs"]],
  ["First thirteen dedicated studies, language families and tablet playback", node, ["--import", "tsx", "tests/coming-soon-a.browser.mjs"]],
  ["Final twelve dedicated studies, shared evidence and completed lists", node, ["--import", "tsx", "tests/coming-soon-b.browser.mjs"]],
  ["Expanded archaeological guides, regional hierarchy and shared local timelines", node, ["--import", "tsx", "tests/six-guides.browser.mjs"]],
  ["Collapsible story panels and labeled site terrain maps", node, ["tests/atlas-usability.browser.mjs"]],
  ["Regional coverage, whole-area map controls and simultaneous polar expeditions", node, ["tests/coverage-expeditions.browser.mjs"]],
  ["Readable map evidence, named places and expandable uncertainty", node, ["tests/reader-evidence.browser.mjs"]],
  ["One marker per exact place and attached evidence status", node, ["tests/map-marker-audit.browser.mjs"]],
  ["Island histories, rai topic and licensed source navigation", node, ["--import", "tsx", "tests/island-chain.browser.mjs"]],
  ["Guide narratives, licensed photographs and source register", node, ["--import", "tsx", "tests/guide-enrichment.browser.mjs", "--generated"]],
  ["Canadian and Aleutian contextual histories, illustrated guides and reciprocal links", node, ["--import", "tsx", "tests/canada-aleutians.browser.mjs"]],
  ["Shield continuity, local Aleutian histories and licensed village plans", node, ["--import", "tsx", "tests/shield-aleutian-local.browser.mjs"]],
  ["Three regional histories, master-map chapters and tablet guides", node, ["tests/three-regional-gaps.browser.mjs"]],
  ["Eastern Brazil dates, exchanges and illustrated guide", node, ["tests/eastern-brazil.browser.mjs"]],
  ["Expanded exchange chapters and shared-map trade connections", node, ["tests/trade-coverage.browser.mjs"]],
  ["Regional evidence in the shared movie and packaged source guide", node, ["tests/regional-gaps.browser.mjs"]],
  ["Interior communities, dated connections and conflict windows", node, ["tests/interior-frontiers.browser.mjs"]],
  ["Map picking, camera, touch and label usability", node, ["tests/map-ux.browser.mjs"]],
  ["Movie and Explore separation", node, ["tests/movie-explore.browser.mjs"]],
  ["Map playback interaction and hover", node, ["tests/map-interaction.browser.mjs"]],
  [
    "Map rendering and interaction contracts",
    node,
    ["tests/map-rendering.browser.mjs"],
  ],
  ["Scale, crowding and playback contrast", node, ["tests/map-density.browser.mjs"]],
  ["Ten sparse regions on the shared master map", node, ["tests/sparse-ten.browser.mjs"]],
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
