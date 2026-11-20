import './map-navigation.css';

export interface MapNavigationOptions {
 region?:'americas'|'africa'|'europe'|'asia-pacific';
 settings?:HTMLElement[];
 facts:HTMLElement[];
 onFactsToggle?:(open:boolean)=>void;
 /** Preserve established control IDs where another map already uses them. */
 settingsToggleId?:string;
 factsToggleId?:string;
}
export interface MapNavigation {showFacts():void;closeMenus():void;dispose():void}
let sequence=0;
const destinations=[['americas','Americas','#movie'],['africa','Africa','#atlas/africa'],['europe','Europe','#atlas/europe'],['asia-pacific','Asia & Pacific','#atlas/asia-pacific']] as const;

/** Shared normal-flow navigation. Supplied settings retain their handlers/state. */
export function mountMapNavigation(host:HTMLElement,options:MapNavigationOptions):MapNavigation {
 const prefix=`map-navigation-${++sequence}`,controller=new AbortController(),listen={signal:controller.signal};
 const settings=options.settings??[],origins=settings.map(element=>{const marker=document.createComment('map setting');element.before(marker);return {element,marker,hidden:element.hidden};});
 const originalFacts=options.facts.map(element=>({element,hidden:element.hidden,id:element.id}));
 const root=document.createElement('div');root.className='map-navigation';
 const strip=document.createElement('nav');strip.className='map-navigation-strip';strip.setAttribute('aria-label','Map navigation');
 const world=document.createElement('a');world.href='#world';world.textContent='World';
 const button=(text:string,id:string)=>{const node=document.createElement('button');node.type='button';node.textContent=text;node.id=id;node.setAttribute('aria-expanded','false');return node;};
 const regionName=destinations.find(([id])=>id===options.region)?.[1]??'Choose';
 const regionButton=button(`Region: ${regionName}`,`${prefix}-region-toggle`);
 const settingsButton=button('Map settings',options.settingsToggleId??`${prefix}-settings-toggle`);
 const factsButton=button('Facts',options.factsToggleId??`${prefix}-facts-toggle`);
 const regionPanel=document.createElement('nav');regionPanel.className='map-navigation-regions';regionPanel.id=`${prefix}-regions`;regionPanel.hidden=true;regionPanel.setAttribute('aria-label','Choose a region');
 for(const [id,label,href] of destinations){const a=document.createElement('a');a.href=href;a.textContent=label;if(id===options.region)a.setAttribute('aria-current','page');regionPanel.append(a);}
 const settingsPanel=document.createElement('div');settingsPanel.className='map-navigation-settings';settingsPanel.id=`${prefix}-settings`;settingsPanel.hidden=true;settingsPanel.setAttribute('aria-label','Map settings');
 for(const element of settings){element.hidden=false;settingsPanel.append(element);}
 regionButton.setAttribute('aria-controls',regionPanel.id);settingsButton.setAttribute('aria-controls',settingsPanel.id);
 options.facts.forEach((element,index)=>{if(!element.id)element.id=`${prefix}-facts-${index}`;});
 factsButton.setAttribute('aria-controls',options.facts.map(element=>element.id).join(' '));
 let factsOpen=options.facts.some(element=>!element.hidden),disposed=false;
 factsButton.setAttribute('aria-expanded',String(factsOpen));
 const closeMenus=()=>{regionPanel.hidden=true;settingsPanel.hidden=true;regionButton.setAttribute('aria-expanded','false');settingsButton.setAttribute('aria-expanded','false');};
 const setFacts=(open:boolean)=>{factsOpen=open;options.facts.forEach(element=>{element.hidden=!open;});factsButton.setAttribute('aria-expanded',String(open));options.onFactsToggle?.(open);};
 regionButton.addEventListener('click',()=>{const open=regionPanel.hidden;closeMenus();regionPanel.hidden=!open;regionButton.setAttribute('aria-expanded',String(open));},listen);
 settingsButton.addEventListener('click',()=>{const open=settingsPanel.hidden;closeMenus();settingsPanel.hidden=!open;settingsButton.setAttribute('aria-expanded',String(open));if(open)settingsPanel.querySelector<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),summary,a[href]')?.focus();},listen);
 factsButton.addEventListener('click',()=>{closeMenus();setFacts(!factsOpen);},listen);
 regionPanel.addEventListener('click',event=>{if((event.target as Element).closest('a'))closeMenus();},listen);
 // Close before a target handler fits its camera. A menu can open and close in
 // one frame, so ResizeObserver may never observe its temporary smaller map.
 settingsPanel.addEventListener('change',event=>{if((event.target as Element).matches('select,input[type="checkbox"],input[type="radio"]')){closeMenus();settingsButton.focus();}},{...listen,capture:true});
 settingsPanel.addEventListener('click',event=>{const choice=(event.target as Element).closest('a,[data-map-menu-choice]');if(choice){closeMenus();if(!choice.matches('a[href]'))settingsButton.focus();}},{...listen,capture:true});
 root.addEventListener('keydown',event=>{if(event.key==='Escape'&&(!settingsPanel.hidden||!regionPanel.hidden)){const focus=!settingsPanel.hidden?settingsButton:regionButton;event.preventDefault();event.stopPropagation();closeMenus();focus.focus();}},listen);
 strip.append(world,regionButton,settingsButton,factsButton);root.append(strip,regionPanel,settingsPanel);host.append(root);
 options.onFactsToggle?.(factsOpen);
 return {showFacts(){if(!disposed){closeMenus();setFacts(true);}},closeMenus(){if(!disposed)closeMenus();},dispose(){if(disposed)return;disposed=true;controller.abort();for(const {element,marker,hidden} of origins){marker.replaceWith(element);element.hidden=hidden;}for(const {element,hidden,id} of originalFacts){element.hidden=hidden;element.id=id;}root.remove();}};
}
