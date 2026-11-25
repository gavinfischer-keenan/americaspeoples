import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { createStaticServer } from '../scripts/static-server.mjs';

const server = createStaticServer('dist');
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_PATH ||
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  args: ['--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader'],
});

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  await context.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) =>
      console.error('CSP:' + e.violatedDirective),
    );
  });

  const page = await context.newPage();
  const errors = [];
  const cspViolations = [];
  const glbRequests = [];

  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.text().startsWith('CSP:')) cspViolations.push(m.text());
  });
  page.on('request', (req) => {
    if (req.url().endsWith('.glb')) glbRequests.push(req.url());
  });

  // 1. Start in the atlas at Hovenweep story, advance to the 1277 CE timber scene, select Hovenweep Castle, and follow link to building deep dive.
  await page.goto(origin + '/#story/hovenweep');
  await page.locator('#story-select').waitFor({ state: 'attached' });
  for (let step = 0; step < 8; step++) {
    if (await page.locator('#concurrent-context [data-local-record="g20-hove-castle-1277-beam"]').isVisible()) break;
    await page.getByRole('button', { name: 'Next scene', exact: true }).click();
  }
  const castlePhase = page.locator('#concurrent-context [data-local-record="g20-hove-castle-1277-beam"]');
  await castlePhase.waitFor();
  await castlePhase.click();
  await page.locator('#selected-records').waitFor();
  const initialYear = await page.locator('#year-number').inputValue();
  assert.equal(initialYear, '1277');

  const deepDiveLink = page.locator('#selected-records a[href="sites/hovenweep-castle.html"]');
  await deepDiveLink.waitFor();
  await deepDiveLink.click();
  await page.waitForURL(/\/sites\/hovenweep-castle\.html$/);

  // 2. Verify initial state: HTTP 200 content, zero .glb fetches on page load, HABS fallback + plan + provenance visible.
  await page.locator('h1').waitFor();
  assert.match(await page.locator('h1').innerText(), /Hovenweep Castle/);
  assert.equal(glbRequests.length, 0, '3D model must NOT download before user requests it');
  assert.match(await page.locator('.site-3d-badge').innerText(), /Observed survey/i);
  assert.match(await page.locator('.site-3d-provenance').innerText(), /U\.S\. Geological Survey/);
  assert.match(await page.locator('.site-3d-provenance').innerText(), /2020/);

  await page.waitForFunction(() => {
    const img = document.querySelector('.site-3d-fallback img');
    return Boolean(img && img.complete && img.naturalWidth > 0);
  });
  await page.locator('#village-plans img').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => {
    const img = document.querySelector('#village-plans img');
    return Boolean(img && img.complete && img.naturalWidth > 0);
  });

  // 3. Click Load interactive 3D model -> verify exactly one .glb fetch with model/gltf-binary MIME type.
  const loadBtn = page.locator('[data-load-3d]');
  const [glbRes] = await Promise.all([
    page.waitForResponse((res) => res.url().endsWith('.glb')),
    loadBtn.click(),
  ]);
  assert.equal(glbRes.status(), 200);
  assert.match(glbRes.headers()['content-type'] || '', /model\/gltf-binary/);
  assert.equal(glbRequests.length, 1);

  await page.waitForFunction(() => {
    const st = document.querySelector('[data-3d-status]')?.textContent || '';
    return /Loaded |Could not load interactive 3D view/.test(st);
  });
  const statusText = await page.locator('[data-3d-status]').innerText();
  if (statusText.startsWith('Loaded ')) {
    assert.equal(await page.locator('[data-3d-stage]').isVisible(), true);
    assert.ok((await page.locator('.site-3d-pin').count()) >= 7);
    await page.locator('[data-unload-3d]').click();
    assert.equal(await page.locator('[data-3d-fallback]').isVisible(), true);
  }

  // 4. Verify error/fallback path when GLB endpoint fails (HTTP 500).
  await page.route('**/*.glb', (route) => route.fulfill({ status: 500, body: 'Server error' }));
  await page.locator('[data-load-3d]').click();
  await page.waitForFunction(() =>
    /Could not load interactive 3D view/.test(
      document.querySelector('[data-3d-status]')?.textContent || '',
    ),
  );
  assert.equal(await page.locator('[data-3d-fallback]').isVisible(), true);
  assert.match(await page.locator('[data-load-3d]').innerText(), /Retry 3D model/);
  await page.unroute('**/*.glb');

  // 5. Return to the atlas and verify exact context restoration (year 1277 + selected record).
  const returnLink = page.locator('[data-atlas-return]').first();
  await returnLink.click();
  await page.waitForURL(/#movie$/);
  await page.locator('#selected-records').waitFor();
  assert.equal(await page.locator('#year-number').inputValue(), '1277');
  assert.match(await page.locator('#selected-records').innerText(), /Hovenweep Castle/);

  // 6. Verify attributions page includes USGS 3DEP and Library of Congress HABS.
  await page.goto(origin + '/sites/sources-attributions.html');
  await page.getByLabel('Search sources, creators, licenses or places').fill('3DEP');
  assert.ok((await page.locator('[data-source-row]:visible').count()) >= 1);
  await page.getByLabel('Search sources, creators, licenses or places').fill('HABS');
  assert.ok((await page.locator('[data-source-row]:visible').count()) >= 1);

  assert.deepEqual(cspViolations, []);
  assert.deepEqual(errors, []);
  console.log('PASS: Hovenweep 3D deep dive (lazy GLB fetch, MIME, fallback/error UI, atlas context return, CSP, attributions)');
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
