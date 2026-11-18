import {writeFileSync,mkdirSync} from 'node:fs';
import {dataset} from '../src/published-data';
import {siteGuides} from '../src/site-guides';
import {createGuideMaps} from '../src/site-overview-map';

const requests=siteGuides.filter(g=>g.kind!=='culture').flatMap(g=>{
 return createGuideMaps(g,dataset.records,siteGuides).map(map=>{const width=/^(chaco|machu-picchu)/.test(map.id)?4800:3600;
  return {...map,outputPixels:[width,Math.round(width*(map.pixels?.[1]??600)/1200)]};});
});
mkdirSync('work',{recursive:true});
writeFileSync('work/guide-terrain-requests.json',JSON.stringify(requests,null,2)+'\n');
console.log(requests.length+' full-size terrain map requests');
