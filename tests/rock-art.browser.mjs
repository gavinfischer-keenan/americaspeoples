import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { browserFixture, mapSetting } from '../scripts/browser-fixture.mjs';

const fixture = await browserFixture();
const { page } = fixture;
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const mediaManifest = JSON.parse(await readFile('data/world-guide-media.json', 'utf8')).assets;
await mkdir('test-results', { recursive: true });

try {
  // 1. Check In Toto gallery, North America gallery, and Africa/Middle East gallery across desktop & phone
  for (const guideId of [
    'world-rock-art-in-toto',
    'world-north-america-rock-art',
    'world-africa-middle-east-art-habitations',
  ]) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${fixture.url}sites/${guideId}.html`);
    await page.locator('#rock-art-gallery').waitFor();

    // Standardized 10-item topbar navigation
    assert.equal(await page.locator('header.topbar nav[aria-label="Main navigation"] a').count(), 10, `${guideId}: 10-item topbar`);

    // Interactive map + relief terrain present without competing native hover tooltips
    assert.ok(await page.locator('.world-findings li').count() >= 18, `${guideId}: findings count`);
    assert.equal(await page.locator('.world-map svg title').count(), 0, `${guideId}: no SVG title tooltip`);
    assert.equal(await page.locator(`a[href="../guide-terrain/${guideId}.webp"]`).count(), 1, `${guideId}: relief link`);

    // Scroll images into view so lazy images load and verify exact decoded dimensions
    const imgs = page.locator('#rock-art-gallery img');
    const imgCount = await imgs.count();
    assert.ok(imgCount >= 16, `${guideId}: gallery images (${imgCount})`);
    for (const img of await imgs.all()) {
      await img.scrollIntoViewIfNeeded();
      await img.evaluate(el => el.decode());
      const src = await img.getAttribute('src');
      const asset = mediaManifest.find(a => `media/${a.file}` === src);
      assert.ok(asset, `${guideId}: asset found for ${src}`);
      const dims = await img.evaluate(el => [el.naturalWidth, el.naturalHeight]);
      assert.deepEqual(dims, [asset.width, asset.height], `${guideId}: naturalWidth/Height for ${src}`);
      assert.ok((await img.getAttribute('alt'))?.length > 20, `${guideId}: descriptive alt text on ${src}`);
    }

    // Check desktop & mobile overflow + capture screenshots
    for (const [width, height] of [[1440, 900], [390, 844]]) {
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(100);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${guideId} fits ${width}px`);
      if (guideId === 'world-rock-art-in-toto' || width === 1440) {
        await page.screenshot({ path: `test-results/${guideId}-${width}.png`, fullPage: false });
      }
    }
    if (guideId === 'world-rock-art-in-toto') {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.locator('#rock-art-gallery').scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);
      await page.screenshot({ path: 'test-results/world-rock-art-gallery-1440.png' });
    }
  }

  // 2. Test interactive filters on In Toto gallery
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${fixture.url}sites/world-rock-art-in-toto.html#rock-art-gallery`);
  const totalCards = await page.locator('.rock-art-card').count();
  assert.ok(totalCards >= 48, `In Toto gallery count = ${totalCards}`);

  await page.locator('#rock-art-scale').selectOption('desert-overhang');
  const overhangShown = await page.locator('.rock-art-card:visible').count();
  assert.ok(overhangShown >= 15 && overhangShown < totalCards, `Desert overhang filter count = ${overhangShown}`);

  await page.locator('#rock-art-search').fill('Nevada');
  const nevadaShown = await page.locator('.rock-art-card:visible').count();
  assert.ok(nevadaShown >= 2 && nevadaShown <= 10, `Nevada overhang filter count = ${nevadaShown}`);

  await page.locator('#rock-art-reset').click();
  assert.equal(await page.locator('.rock-art-card:visible').count(), totalCards, 'Reset restores all cards');

  // 3. Test #explore?category=rock-art&q=Winnemucca deep link AND interactive category switching
  await page.goto(`${fixture.url}#explore?category=rock-art&q=Winnemucca`);
  await page.locator('body.exploring #map-host .world').waitFor();
  await page.waitForFunction(() => document.querySelector('#explore-category')?.value === 'rock-art');
  await page.waitForFunction(() => document.querySelector('#place-search')?.value === 'Winnemucca');
  await page.waitForFunction(() => (document.querySelector('#visible-records')?.textContent || '').includes('Winnemucca'));

  // Clear search via Map settings popover while staying on rock-art category and capture #explore screenshot
  await mapSetting(page, () => page.locator('#place-search').fill(''));
  await page.waitForFunction(() => {
    const cnt = Number((document.querySelector('#visible-count')?.textContent || '').replace(/[^0-9]/g, ''));
    return cnt >= 50;
  }, { timeout: 15000 });
  await page.screenshot({ path: 'test-results/explore-rock-art-1440.png' });

  // Mobile #explore + #dives check
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${fixture.url}#dives`);
  await page.locator('.dive-foundation-card').first().waitFor();
  assert.equal(await page.locator('.dive-foundation-card').count(), 4);
  assert.equal(await page.locator('.dive-category').count(), 5);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '#dives fits 390px');
  await page.screenshot({ path: 'test-results/dives-foundations-390.png' });

  assert.deepEqual(errors, [], `Page errors: ${errors.join('; ')}`);
  console.log('PASS rock-art In Toto gallery, NA & Africa/ME guides, Explore rock-art category, deep links, and mobile layouts.');
} finally {
  await fixture.close();
}
