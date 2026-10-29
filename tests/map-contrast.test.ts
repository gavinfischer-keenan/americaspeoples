import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const css=readFileSync('src/styles.css','utf8');
const rgb=(h:string)=>h.match(/[a-f0-9]{2}/gi)!.map(x=>parseInt(x,16));
const lum=(a:number[])=>a.map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4}).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0);
const ratio=(a:number[],b:number[])=>{const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
test('map symbol palette contrasts with land and ocean; labels meet 4.5:1',()=>{
 for(const color of ['#a9ceff','#70ead5','#f1d975','#dfbaff','#57c7c4','#ee8c78','#ff696d','#caa1ef','#e5c78c','#f4edce','#d1b47f','#ff6e7d']){
 assert.ok(css.includes(color),color);for(const bg of ['#122730','#2d454d'])assert.ok(ratio(rgb(color),rgb(bg))>=3,`${color} on ${bg}`);
 }
 for(const color of ['#c1d0d5','#afc5ce'])for(const bg of ['#122730','#2d454d'])assert.ok(ratio(rgb(color),rgb(bg))>=4.5);
});
