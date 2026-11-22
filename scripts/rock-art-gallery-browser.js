// Local filtering only: no network calls or visitor-data persistence.
const cards = [...document.querySelectorAll('.rock-art-card')];
const search = document.querySelector('#rock-art-search');
const region = document.querySelector('#rock-art-region');
const medium = document.querySelector('#rock-art-medium');
const scale = document.querySelector('#rock-art-scale');
const era = document.querySelector('#rock-art-era');
const countEl = document.querySelector('#rock-art-result-count');
const emptyEl = document.querySelector('#rock-art-empty');
const resetBtn = document.querySelector('#rock-art-reset');

if (search && medium && scale && era && cards.length) {
  const texts = cards.map(c => c.textContent.toLocaleLowerCase());
  const requestedRegion = new URLSearchParams(location.search).get('region');
  if (region && requestedRegion && [...region.options].some(o => o.value === requestedRegion)) {
    region.value = requestedRegion;
  }
  const apply = () => {
    const words = search.value.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    let shown = 0;
    cards.forEach((card, i) => {
      const ok =
        (!region || !region.value || card.dataset.raRegion === region.value) &&
        (!medium.value || card.dataset.raMedium === medium.value) &&
        (!scale.value || card.dataset.raScale === scale.value) &&
        (!era.value || card.dataset.raEra === era.value) &&
        words.every(w => texts[i].includes(w));
      card.hidden = !ok;
      if (ok) shown++;
    });
    if (countEl) {
      countEl.textContent = `${shown} of ${cards.length} exemplar photographs shown`;
    }
    if (emptyEl) {
      emptyEl.hidden = shown !== 0;
    }
  };
  for (const ctrl of [search, region, medium, scale, era].filter(Boolean)) {
    ctrl.addEventListener('input', apply);
  }
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      for (const ctrl of [search, region, medium, scale, era].filter(Boolean)) {
        ctrl.value = '';
      }
      apply();
      search.focus();
    });
  }
  apply();
}
