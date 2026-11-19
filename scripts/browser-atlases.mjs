// Release gate: node scripts/browser-atlases.mjs (uses dist and the real release API).
// Before an integrated build, ATLAS_BROWSER_SOURCE=1 bundles only the frontend in memory.
import assert from 'node:assert/strict';
import { browserFixture } from './browser-fixture.mjs';

const fixture = await browserFixture();
const { page, context } = fixture;
try {
  if (process.env.ATLAS_BROWSER_SOURCE === '1') {
    const { build } = await import('esbuild');
    const bundle = await build({ entryPoints: ['src/bootstrap.ts'], bundle: true, format: 'iife', platform: 'browser', target: ['chrome110'], outfile: 'app.js', loader: { '.geojson': 'json' }, write: false });
    for (const [extension, contentType] of [['js', 'text/javascript'], ['css', 'text/css']]) {
      const body = Buffer.from(bundle.outputFiles.find(file => file.path.endsWith('.' + extension)).contents);
      await context.route(`**/app.${extension}*`, route => route.fulfill({ contentType, body }));
    }
  }

  // Start in Explore to avoid the first-visit movie autoplay, then set a date via the UI.
  await page.goto(fixture.url + '#explore');
  await page.waitForSelector('#map-host .world');
  await page.locator('nav[aria-label="Main navigation"] a[href="#movie"]').click();
  await page.locator('#time-settings-toggle').click();
  await page.locator('#year-number').fill('1860');
  await page.locator('#era').selectOption('CE');
  await page.locator('#year-form button').click();
  await page.locator('nav[aria-label="Main navigation"] a[href="#explore"]').click();
  await page.locator('#toggle-layers').click();
  const filter = page.locator('[data-history-layer]').first();
  const filterId = await filter.getAttribute('data-history-layer');
  await filter.uncheck();
  await page.locator('#close-layers').click();
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await page.locator('.site-choice').first().click();
  await page.waitForSelector('.selected-detail h4', { state: 'attached' });
  const selectedTitle = await page.locator('.selected-detail h4').first().textContent();
  const before = await page.evaluate(() => {
    window.__atlasTestWorld = document.querySelector('#map-host .world');
    return { date: document.querySelector('#current-year').textContent, transform: window.__atlasTestWorld.getAttribute('transform') };
  });
  const catalogRequests = () => fixture.requests.filter(request => new URL(request.url).pathname === '/api/catalog').length;
  const catalogsBefore = catalogRequests();
  const destinations = [['africa', 'Africa & human origins'], ['europe', 'Europe & Mediterranean'], ['asia-pacific', 'Asia & Pacific']];
  for (const [id, title] of destinations) {
    await page.locator('.atlas-switcher > summary').focus();
    await page.keyboard.press('Enter');
    await page.locator(`#atlas-destinations a[href="#atlas/${id}"]`).click();
    await page.waitForFunction(expected => document.querySelector('#atlas-preview-title')?.textContent === expected, title);
    assert.equal(await page.locator('#atlas-preview-title').textContent(), title);
    assert.equal(await page.locator('#main svg path').count(), 2, 'Only ocean and coastline paths belong in a future map');
    assert.equal(await page.locator('#main .features, #main [data-record], #main [data-voyage], #main circle, #main image').count(), 0);
    assert.equal(await page.locator('.timeline').isVisible(), false);
    assert.equal(await page.locator('.atlas-coming-soon').textContent(), 'COMING SOON');
    assert.equal(await page.locator('.atlas-switcher').getAttribute('open'), null);
    assert.equal(await page.locator(`#atlas-destinations a[href="#atlas/${id}"]`).getAttribute('aria-current'), 'page');
  }
  assert.equal(catalogRequests(), catalogsBefore, 'Switching future atlases must not fetch additional evidence catalogs');

  await page.getByRole('link', { name: 'Return to Americas' }).click();
  await page.waitForSelector('#map-host .world');
  const after = await page.evaluate(() => ({
    date: document.querySelector('#current-year').textContent,
    transform: document.querySelector('#map-host .world').getAttribute('transform'),
    sameElement: window.__atlasTestWorld === document.querySelector('#map-host .world'),
  }));
  assert.equal(new URL(page.url()).hash, '#explore');
  assert.deepEqual({ date: after.date, transform: after.transform }, before);
  assert.equal(after.sameElement, true, 'The Americas map instance must survive the round trip');
  assert.equal(await page.locator(`[data-history-layer="${filterId}"]`).isChecked(), false);
  assert.equal(await page.locator('.selected-detail h4').first().textContent(), selectedTitle);

  // Check direct destinations, reloads, and the navigation geometry on narrow screens.
  for (const [index, width] of [320, 390, 760, 800].entries()) {
    await page.setViewportSize({ width, height: 844 });
    const [id, title] = destinations[index % destinations.length];
    await page.goto(fixture.url + '#atlas/' + id);
    await page.reload();
    await page.waitForSelector('#atlas-preview-title');
    assert.equal(await page.locator('#atlas-preview-title').textContent(), title);
    await page.locator('.atlas-switcher > summary').click();
    const layout = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, menu: document.querySelector('.atlas-destinations').getBoundingClientRect().toJSON() }));
    assert.ok(layout.scroll <= layout.width, JSON.stringify(layout));
    assert.ok(layout.menu.x >= 0 && layout.menu.right <= layout.width, JSON.stringify(layout));
    await page.locator('#atlas-destinations a[href="#movie"]').click();
    await page.waitForSelector('#map-host .world');
    assert.equal(new URL(page.url()).hash, '#movie');
  }
  fixture.assertPrivacy();
  console.log(`Atlas navigation passed (${process.env.ATLAS_BROWSER_SOURCE === '1' ? 'frontend bundled in memory' : 'built release'}): three empty previews; date, camera, selection and filter retained; keyboard menu; direct routes; widths 320–800px.`);
} finally {
  await fixture.close();
}
