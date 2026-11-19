import type { Story } from './stories';
import { sampleStory, sceneStartMs } from './story-player';
import { chaptersThrough, topicEndYear } from './topic-scope';

/** A topic owns its clock. It has no reference to the shared atlas state. */
export class TopicSession {
  year:number;
  elapsed=0;
  sceneIndex=0;
  guided=true;
  completed=false;
  readonly minYear:number;
  readonly maxYear:number;
  readonly story:Story;
  constructor(story:Story,evidenceStartYear?:number){
    this.maxYear=topicEndYear(story.id);
    this.story=chaptersThrough(story,this.maxYear);
    if(!this.story.scenes.length)throw Error("No dated chapters within this timeline");
    this.minYear=Math.min(...this.story.scenes.map(s=>s.year),Number.isFinite(evidenceStartYear)?evidenceStartYear!:Infinity);
    this.year=this.story.scenes[0].year;
  }
  seekYear(year:number){
    if(!Number.isFinite(year))return;
    this.year=Math.max(this.minYear,Math.min(this.maxYear,Math.round(year)));
    this.guided=false;this.completed=false;
  }
  seekScene(index:number){
    this.sceneIndex=Math.max(0,Math.min(this.story.scenes.length-1,Math.floor(index)));
    this.elapsed=sceneStartMs(this.story,this.sceneIndex);
    this.year=this.story.scenes[this.sceneIndex].year;
    this.guided=true;this.completed=false;
  }
  advance(ms:number){
    if(this.guided){
      this.elapsed+=Math.max(0,ms);
      const frame=sampleStory(this.story,this.elapsed);
      this.year=frame.year;this.sceneIndex=frame.sceneIndex;this.completed=frame.completed;
    }else{
      this.year=Math.min(this.maxYear,this.year+Math.max(0,ms)/1000*20);
      this.completed=this.year>=this.maxYear;
    }
  }
}
