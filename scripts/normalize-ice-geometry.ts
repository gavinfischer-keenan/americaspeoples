import {readFileSync,writeFileSync} from 'node:fs';
import {normalizeIceGeometry,type IceGeometry} from '../src/ice-geometry';
const file='data/ice-snapshots.json';
const data=JSON.parse(readFileSync(file,'utf8'));
let changed=0;
for(const snapshot of data.snapshots){
 const normalized=normalizeIceGeometry(snapshot.geometry as IceGeometry);
 if(JSON.stringify(normalized)!==JSON.stringify(snapshot.geometry))changed++;
 snapshot.geometry=normalized;
}
if(!data.method.includes('spherical winding'))data.method+=' Ring orientation normalized for D3 spherical winding; coordinates and author scenarios unchanged.';
writeFileSync(file,JSON.stringify(data)+'\n');
console.log(`Normalized spherical winding in ${changed} ice snapshots; no coordinates added or removed.`);
