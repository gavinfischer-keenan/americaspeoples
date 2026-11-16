import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {unzipSync,strFromU8} from 'fflate';
import {version} from '../package.json';
test('the community topic coverage link opens a packaged source guide',async()=>{
 const files=unzipSync(await readFile(`release/americas-peoples-v${version}-selfhost.zip`));
 const guide=files['americas-peoples/web/docs/community-topic-dives.html'];
 assert.ok(guide,'community-topic-dives.html must ship with the topic index link');
 assert.ok(files['americas-peoples/web/docs/community-topic-dives.md']);
 for(const name of ['Haudenosaunee','Amazonian','Caribbean','1,862','31'])assert.ok(strFromU8(guide).includes(name),name);
});
test('the self-host release contains the linked history explanation as readable HTML',async()=>{
 const files=unzipSync(await readFile(`release/americas-peoples-v${version}-selfhost.zip`));
 assert.ok(files['americas-peoples/server/release_retention.py'],'safe rolling retention must ship with the server');
 const guide=files['americas-peoples/web/docs/history-update.html'];
 assert.ok(guide,'history-update.html must ship with the link in the app');
 assert.match(strFromU8(guide),/History atlas/);
 assert.match(strFromU8(guide),/territorial boundaries/);
});
test('the interface guide ships with its public About link',async()=>{
 const files=unzipSync(await readFile(`release/americas-peoples-v${version}-selfhost.zip`));
 const guide=files['americas-peoples/web/docs/ui-redesign.html'];
 assert.ok(guide,'ui-redesign.html must ship with the app');
 assert.ok(files['americas-peoples/web/docs/ui-redesign.md']);
 assert.match(strFromU8(guide),/Watch and Explore/);
 assert.match(strFromU8(guide),/Conflict coverage is incomplete/);
});
