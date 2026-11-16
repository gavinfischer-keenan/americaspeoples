import type { Story } from './stories';
import { sampleStory, sceneStartMs } from './story-player';
import { END_YEAR } from './time';

/** A topic owns its clock. It has no reference to the shared atlas state. */
export class TopicSession {
  year:number;
  elapsed=0;
  sceneIndex=0;
  guided=true;
  completed=false;
  readonly minYear:number;
  constructor(readonly story:Story){
    this.minYear=Math.min(...story.scenes.map(s=>s.year));
    this.year=story.scenes[0].year;
  }
  seekYear(year:number){
    if(!Number.isFinite(year))return;
    this.year=Math.max(this.minYear,Math.min(END_YEAR,Math.round(year)));
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
      this.year=Math.min(END_YEAR,this.year+Math.max(0,ms)/1000*20);
      this.completed=this.year>=END_YEAR;
    }
  }
}
