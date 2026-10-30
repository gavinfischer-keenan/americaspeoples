/** Geographic context for source-qualified places and relationships.
 * Every connection is a straight schematic link, never surveyed route geometry.
 * This module is pure and can run during a static build without browser globals.
 */
export interface RoadNetwork {
  title: string;
  description: string;
  nodes: Array<{
    id: string;
    name: string;
    lon: number;
    lat: number;
    source: string;
    precision: string;
  }>;
  edges: Array<{
    from: string;
    to: string;
    label: string;
    status: "documented-connection" | "proposed-connection" | "schematic-link";
    source: string;
  }>;
}

const escapeHTML = (value: string) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
const styles = {
  "documented-connection": {
    label: "Documented connection",
    color: "#165f54",
    dash: "none",
  },
  "proposed-connection": {
    label: "Proposed connection",
    color: "#964716",
    dash: "9 5",
  },
  "schematic-link": { label: "Context link", color: "#585974", dash: "2 5" },
};
const caution =
  "All drawn lines are schematic, not surveyed route geometry. Connection status describes the cited relationship, not positional accuracy. No chronology or impact footprint is inferred.";

function sourceLink(source: string) {
  let url: URL;
  try {
    url = new URL(source);
  } catch {
    throw new Error(
      `Road map requires an absolute HTTPS source URL: ${source}`,
    );
  }
  if (
    url.protocol !== "https:" ||
    !url.hostname ||
    url.username ||
    url.password
  )
    throw new Error(
      `Road map requires an absolute HTTPS source URL: ${source}`,
    );
  return `<a href="${escapeHTML(url.href)}">Source</a>`;
}

function ticks(min: number, max: number) {
  const target = (max - min) / 5;
  const power = 10 ** Math.floor(Math.log10(target));
  const ratio = target / power;
  const step = (ratio <= 1 ? 1 : ratio <= 2 ? 2 : ratio <= 5 ? 5 : 10) * power;
  const values: number[] = [];
  for (
    let value = Math.ceil(min / step) * step;
    value <= max + step / 100;
    value += step
  )
    values.push(Number(value.toFixed(6)));
  return values;
}

export function roadMapHTML(network: RoadNetwork): string {
  if (!network.nodes.length)
    throw new Error("Road map requires at least one node");
  const nodes = new Map<string, RoadNetwork["nodes"][number]>();
  for (const node of network.nodes) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(node.id))
      throw new Error(`Invalid road map node id: ${node.id}`);
    if (nodes.has(node.id)) throw new Error(`Duplicate node id: ${node.id}`);
    if (
      !Number.isFinite(node.lon) ||
      !Number.isFinite(node.lat) ||
      Math.abs(node.lon) > 180 ||
      Math.abs(node.lat) > 90
    )
      throw new Error(`Invalid coordinates for road map node ${node.id}`);
    if (!node.name.trim() || !node.precision.trim())
      throw new Error(
        `Road map node ${node.id} requires a name and location precision`,
      );
    sourceLink(node.source);
    nodes.set(node.id, node);
  }
  for (const edge of network.edges) {
    if (!nodes.has(edge.from) || !nodes.has(edge.to))
      throw new Error(`Missing edge endpoint: ${edge.from} → ${edge.to}`);
    if (!Object.hasOwn(styles, edge.status))
      throw new Error(`Unknown road map connection status: ${edge.status}`);
    sourceLink(edge.source);
  }

  const width = 960,
    height = 640;
  const lons = network.nodes.map((n) => n.lon),
    lats = network.nodes.map((n) => n.lat);
  const centerLon = (Math.min(...lons) + Math.max(...lons)) / 2;
  const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  // Local equirectangular projection: longitude contracts with mean latitude.
  // One common scale preserves aspect; a long north–south Andes network fits intact.
  const longitudeFactor = Math.max(0.05, Math.cos((centerLat * Math.PI) / 180));
  const lonSpan = Math.max(0.5, Math.max(...lons) - Math.min(...lons));
  const latSpan = Math.max(0.5, Math.max(...lats) - Math.min(...lats));
  const scale = Math.min(680 / (lonSpan * longitudeFactor), 440 / latSpan);
  const point = (lon: number, lat: number) => [
    width / 2 + (lon - centerLon) * longitudeFactor * scale,
    height / 2 - (lat - centerLat) * scale,
  ];
  const num = (value: number) => value.toFixed(2);
  const degreeLabel = (value: number, axis: "lon" | "lat") =>
    `${Math.abs(value)}°${value === 0 ? "" : axis === "lon" ? (value < 0 ? "W" : "E") : value < 0 ? "S" : "N"}`;
  const grid = [
    ...ticks(
      Math.max(-180, centerLon - 420 / (longitudeFactor * scale)),
      Math.min(180, centerLon + 420 / (longitudeFactor * scale)),
    ).map((lon) => {
      const [x] = point(lon, centerLat);
      return `<line x1="${num(x)}" y1="60" x2="${num(x)}" y2="580" stroke="#d5dfe2"/><text x="${num(x)}" y="603" text-anchor="middle">${degreeLabel(lon, "lon")}</text>`;
    }),
    ...ticks(
      Math.max(-90, centerLat - 260 / scale),
      Math.min(90, centerLat + 260 / scale),
    ).map((lat) => {
      const [, y] = point(centerLon, lat);
      return `<line x1="60" y1="${num(y)}" x2="900" y2="${num(y)}" stroke="#d5dfe2"/><text x="53" y="${num(y + 4)}" text-anchor="end">${degreeLabel(lat, "lat")}</text>`;
    }),
  ].join("");
  const links = network.edges
    .map((edge) => {
      const from = nodes.get(edge.from)!,
        to = nodes.get(edge.to)!;
      const [x1, y1] = point(from.lon, from.lat),
        [x2, y2] = point(to.lon, to.lat);
      const style = styles[edge.status];
      return `<line data-status="${edge.status}" x1="${num(x1)}" y1="${num(y1)}" x2="${num(x2)}" y2="${num(y2)}" stroke="${style.color}" stroke-width="3" stroke-dasharray="${style.dash}"><title>${escapeHTML(edge.label)} — ${style.label}; schematic straight link</title></line>`;
    })
    .join("");
  const places = network.nodes
    .map((node) => {
      const [x, y] = point(node.lon, node.lat),
        left = x > width / 2;
      const label =
        node.name.length > 30 ? node.name.slice(0, 27) + "…" : node.name;
      return `<g><circle data-node="${escapeHTML(node.id)}" cx="${num(x)}" cy="${num(y)}" r="6" fill="#173846" stroke="#fff" stroke-width="2"><title>${escapeHTML(node.name)} — ${escapeHTML(node.precision)}</title></circle><text x="${num(x + (left ? -11 : 11))}" y="${num(y - 10)}" text-anchor="${left ? "end" : "start"}" font-size="14" font-weight="600" fill="#173846" stroke="#f5f8f7" stroke-width="4" paint-order="stroke">${escapeHTML(label)}</text></g>`;
    })
    .join("");
  const legend = Object.values(styles)
    .map(
      (style) =>
        `<span style="display:inline-flex;align-items:center;gap:.35em;margin-right:1em"><svg aria-hidden="true" width="44" height="14"><line x1="1" y1="7" x2="43" y2="7" stroke="${style.color}" stroke-width="3" stroke-dasharray="${style.dash}"/></svg>${style.label}</span>`,
    )
    .join("");

  return `<figure class="road-map"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHTML(network.title + ". " + network.description + " " + caution)}" style="width:100%;height:auto;background:#f5f8f7;border:1px solid #b4c5cb;font-family:system-ui,sans-serif;font-size:12px"><title>${escapeHTML(network.title)}</title><desc>${escapeHTML(network.description + " North is up. Locations use a local equirectangular projection with longitude scaled at the mean latitude. " + caution + " Full places, coordinates, connection statuses and source links follow in HTML tables.")}</desc><g fill="#445b65">${grid}<text x="480" y="628" text-anchor="middle">Longitude</text><text x="16" y="320" transform="rotate(-90 16 320)" text-anchor="middle">Latitude</text><text x="875" y="35" font-size="17" font-weight="bold">N ↑</text></g>${links}${places}</svg><figcaption><strong>${escapeHTML(network.title)}</strong><p>${escapeHTML(network.description)}</p><div class="road-map-legend">${legend}</div><p>${caution} Node locations retain the source precision stated below.</p></figcaption><div class="table-scroll"><table class="road-map-links"><caption>All connections and their sources</caption><thead><tr><th scope="col">From</th><th scope="col">To</th><th scope="col">Relationship</th><th scope="col">Status</th><th scope="col">Evidence</th></tr></thead><tbody>${network.edges.map((edge) => `<tr><td>${escapeHTML(nodes.get(edge.from)!.name)}</td><td>${escapeHTML(nodes.get(edge.to)!.name)}</td><td>${escapeHTML(edge.label)}</td><td>${styles[edge.status].label}</td><td>${sourceLink(edge.source)}</td></tr>`).join("")}</tbody></table><table class="road-map-nodes"><caption>Place locations and source precision</caption><thead><tr><th scope="col">Place</th><th scope="col">Longitude</th><th scope="col">Latitude</th><th scope="col">Location precision</th><th scope="col">Evidence</th></tr></thead><tbody>${network.nodes.map((node) => `<tr><th scope="row">${escapeHTML(node.name)}</th><td>${node.lon}°</td><td>${node.lat}°</td><td>${escapeHTML(node.precision)}</td><td>${sourceLink(node.source)}</td></tr>`).join("")}</tbody></table></div></figure>`;
}
