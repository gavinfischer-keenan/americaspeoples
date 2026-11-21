const supported =
  typeof structuredClone === "function" &&
  typeof Object.hasOwn === "function" &&
  typeof String.prototype.replaceAll === "function" &&
  typeof URL.createObjectURL === "function";

function startupMessage(message: string) {
  const app = document.getElementById("app")!;
  const heading = document.createElement("h1");
  heading.textContent = "The Spread of Peoples";
  const note = document.createElement("p");
  note.setAttribute("role", "alert");
  note.textContent = message;
  app.replaceChildren(heading, note);
}

if (!supported) {
  startupMessage(
    "This browser is missing features required by Americas Peoples. Open it in a current version of Chrome, Edge, Firefox or Safari. Your saved suggestions have not been changed.",
  );
} else {
  let generation=0,dispose:(()=>void)|undefined;
  async function open(){
    const current=++generation;dispose?.();dispose=undefined;
    const destination=worldRoute(location.hash);
    try{
      if(destination){
        document.body.classList.add('world-surface','world-route-page');
        document.body.classList.toggle('world-player-page',destination!=='world');
        const {worldHeader,mountWorldPage}=await import('./world-page');if(current!==generation)return;
        document.getElementById('app')!.innerHTML=worldHeader(location.hash||'#world')+'<main id="world-main"><p class="world-load" role="status">Opening the world atlas…</p></main>';
        const container=document.createElement('div');const cleanup=await mountWorldPage(container,destination,worldLand);
        if(current!==generation){cleanup();return;}dispose=cleanup;document.getElementById('world-main')!.replaceChildren(container);
      }else{
        document.getElementById('app')!.innerHTML='<p class="world-load" role="status">Opening the regional atlas…</p>';
        await initializeDataset();if(current!==generation)return;
        window.removeEventListener('hashchange',open);
        document.body.classList.remove('world-surface','world-route-page','world-player-page');
        await import('./main');void initializePhysical();
      }
    }catch(error){if(current!==generation)return;startupMessage((error as Error).message+' Reload to try again. Your saved suggestions have not been changed.');}
  }
  window.addEventListener('hashchange',open);void open();
}
import { initializeDataset } from "./client-data";
import { initializePhysical } from "./physical";
import {worldRoute} from './world-model';
import worldLand from '../data/land.geojson';
