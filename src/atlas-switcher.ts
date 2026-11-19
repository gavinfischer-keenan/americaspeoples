import { geoOrthographic, geoPath, type GeoPermissibleObjects } from 'd3-geo';
import { atlases, type AtlasId, type PlannedAtlasManifest } from './atlas-catalog';
import { esc } from './dom';

export function atlasNavigationHTML(current: AtlasId = 'americas'): string {
  return `<nav class="atlas-destinations" aria-label="Choose an atlas">${atlases.map(atlas =>
    `<a href="${atlas.href}"${atlas.id === current ? ' aria-current="page"' : ''}><span>${esc(atlas.title)}</span><small>${atlas.status === 'available' ? 'Open atlas' : 'Coming soon'}</small></a>`,
  ).join('')}</nav>`;
}

/** A separate, static coastline map: the Americas MapView and its state stay intact. */
export function atlasPreviewHTML(manifest: PlannedAtlasManifest, land: GeoPermissibleObjects, returnHref = '#movie'): string {
  const [longitude, latitude] = manifest.map.center;
  const projection = geoOrthographic().rotate([-longitude, -latitude]).translate([500, 300]).scale(manifest.map.scale);
  const path = geoPath(projection);
  const back = returnHref === '#explore' ? '#explore' : '#movie';
  return `<article class="atlas-preview" aria-labelledby="atlas-preview-title">
    <div class="atlas-preview-heading"><div><p class="eyebrow">THE HUMAN ATLASES</p><h2 id="atlas-preview-title">${esc(manifest.title)}</h2></div><a class="back-link" href="${back}">← Return to Americas</a></div>
    <figure class="atlas-preview-figure"><div class="atlas-preview-map">
      <svg viewBox="0 0 1000 600" role="img" aria-label="Modern coastline map of ${esc(manifest.title)}. Coming soon."><path class="atlas-preview-ocean" d="${path({ type: 'Sphere' })}"/><path class="atlas-preview-land" d="${path(land)}"/></svg>
      <strong class="atlas-coming-soon" aria-hidden="true">COMING SOON</strong>
    </div><figcaption>Modern coastlines · <a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noopener noreferrer">Natural Earth</a> · Public domain</figcaption></figure>
  </article>`;
}
