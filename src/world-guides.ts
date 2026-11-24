import catalog from '../data/world-guide-index.json';
import {esc} from './dom';
import type {WorldGuideIndex} from './world-guide-model';
import type {PlannedAtlasId} from './atlas-catalog';
export const worldGuides=catalog.guides as WorldGuideIndex[];
const guidesById=new Map(worldGuides.map(g=>[g.id,g]));
const RELATED_WORLD_GUIDES:Readonly<Record<string,readonly string[]>>={
 'world-origin-stories-americas':['cahokia-urban','south-teotihuacan-urban-development','trade-meso-pachuca-teotihuacan','chaco-regional-center','trade-am-zuni-chaco-beams','empire-tenochtitlan-population'],
 'world-origin-stories-south-america':['south-tiwanaku-planned-city','south-caral-dated-contexts','trade-deep-am-paria-cusco-maize','trade-deep-am-rumiqolqa-saraguro-stone','city-ollantaytambo'],
 'world-andean-summit-children':['south-machupicchu-ams-occupation','city-ollantaytambo','empire-cuzco-survey-counts','trade-deep-am-rumiqolqa-saraguro-stone'],
 'world-stonehenge':['bi-windmill-hill-enclosure','bi-sweet-track-build','euho-carnac-morbihan-megaliths'],
 'world-scotland-stones':['bi-calanais-circle','bi-skara-brae-houses','bi-knap-of-howar-houses'],
 'world-hadar-oldowan':['family-hadar-lucy','aus-hadar-al129-knee','aus-hadar-al333-first-family'],
 'world-shungura':['p1m-omo-57-123-oldowan','p30k-af-omo-shungura','aus-omo-usno-shungura-afarensis'],
 'world-mesopotamian-writing':['amea-hab-nippur-kish-sumer','amea-hab-ebla-tell-mardikh','asho-babylon-esagila-ishtar','asho-tell-brak-eridu-ubaid'],
 'world-ancient-shipwrecks':['wreck-ancient-dokos','wreck-ancient-gelidonya','wreck-ancient-kyrenia','wreck-ancient-uluburun','wreck-ukho-19160','wreck-wam-812','wreck-ukho-14745','wreck-ukho-21806','wreck-ukho-75657'],
 'world-superlative-shipwrecks':['wreck-dokos','wreck-ancient-dokos','wreck-cape-gelidonya','wreck-ancient-gelidonya','wreck-mary-rose','wreck-ukho-19160','wreck-belitung-batu-hitam','med-uluburun-wreck','wreck-ancient-uluburun','eu-ee-uluburun-shipwreck','nordic-se-vasa'],
 'world-dead-sea-scrolls':['arab-jerusalem-al-quds','asho-wf16-jericho-ganj-dareh'],
 'world-rosetta-stone':['med-alexandria-pharos','med-naukratis-heracleion','rom-actium-egypt'],
 'world-history-of-blue-and-dyes':['med-tyre-sidon','asho-jingdezhen-song-ming-porcelain'],
 'world-chinese-gunpowder-explosives':['asho-han-tang-changan-maritime','gchm-shaolin-mount-song'],
 'world-origin-stories-asia-pacific':['ind-nalanda-bodhgaya-pala','seat-angkor-wat-thom','sp-taiwan-beinan-dabenkeng','r6-te-bakoa','gchm-dadiwan-banpo'],
 'world-everyday-writing':['rom-vindolanda-tablets','amea-hab-tell-el-farkha-elephantine'],
 'world-cold-preserved-people':['eu-it-otzi-iceman','nordic-dk-tollund','family-denisova-early','family-xiahe-mandible'],
 'world-borobudur-bagan-se-asia':['seat-angkor-wat-thom','seat-sambor-prei-kuk'],
};
export function relatedWorldGuidesFor(recordId:string,excludeGuideId?:string):WorldGuideIndex[]{
 const cleanId=recordId.replace(/^(?:world|europe):/,'');
 const ids=new Set<string>();
 if(cleanId.startsWith('nara-'))ids.add('world-north-america-rock-art');
 for(const [guideId,recordIds] of Object.entries(RELATED_WORLD_GUIDES)){
  if(recordIds.includes(cleanId))ids.add(guideId);
 }
 if(excludeGuideId)ids.delete(excludeGuideId);
 return [...ids].map(id=>guidesById.get(id)).filter((g):g is WorldGuideIndex=>Boolean(g));
}
export function relatedWorldGuideLinksHTML(recordId:string,excludeGuideId?:string,prefix=''):string{
 const related=relatedWorldGuidesFor(recordId,excludeGuideId);
 if(!related.length)return '';
 return related.map(g=>`<a class="site-guide-link" href="${prefix}${esc(g.href)}">◈ Related deep dive: ${esc(g.title)} ↗</a>`).join('');
}
export function voyageGuideLinksHTML(id:string):string{
 const guides=worldGuides.filter(g=>g.voyageIds?.includes(id));
 return guides.length?`<p class="voyage-regional-guides">Explore the other shores: ${guides.map(g=>`<a href="${esc(g.href)}#voyage-${esc(id)}">${esc(g.title)}</a>`).join(' · ')}</p>`:'';
}
export function regionalGuidesHTML(atlas:PlannedAtlasId):string{
 const guides=worldGuides.filter(g=>g.atlasIds.includes(atlas));
 if(!guides.length)return '';
 return `<section class="regional-guides" aria-labelledby="regional-guides-title"><p class="eyebrow">START READING</p><h2 id="regional-guides-title">Deep dives available now</h2><p>Explore the places, finds and connections in these illustrated studies. Each guide has its own dated evidence and maps. ${atlas==='europe'?'The Europe movie is now playable through 1900.':'The regional movie map is coming later.'}</p><div class="dive-grid">${guides.map(g=>`<article class="dive-card"><h3><a href="${esc(g.href)}">${esc(g.title)}</a></h3><p>${esc(g.description)}</p><a href="${esc(g.href)}">Read the guide ↗</a></article>`).join('')}</div></section>`;
}
