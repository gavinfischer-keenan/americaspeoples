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
  assert.equal(await page.locator('#toggle-layers').getAttribute('aria-expanded'),'false');
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
  const destinations = [['africa', 'Africa & Middle East'], ['europe', 'Europe & Mediterranean'], ['asia-pacific', 'Asia'], ['pacific', 'Australia & Pacific']];
  assert.ok(!fixture.requests.some(r => r.url.endsWith('/europe-catalogue.json')), 'Americas must not fetch the Europe catalogue');
  for (const [id, title] of destinations) {
    const regionMenu=page.locator('.map-navigation').getByRole('button',{name:/^Region:/});
    await regionMenu.focus();
    await page.keyboard.press('Enter');
    await page.locator(`.map-navigation-regions a[href="#atlas/${id}"]`).click();
    if (id === 'europe') {
      await page.locator('#europe-map .world').waitFor();
      assert.equal(await page.locator('#europe-date').isVisible(), true);
      assert.ok(await page.locator('#europe-region option').count() > 1);
      assert.equal(await page.locator('.atlas-coming-soon').count(), 0);
      assert.equal(await page.locator('.timeline').isVisible(), false);
    } else if (id === 'pacific') {
      await page.locator('#map-host .world').waitFor();
      assert.equal(await page.getByLabel('Map region',{exact:true}).inputValue(),'pacific');
      assert.equal(await page.locator('.atlas-coming-soon').count(), 0);
      assert.equal(await page.locator('.timeline').isVisible(), true);
    } else {
      await page.locator('#family-map .family-land').waitFor();
      assert.ok(await page.locator('#family-taxon option').count() > 1);
      assert.equal(await page.locator('.atlas-coming-soon').count(), 0);
      assert.equal(await page.locator('.timeline').isVisible(), false);
    }
    assert.equal(await page.locator('.map-navigation').getByRole('button',{name:/^Region:/}).getAttribute('aria-expanded'),'false');
    assert.equal(await page.locator(`.map-navigation-regions a[href="#atlas/${id}"]`).getAttribute('aria-current'),'page');
  }
  assert.equal(catalogRequests(), catalogsBefore, 'Switching regional atlases must not fetch the Americas catalogue twice');

  await page.locator('nav[aria-label="Main navigation"] a[href="#explore"]').click();
  await page.waitForSelector('#map-host .world');
  const after = await page.evaluate(() => ({
    date: document.querySelector('#current-year').textContent,
    transform: document.querySelector('#map-host .world').getAttribute('transform'),
    sameElement: window.__atlasTestWorld === document.querySelector('#map-host .world'),
  }));
  assert.equal(new URL(page.url()).hash, '#explore');
  assert.equal(after.date, before.date);
  const transformNumbers = s => (s.match(/-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/ig) || []).map(Number);
  const bNums = transformNumbers(before.transform), aNums = transformNumbers(after.transform);
  assert.equal(aNums.length, bNums.length);
  assert.ok(aNums.every((n, i) => Math.abs(n - bNums[i]) < 0.05), `Transform mismatch: ${before.transform} vs ${after.transform}`);
  assert.equal(after.sameElement, true, 'The Americas map instance must survive the round trip');
  assert.equal(await page.locator(`[data-history-layer="${filterId}"]`).isChecked(), false);
  assert.equal(await page.locator('.selected-detail h4').first().textContent(), selectedTitle);

  // Check direct destinations, reloads, and the navigation geometry on narrow screens.
  for (const [index, width] of [320, 390, 760, 800].entries()) {
    await page.setViewportSize({ width, height: 844 });
    const [id, title] = destinations[index % destinations.length];
    await page.goto(fixture.url + '#atlas/' + id);
    await page.reload();
    if (id === 'europe') await page.locator('#europe-map .world').waitFor();
    else if (id === 'pacific') await page.locator('#map-host .world').waitFor();
    else await page.locator('#family-map .family-land').waitFor();
    const layout = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
    assert.ok(layout.scroll <= layout.width, JSON.stringify(layout));
    await page.locator('.map-navigation').getByRole('button',{name:/^Region:/}).click();
    await page.locator('.map-navigation-regions a[href="#movie"]').click();
    await page.waitForSelector('#map-host .world');
    assert.equal(new URL(page.url()).hash, '#movie');
  }
  fixture.assertPrivacy();
  console.log(`Atlas navigation passed (${process.env.ATLAS_BROWSER_SOURCE === '1' ? 'frontend bundled in memory' : 'built release'}): active Europe and two human-family regional maps; date, camera, selection and filter retained; keyboard menu; direct routes; widths 320–800px.`);
} finally {
  await fixture.close();
}
