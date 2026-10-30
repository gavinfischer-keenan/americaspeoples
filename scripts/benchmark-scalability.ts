import {performance} from 'node:perf_hooks';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dataset} from '../src/published-data';
import {importWorkbook} from '../src/xlsx-import';
import {inspectImport} from '../src/proposals';
import {setPhysicalData,hazardTimes} from '../src/physical';
import hazards from '../data/hazard-events.json';
import ice from '../data/ice-snapshots.json';
import {smartYearsPerSecond} from '../src/timeline';
import {advancePlayback} from '../src/time';
import {PlaybackIndex} from '../src/playback-index';

const bytes=await readFile('templates/americas-peoples-researched-import.xlsx');
const pack=await importWorkbook(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),dataset.records);
const timings:Record<string,number>={};
function measure(name:string,fn:()=>unknown){const start=performance.now();fn();timings[name]=performance.now()-start;}
measure('importNewSnapshotMs',()=>inspectImport(pack.proposals,[],dataset.records));
measure('importDuplicateSnapshotMs',()=>inspectImport(pack.proposals,pack.proposals,dataset.records));
setPhysicalData(hazards,ice);
measure('playback100TicksMs',()=>{for(let i=0;i<100;i++){
 const records=[...dataset.records,...hazardTimes(new Set(),false)];
 const year=1000+i*7;smartYearsPerSecond(records,year);advancePlayback(records,year,100);
}});
const enabled=[...dataset.records,...hazardTimes(new Set(),false)];
let index:PlaybackIndex;
measure('playbackIndexBuildMs',()=>{index=new PlaybackIndex(enabled);});
measure('indexedPlayback100TicksMs',()=>{for(let i=0;i<100;i++){
 const year=1000+i*7;index.yearsPerSecond(year);index.advance(year,100);
}});
const report={records:dataset.records.length,hazards:hazards.events.length,measuredAt:new Date().toISOString(),timings};
await mkdir('test-results',{recursive:true});
await writeFile(process.env.BENCHMARK_OUT||'test-results/scalability-benchmark.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
