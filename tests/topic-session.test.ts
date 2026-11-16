import test from 'node:test';
import assert from 'node:assert/strict';
import { TopicSession } from '../src/topic-session';
import type { Story } from '../src/stories';
const story:Story={id:'test',title:'Test',subtitle:'',description:'',scenes:[
 {id:'a',year:100,title:'A',body:'First evidence',note:'Uncertain',recordIds:['a'],scope:'americas',center:[-80,0],zoom:2},
 {id:'b',year:200,title:'B',body:'Later evidence',note:'Uncertain',recordIds:['b'],scope:'americas',center:[-80,0],zoom:2},
]};
test('a topic clock is independent, can seek any date, and returns to chapters explicitly',()=>{
 const a=new TopicSession(story),b=new TopicSession(story);
 a.seekYear(1799);assert.equal(a.year,1799);assert.equal(a.guided,false);assert.equal(b.year,100);
 a.seekScene(1);assert.equal(a.year,200);assert.equal(a.guided,true);assert.equal(b.sceneIndex,0);
});
test('topic playback stops at the final chapter and manual timeline uses its own limits',()=>{
 const s=new TopicSession(story);s.advance(1e9);assert.equal(s.year,200);assert.equal(s.completed,true);
 s.seekYear(-1e9);assert.equal(s.year,s.minYear);s.seekYear(1e9);assert.equal(s.year,1934);
 s.seekScene(0);assert.equal(s.completed,false);assert.equal(s.year,100);
});

test('earlier evidence remains reachable without moving the opening chapter',()=>{
 const s=new TopicSession(story,40);
 assert.equal(s.year,100);
 s.seekYear(40);assert.equal(s.year,40);
 s.seekScene(0);assert.equal(s.year,100);
 s.seekYear(-1e9);assert.equal(s.year,40);
});

test('only the approved Hawaii topic can seek and play through 1959',()=>{
 const hawaii=new TopicSession({...story,id:'hawaii-statehood',scenes:[story.scenes[0],{...story.scenes[1],year:1959}]});
 hawaii.seekYear(1959);assert.equal(hawaii.year,1959);
 hawaii.seekYear(1960);assert.equal(hawaii.year,1959);
 hawaii.seekYear(1958);hawaii.advance(1000);assert.equal(hawaii.year,1959);assert.equal(hawaii.completed,true);
 hawaii.seekScene(0);hawaii.advance(1e9);assert.equal(hawaii.year,1959);assert.equal(hawaii.completed,true);
 const other=new TopicSession({...story,id:'territorial-purchases'});other.seekYear(1959);assert.equal(other.year,1934);
});
