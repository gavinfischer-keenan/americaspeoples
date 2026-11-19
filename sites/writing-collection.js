// Local filtering only: no network calls or visitor-data persistence.
const entries=[...document.querySelectorAll('.writing-example')];
const search=document.querySelector('#writing-search'),language=document.querySelector('#writing-language'),genre=document.querySelector('#writing-genre'),region=document.querySelector('#writing-region');
if(search&&language&&genre&&region){
 const texts=entries.map(e=>e.textContent.toLocaleLowerCase());
 const requested=new URLSearchParams(location.search).get('region');
 if([...region.options].some(o=>o.value===requested))region.value=requested;
 const apply=()=>{
  const words=search.value.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);let count=0;
  entries.forEach((entry,i)=>{const show=(!language.value||entry.dataset.writingLanguage===language.value)&&(!genre.value||entry.dataset.writingGenre===genre.value)&&(!region.value||entry.dataset.writingRegion.split(' ').includes(region.value))&&words.every(w=>texts[i].includes(w));entry.hidden=!show;if(show)count++;});
  document.querySelector('#writing-result-count').textContent=`${count} of ${entries.length} texts · originals and translations`;
  document.querySelector('#writing-empty').hidden=count!==0;
 };
 for(const control of [search,language,genre,region])control.addEventListener('input',apply);
 document.querySelector('#writing-reset').addEventListener('click',()=>{for(const control of [search,language,genre,region])control.value='';apply();search.focus();});
 apply();
}
