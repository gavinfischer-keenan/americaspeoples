import {readdir,readFile,writeFile} from 'node:fs/promises';
import {validateWorldGuides,type WorldGuideIndex} from '../src/world-guide-model';
export async function readWorldGuides(){
 const guides=[];
 for(const atlas of ['americas','pacific','africa','europe','asia-pacific'])for(const file of (await readdir(`data/atlases/${atlas}`)).filter(f=>f.endsWith('deep-dives.json')).sort()){
  const data=JSON.parse(await readFile(`data/atlases/${atlas}/${file}`,'utf8'));
  if(data.schemaVersion!==1)throw Error('Unknown world guide schema');
  guides.push(...data.guides);
 }
 return validateWorldGuides(guides);
}
export async function syncWorldGuideIndex(){
 const guides=await readWorldGuides();
 const index:WorldGuideIndex[]=guides.map(({id,atlasIds,category,title,description,relatedGuideIds,voyageIds})=>({id,atlasIds,category,title,description,href:`sites/${id}.html`,...(relatedGuideIds?{relatedGuideIds}:{}),...(voyageIds?{voyageIds}:{})}));
 await writeFile('data/world-guide-index.json',JSON.stringify({schemaVersion:1,guides:index},null,2)+'\n');
 return guides;
}
