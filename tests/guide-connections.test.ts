import test from 'node:test';
import assert from 'node:assert/strict';

test('related guide cards resolve actual guides and movies, with readable reasons and safe links', async () => {
  const module = await import('../scripts/guide-connections').catch(() => null);
  assert.ok(module, 'Related guides need a common link renderer');
  const guides=[{id:'coast',title:'Coastal communities',href:'sites/coast.html',description:'Fishing and trade',relatedGuideIds:['islands']},{id:'islands',title:'Islands & boats',href:'sites/islands.html',description:'Island histories'}];
  const topics=[{id:'fur-trade',title:'Fur & labour'}];
  const connections={coast:[{kind:'guide' as const,id:'islands',reason:'Boats connected <neighbours>.'},{kind:'topic' as const,id:'fur-trade',reason:'Trade changed work and settlement.'}]};
  const html=module.guideConnectionsHTML('coast',guides,topics,connections);
  assert.match(html,/href="islands.html"/);
  assert.match(html,/href="\.\.\/#topic\/fur-trade"/);
  assert.match(html,/Boats connected &lt;neighbours&gt;/);
  assert.match(html,/Islands &amp; boats/);
  assert.match(html,/Follow the connections/);
  assert.equal((html.match(/href="islands.html"/g)??[]).length,1);
  assert.throws(()=>module.guideConnectionsHTML('coast',guides,topics,{coast:[{kind:'guide',id:'missing',reason:'Bad target'}]}),/Unknown connected guide/);
});

test('existing related guides retain useful descriptions and topic links lead back to their guides',async()=>{
  const module=await import('../scripts/guide-connections').catch(()=>null);
  const shared=await import('../src/guide-connections').catch(()=>null);
  assert.ok(module && shared);
  const guides=[{id:'coast',title:'Coast',href:'sites/coast.html',description:'Coast',relatedGuideIds:['islands']},{id:'islands',title:'Islands',href:'sites/islands.html',description:'People crossed between these islands.'}];
  assert.match(module.guideConnectionsHTML('coast',guides,[],{}),/People crossed between these islands/);
  assert.deepEqual(shared.guidesLinkedToTopic('fur',{coast:[{kind:'topic',id:'fur',reason:'Coastal labour and trade.'},{kind:'guide',id:'islands',reason:'Island link.'}]}),[['coast','Coastal labour and trade.']]);
  assert.equal(module.guideConnectionsHTML('islands',guides,[],{}),'');
});
