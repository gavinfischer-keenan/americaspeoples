 // Local progressive enhancement: no map-service calls or visitor tracking.
try{
 const raw=sessionStorage.getItem('americas-peoples-return-context-v1');
 if(raw){
  const ctx=JSON.parse(raw);
  if(ctx&&typeof ctx.hash==='string'&&ctx.hash.startsWith('#')){
   for(const link of document.querySelectorAll('[data-atlas-return]')){
    if(link.dataset.atlasReturnBound)continue;
    link.dataset.atlasReturnBound='1';
    link.setAttribute('href','../'+ctx.hash);
    link.addEventListener('click',()=>{try{sessionStorage.setItem('americas-peoples-return-context-v1',JSON.stringify({...ctx,pendingRestore:true}));}catch{}});
   }
  }
 }
}catch{}
for(const viewer of document.querySelectorAll('[data-map-viewer]')){
 const viewport=viewer.querySelector('.guide-map-viewport');
 const graphic=viewport?.querySelector('svg,img');
 if(!viewport||!graphic)continue;
 let zoom=1;
 const apply=(next)=>{
  const x=(viewport.scrollLeft+viewport.clientWidth/2)/Math.max(graphic.getBoundingClientRect().width,1);
  const y=(viewport.scrollTop+viewport.clientHeight/2)/Math.max(graphic.getBoundingClientRect().height,1);
  zoom=Math.min(6,Math.max(1,next));
  const box=graphic.getAttribute('viewBox')?.split(/\s+/).map(Number);
  const aspect=box?box[2]/box[3]:Number(graphic.getAttribute('width'))/Number(graphic.getAttribute('height'));
  const heightLimit=document.fullscreenElement===viewer?viewer.clientHeight-viewer.querySelector('.guide-map-toolbar').offsetHeight:window.innerHeight*.76;
  const fitWidth=Math.min(viewport.clientWidth,heightLimit*(Number.isFinite(aspect)?aspect:2));
  graphic.style.minWidth='0';graphic.style.margin='0 auto';graphic.style.width=`${fitWidth*zoom}px`;
  viewer.querySelector('output').textContent=`${Math.round(zoom*100)}%`;
  viewport.scrollLeft=x*graphic.getBoundingClientRect().width-viewport.clientWidth/2;
  viewport.scrollTop=y*graphic.getBoundingClientRect().height-viewport.clientHeight/2;
  viewer.querySelector('[data-map-action="out"]').disabled=zoom===1;
  viewer.querySelector('[data-map-action="in"]').disabled=zoom===6;
 };
 viewer.addEventListener('click',async event=>{
  const button=event.target.closest('[data-map-action]');if(!button)return;
  const action=button.dataset.mapAction;
  if(action==='in')apply(zoom*1.5);
  if(action==='out')apply(zoom/1.5);
  if(action==='reset'){apply(1);viewport.scrollLeft=viewport.scrollTop=0;}
  if(action==='fullscreen'){
   try{if(document.fullscreenElement===viewer)await document.exitFullscreen();else await viewer.requestFullscreen();}
   catch{viewer.querySelector('output').textContent='Use browser full screen';}
  }
 });
 viewport.addEventListener('keydown',event=>{
  if(event.target!==viewport)return;
  if(event.key==='+'||event.key==='='){event.preventDefault();apply(zoom*1.5);}
  if(event.key==='-'){event.preventDefault();apply(zoom/1.5);}
  if(event.key==='0'){event.preventDefault();apply(1);viewport.scrollLeft=viewport.scrollTop=0;}
 });
 window.addEventListener('resize',()=>apply(zoom));
 document.addEventListener('fullscreenchange',()=>apply(zoom));
 for(const disclosure of viewer.closest('details')?[viewer.closest('details')]:[])disclosure.addEventListener('toggle',()=>{if(disclosure.open)apply(zoom);});
 apply(1);
}
