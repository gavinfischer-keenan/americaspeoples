import {chromium} from 'playwright';
import {build} from 'esbuild';
import assert from 'node:assert/strict';

const bundle=await build({entryPoints:['src/map-navigation.ts'],bundle:true,write:false,outdir:'test-results/navigation',format:'iife',globalName:'MapNavigation',loader:{'.css':'css'}});
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1200,height:800}});
 await page.setContent('<div id="nav"></div><section id="original"><label id="filter">Lineage<select><option>A</option><option>B</option></select><button data-map-menu-choice>Focus view</button><a href="#africa">Africa</a></label><section id="facts">Selected place and visible evidence</section></section>');
 await page.addStyleTag({content:bundle.outputFiles.find(f=>f.path.endsWith('.css')).text});
 await page.addScriptTag({content:bundle.outputFiles.find(f=>f.path.endsWith('.js')).text});
 await page.evaluate(()=>window.navigationMount=MapNavigation.mountMapNavigation(document.querySelector('#nav'),{region:'europe',settings:[document.querySelector('#filter')],facts:[document.querySelector('#facts')]}));
 await page.evaluate(()=>{
  const closed=()=>document.querySelector('.map-navigation-settings').hidden;
  document.querySelector('#filter select').addEventListener('change',()=>window.closedBeforeFilter=closed());
  document.querySelector('[data-map-menu-choice]').addEventListener('click',()=>window.closedBeforeFocus=closed());
 });
 const settings=page.getByRole('button',{name:'Map settings',exact:true}),facts=page.getByRole('button',{name:'Facts',exact:true});
 assert.equal(await page.locator('#filter').isVisible(),false);
 await settings.click();await page.locator('#filter select').selectOption('B');
 assert.equal(await settings.getAttribute('aria-expanded'),'false','choosing a filter retracts settings');
 assert.equal(await page.evaluate(()=>window.closedBeforeFilter),true,'filter handlers measure the map after settings retract');
 assert.equal(await page.locator('#filter select').inputValue(),'B','moving settings preserves control state');
 await settings.click();await page.locator('#filter select').focus();await page.keyboard.press('Escape');
 assert.equal(await settings.evaluate(el=>el===document.activeElement),true,'Escape returns focus to settings');
 await settings.click();await page.getByRole('button',{name:'Focus view',exact:true}).focus();await page.keyboard.press('Enter');
 assert.equal(await settings.evaluate(el=>el===document.activeElement),true,'button choice returns focus to settings');
 assert.equal(await page.evaluate(()=>window.closedBeforeFocus),true,'camera actions measure the map after settings retract');
 await facts.click();assert.equal(await page.locator('#facts').isVisible(),false);
 // Region switching moved to the page's Main navigation (a059bc9); the shared
 // toolbar no longer renders a region menu, so menu-closing is checked on settings.
 assert.equal(await page.getByRole('button',{name:/^Region:/}).count(),0,'no region menu in the shared toolbar');
 await settings.click();assert.equal(await page.getByRole('link',{name:'Africa',exact:true}).isVisible(),true);
 await page.evaluate(()=>window.navigationMount.showFacts());
 assert.equal(await page.locator('#facts').isVisible(),true);assert.equal(await settings.getAttribute('aria-expanded'),'false','showFacts retracts settings');
 await settings.click();await page.getByRole('link',{name:'Africa',exact:true}).click();
 assert.equal(await settings.getAttribute('aria-expanded'),'false','link selection retracts menu');
 await settings.click();
 const menu=await page.locator('.map-navigation-settings').boundingBox(),factsBox=await page.locator('#facts').boundingBox();
 assert.ok(menu.y+menu.height<=factsBox.y,'settings stays in document flow ahead of facts');
 await page.setViewportSize({width:390,height:844});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'navigation fits a narrow viewport');
 await page.evaluate(()=>window.navigationMount.dispose());
 assert.equal(await page.locator('#original > #filter').count(),1,'dispose restores owned settings');
 assert.equal(await page.locator('#nav').innerHTML(),'');
 console.log('PASS: shared map navigation disclosure, selection, focus, responsive flow and cleanup.');
}finally{await browser.close();}
