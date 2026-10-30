import test from "node:test";
import assert from "node:assert/strict";
import { roadMapHTML, type RoadNetwork } from "../src/road-map";

const network = (): RoadNetwork => ({
  title: "Andean connections",
  description: "Source-qualified places",
  nodes: [
    {
      id: "north",
      name: "Northern center",
      lon: -78.5,
      lat: -0.2,
      source: "https://example.org/north",
      precision: "Approximate site center",
    },
    {
      id: "south",
      name: "Southern center",
      lon: -69,
      lat: -32,
      source: "https://example.org/south",
      precision: "Approximate site center",
    },
    {
      id: "middle",
      name: "Middle center",
      lon: -72,
      lat: -14,
      source: "https://example.org/middle",
      precision: "Approximate site center",
    },
  ],
  edges: [
    {
      from: "north",
      to: "middle",
      label: "Supported connection",
      status: "documented-connection",
      source: "https://example.org/documented",
    },
    {
      from: "middle",
      to: "south",
      label: "Proposed connection",
      status: "proposed-connection",
      source: "https://example.org/proposed",
    },
    {
      from: "north",
      to: "south",
      label: "Context connection",
      status: "schematic-link",
      source: "https://example.org/context",
    },
  ],
});

test("geographic map fits distant Andes nodes, keeps north up and exposes distinct schematic connection styles", () => {
  const html = roadMapHTML(network());
  assert.match(html, /<svg[^>]*role="img"/);
  assert.match(html, /<title>Andean connections<\/title>/);
  assert.match(html, /<desc>/);
  assert.match(html, /All drawn lines are schematic/);
  assert.match(html, /not surveyed route geometry/);
  assert.match(html, /No chronology/);
  assert.match(html, /N ↑/);
  assert.match(html, /Longitude/);
  assert.match(html, /Latitude/);
  const positions = [
    ...html.matchAll(
      /<circle data-node="([^"]+)" cx="([\d.]+)" cy="([\d.]+)"/g,
    ),
  ];
  assert.equal(positions.length, 3);
  const north = positions.find((p) => p[1] === "north")!,
    south = positions.find((p) => p[1] === "south")!;
  assert.ok(Number(north[3]) < Number(south[3]));
  for (const p of positions) {
    assert.ok(Number(p[2]) >= 50 && Number(p[2]) <= 910);
    assert.ok(Number(p[3]) >= 50 && Number(p[3]) <= 590);
  }
  assert.match(
    html,
    /data-status="documented-connection"[^>]*stroke-dasharray="none"/,
  );
  assert.match(
    html,
    /data-status="proposed-connection"[^>]*stroke-dasharray="9 5"/,
  );
  assert.match(html, /data-status="schematic-link"[^>]*stroke-dasharray="2 5"/);
});

test("HTML equivalent includes every connection and site source with coordinate precision", () => {
  const data = network(),
    html = roadMapHTML(data);
  assert.match(html, /<table[^>]*class="road-map-links"/);
  const table = html.split('class="road-map-links"')[1].split("</table>")[0];
  for (const edge of data.edges) {
    assert.ok(table.includes(edge.label));
    assert.ok(table.includes(`href="${edge.source}"`));
  }
  for (const node of data.nodes) {
    assert.ok(html.includes(`href="${node.source}"`));
    assert.ok(html.includes(node.precision));
  }
});

test("untrusted labels are escaped and every source must use HTTPS", () => {
  const data = network();
  data.title = "<img src=x onerror=bad()>";
  data.nodes[0].name = "A & <script>bad()</script>";
  const html = roadMapHTML(data);
  assert.ok(!html.includes("<img"));
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;img"));
  assert.ok(html.includes("A &amp; &lt;script&gt;"));
  for (const source of [
    "javascript:alert(1)",
    "http://example.org",
    "https://",
    "//example.org",
  ]) {
    const bad = network();
    bad.nodes[0].source = source;
    assert.throws(() => roadMapHTML(bad), /HTTPS source/);
    const badEdge = network();
    badEdge.edges[0].source = source;
    assert.throws(() => roadMapHTML(badEdge), /HTTPS source/);
  }
});

test("invalid identities, coordinates and connection endpoints fail clearly during generation", () => {
  for (const id of ["", "bad id", "<svg>"]) {
    const data = network();
    data.nodes[0].id = id;
    assert.throws(() => roadMapHTML(data), /node id/);
  }
  const duplicate = network();
  duplicate.nodes[1].id = "north";
  assert.throws(() => roadMapHTML(duplicate), /Duplicate node id/);
  for (const [lon, lat] of [
    [NaN, 0],
    [Infinity, 0],
    [-181, 0],
    [181, 0],
    [0, -91],
    [0, 91],
  ]) {
    const data = network();
    Object.assign(data.nodes[0], { lon, lat });
    assert.throws(() => roadMapHTML(data), /coordinates/);
  }
  const missing = network();
  missing.edges[0].to = "missing";
  assert.throws(() => roadMapHTML(missing), /Missing edge endpoint/);
  const empty = network();
  empty.nodes = [];
  assert.throws(() => roadMapHTML(empty), /at least one node/);
});

test("a single site and an east-west network still produce finite bounded geometry", () => {
  const single = network();
  single.nodes = single.nodes.slice(0, 1);
  single.edges = [];
  const flat = network();
  for (const node of flat.nodes) node.lat = 35;
  for (const data of [single, flat]) {
    const html = roadMapHTML(data);
    assert.ok(!/NaN|Infinity/.test(html));
    assert.match(html, /<svg/);
  }
});
