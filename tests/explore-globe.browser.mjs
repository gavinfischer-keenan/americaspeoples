import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { createStaticServer } from '../scripts/static-server.mjs';

const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR || 'test-results/explore-globe';
await mkdir(SCREENSHOT_DIR, { recursive: true });

const server = createStaticServer(process.env.DIST_PATH || 'dist');
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = process.env.ATLAS_ORIGIN || `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  executablePath: process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
const http404s = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('response', (res) => {
  if (res.status() >= 400 && !res.url().endsWith('/favicon.ico')) {
    http404s.push(`${res.status()} ${res.url()}`);
  }
});

try {
  // 1. Verify desktop #explore flat mode and toggle layout
  await page.goto(origin + '/#explore');
  await page.locator('.map-canvas').waitFor();
  const toggleBtn = page.locator('[data-projection-toggle]');
  const resetBtn = page.locator('[data-zoom="reset"]');
  await toggleBtn.waitFor({ state: 'visible' });
  assert.equal(await toggleBtn.innerText(), 'Show as globe');
  assert.equal(await toggleBtn.getAttribute('aria-pressed'), 'false');
  assert.equal(await page.locator('.map-canvas').getAttribute('data-projection'), 'flat');

  const toggleBox = await toggleBtn.boundingBox();
  const resetBox = await resetBtn.boundingBox();
  const statusBox = await page.locator('.americas-map-status').boundingBox();
  assert.ok(toggleBox && resetBox, 'Toggle and Reset buttons must have bounding boxes');
  assert.ok(
    toggleBox.y >= resetBox.y + resetBox.height - 1,
    `Show as globe (${toggleBox.y}) must sit below Reset map (${resetBox.y + resetBox.height})`,
  );
  assert.ok(
    Math.abs((toggleBox.x + toggleBox.width) - (resetBox.x + resetBox.width)) <= 8,
    'Show as globe should be right-aligned under Reset map',
  );
  if (statusBox) {
    const overlaps =
      toggleBox.x < statusBox.x + statusBox.width &&
      toggleBox.x + toggleBox.width > statusBox.x &&
      toggleBox.y < statusBox.y + statusBox.height &&
      toggleBox.y + toggleBox.height > statusBox.y;
    assert.equal(overlaps, false, 'Show as globe must not overlap .americas-map-status');
  }

  // Wait for world + europe explore catalogs to load asynchronously
  await page.waitForFunction(() => {
    const t = document.querySelector('#explore-range-count')?.textContent || '';
    const m = t.match(/(\d[\d,]*)/);
    return m && Number(m[1].replaceAll(',', '')) > 5500;
  });

  await page.screenshot({ path: `${SCREENSHOT_DIR}/explore-flat.png` });

  // Verify flagship records across all 5 regions exist in built catalogues
  const worldData = JSON.parse(await readFile('dist/world-catalogue.json', 'utf8'));
  const canonData = JSON.parse(await readFile('dist/dataset.json', 'utf8'));
  const allTitles = [
    ...worldData.evidence.map((e) => e.title),
    ...canonData.records.map((r) => r.title),
  ];
  for (const needle of [
    'Zhokhov Island',
    'Button Point',
    'Qariaraqyuk',
    'Quesang',
    'Burzahom',
    'Bayanzag',
    'Khara-Khoto',
    'Sanxingdui',
    'Angkor Wat',
    'Solovetsky',
  ]) {
    assert.ok(allTitles.some((t) => t.includes(needle)), `Missing flagship title in built dist: ${needle}`);
  }

  // 2. Toggle to 3D globe mode
  await toggleBtn.click();
  await page.waitForFunction(() => document.querySelector('.map-canvas')?.getAttribute('data-projection') === 'globe');
  assert.equal(await toggleBtn.innerText(), 'Show flat map');
  assert.equal(await toggleBtn.getAttribute('aria-pressed'), 'true');
  const sphereD = await page.locator('.globe-sphere').getAttribute('d');
  assert.ok(sphereD && sphereD.length > 10, 'Globe sphere path must be populated');
  assert.equal(await page.locator('.terrain').innerHTML(), '', 'Planar terrain raster must be cleared on globe');
  const markersOnGlobe = await page.locator('.features [data-point], .features [data-overlay]').count();
  assert.ok(markersOnGlobe > 20, `Expected > 20 front-hemisphere markers on globe, got ${markersOnGlobe}`);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/explore-globe-default.png` });

  // 3. Spin globe northward/eastward via pointer drag toward Arctic / Eurasia
  const landBefore = await page.locator('.land').getAttribute('d');
  const svgBox = await page.locator('.map-canvas > svg').boundingBox();
  const cx = svgBox.x + svgBox.width / 2;
  const cy = svgBox.y + svgBox.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx - 140, cy + 160, { steps: 8 });
  await page.mouse.up();
  await page.waitForFunction(
    (prev) => {
      const next = document.querySelector('.land')?.getAttribute('d');
      return Boolean(next && next !== prev);
    },
    landBefore,
  );
  // Check zero NaN/Infinity in projected attributes
  const badAttr = await page.evaluate(() => {
    const html = document.querySelector('.map-canvas svg')?.innerHTML || '';
    return /\bNaN\b|\bInfinity\b/.test(html);
  });
  assert.equal(badAttr, false, 'Globe SVG must contain zero NaN/Infinity coordinates');
  await page.screenshot({ path: `${SCREENSHOT_DIR}/explore-globe-arctic.png` });

  // 4. Reset map keeps globe mode active and resets rotation
  await resetBtn.click();
  await page.waitForFunction(() => document.querySelector('.land')?.getAttribute('d') !== null);
  assert.equal(await page.locator('.map-canvas').getAttribute('data-projection'), 'globe');

  // 5. Toggle back to flat map
  await toggleBtn.click();
  await page.waitForFunction(() => document.querySelector('.map-canvas')?.getAttribute('data-projection') === 'flat');
  assert.equal(await toggleBtn.innerText(), 'Show as globe');
  assert.equal(await toggleBtn.getAttribute('aria-pressed'), 'false');

  // 6. Verify #movie hides the globe toggle and stays flat
  await page.getByRole('link', { name: 'Americas', exact: true }).click();
  await page.locator('.timeline').waitFor({ state: 'visible' });
  assert.equal(await toggleBtn.isVisible(), false, 'Globe toggle must be hidden outside Explore');
  assert.equal(await page.locator('.map-canvas').getAttribute('data-projection'), 'flat');

  // 7. Mobile 390x844 layout & globe view check
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(origin + '/#explore');
  await toggleBtn.waitFor({ state: 'visible' });
  const mToggle = await toggleBtn.boundingBox();
  const mReset = await resetBtn.boundingBox();
  assert.ok(mToggle.y >= mReset.y + mReset.height - 1, 'Mobile Show as globe sits below Reset map');
  assert.ok(mToggle.x + mToggle.width <= 390, 'Mobile Show as globe fits within 390px viewport');
  await toggleBtn.click();
  await page.waitForFunction(() => document.querySelector('.map-canvas')?.getAttribute('data-projection') === 'globe');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Zero horizontal overflow on mobile Explore globe');
  await page.screenshot({ path: `${SCREENSHOT_DIR}/explore-globe-mobile.png` });

  assert.deepEqual(errors, [], `Page errors detected: ${errors.join('; ')}`);
  assert.deepEqual(http404s, [], `Unexpected HTTP>=400 responses: ${http404s.join(', ')}`);
  console.log('PASS: Explore globe toggle, drag rotation, Reset map, Movie isolation, flagship sites, and mobile layout verified.');
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
