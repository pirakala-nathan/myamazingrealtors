// Builds src/lib/content/service-areas-map.ts from Ontario (LIO) and City of Toronto open boundary data.
//
// 1. Into an empty folder, download:
//    munis.json   - LIO_OPEN_DATA/LIO_Open03/MapServer/14/query on ws.lioservices.lrc.gov.on.ca, where
//                   MUNICIPAL_NAME_SHORTFORM IN (the areas and neighbours below) AND MUNICIPAL_AREA_EXTENT_TYPE <> Water,
//                   outSR=4326, maxAllowableOffset=0.0002, f=geojson
//    toronto.json - City of Toronto open data, "Former Municipality Boundaries" (EPSG 4326 GeoJSON)
// 2. node scripts/build-service-area-map.mjs <that folder> src/lib/content/service-areas-map.ts
import fs from "node:fs";
const dir = process.argv[2];
const out = process.argv[3];
const munis = JSON.parse(fs.readFileSync(`${dir}/munis.json`, "utf8"));
const toronto = JSON.parse(fs.readFileSync(`${dir}/toronto.json`, "utf8"));

const LON0 = -79.66, LON1 = -78.42, LAT0 = 43.55, LAT1 = 44.36;
const COS = Math.cos((43.95 * Math.PI) / 180);
const W = 1000;
const K = W / ((LON1 - LON0) * COS);
const H = Math.round((LAT1 - LAT0) * K);
const proj = ([lon, lat]) => [(lon - LON0) * COS * K, (LAT1 - lat) * K];

function dp(pts, tol) {
  if (pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
    let max = 0, idx = -1;
    for (let i = a + 1; i < b; i++) {
      const d = dx === 0 && dy === 0 ? Math.hypot(pts[i][0] - ax, pts[i][1] - ay) : Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / len;
      if (d > max) (max = d), (idx = i);
    }
    if (max > tol && idx > 0) (keep[idx] = 1), stack.push([a, idx], [idx, b]);
  }
  return pts.filter((_, i) => keep[i]);
}

const ringArea = (r) => r.reduce((s, [x, y], i) => { const [x2, y2] = r[(i + 1) % r.length]; return s + x * y2 - x2 * y; }, 0) / 2;

function rings(geom) {
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  return polys.flatMap((p) => p.map((r) => r.map(proj)));
}

function toPath(rs, tol = 0.9, minArea = 4) {
  return rs
    .map((r) => dp(r, tol))
    .filter((r) => r.length > 3 && Math.abs(ringArea(r)) > minArea)
    .map((r) => "M" + r.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L") + "Z")
    .join("");
}

function centroid(rs) {
  const r = rs.reduce((a, b) => (Math.abs(ringArea(b)) > Math.abs(ringArea(a)) ? b : a));
  let cx = 0, cy = 0, a = 0;
  r.forEach(([x, y], i) => { const [x2, y2] = r[(i + 1) % r.length]; const f = x * y2 - x2 * y; a += f; cx += (x + x2) * f; cy += (y + y2) * f; });
  return [Math.round(cx / (3 * a)), Math.round(cy / (3 * a))];
}

const land = (name) => munis.features.filter((f) => f.properties.MUNICIPAL_NAME_SHORTFORM === name && f.properties.MUNICIPAL_AREA_EXTENT_TYPE !== "Water").flatMap((f) => rings(f.geometry));
const scarborough = toronto.features.filter((f) => /SCARBOROUGH/i.test(f.properties.AREA_NAME)).flatMap((f) => rings(f.geometry));

const labels = { toronto: [190, 742], ajax: [512, 562], pickering: [430, 500], scarborough: [345, 662], markham: [300, 535], "richmond-hill": [183, 515] };
const areas = [
  ["toronto", "Toronto", land("TORONTO")],
  ["oshawa", "Oshawa", land("OSHAWA")],
  ["whitby", "Whitby", land("WHITBY")],
  ["ajax", "Ajax", land("AJAX")],
  ["pickering", "Pickering", land("PICKERING")],
  ["clarington", "Clarington", land("CLARINGTON")],
  ["scarborough", "Scarborough", scarborough],
  ["markham", "Markham", land("MARKHAM")],
  ["richmond-hill", "Richmond Hill", land("RICHMOND HILL")],
  ["stouffville", "Stouffville", land("WHITCHURCH-STOUFFVILLE")],
  ["uxbridge", "Uxbridge", land("UXBRIDGE")],
  ["vaughan", "Vaughan", land("VAUGHAN")],
  ["brampton", "Brampton", land("BRAMPTON")],
  ["mississauga", "Mississauga", land("MISSISSAUGA")],
];
const context = ["SCUGOG", "VAUGHAN", "KING", "AURORA", "NEWMARKET", "BROCK", "EAST GWILLIMBURY", "PORT HOPE", "CAVAN MONAGHAN", "KAWARTHA LAKES", "CALEDON", "HALTON HILLS", "MILTON", "OAKVILLE"];

// Frame the service areas with a margin; the context outside it is clipped.
const pts = areas.flatMap(([, , rs]) => rs.flat());
const PAD = 30;
const minX = Math.floor(Math.min(...pts.map((p) => p[0])) - PAD);
const minY = Math.floor(Math.min(...pts.map((p) => p[1])) - PAD);
const vw = Math.ceil(Math.max(...pts.map((p) => p[0])) + PAD) - minX;
const vh = Math.ceil(Math.max(...pts.map((p) => p[1])) + PAD) - minY;

const lines = [
  "// Generated from open data: Ontario Ministry of Natural Resources (Municipal Boundary, Lower and Single Tier),",
  "// Open Government Licence – Ontario; City of Toronto (Former Municipality Boundaries), Open Government Licence – Toronto.",
  "// Simplified and projected for display. Regenerate rather than editing by hand.",
  "",
  `export const MAP_VIEWBOX = "${minX} ${minY} ${vw} ${vh}";`,
  "",
  "export type MapArea = { id: string; name: string; d: string; label: [number, number] };",
  "",
  "/** Service areas. Toronto comes first so Scarborough is drawn on top of it. */",
  "export const MAP_AREAS: MapArea[] = [",
  ...areas.map(([id, name, rs]) => `  { id: ${JSON.stringify(id)}, name: ${JSON.stringify(name)}, label: ${JSON.stringify(labels[id] ?? centroid(rs))}, d: ${JSON.stringify(toPath(rs))} },`),
  "];",
  "",
  "/** Neighbouring municipalities, drawn faintly for context. */",
  `export const MAP_CONTEXT: string[] = ${JSON.stringify(context.map((n) => toPath(land(n), 1.2, 20)).filter(Boolean))};`,
  "",
];
fs.writeFileSync(out, lines.join("\n"));
console.log("viewBox", minX, minY, vw, vh, "bytes", fs.statSync(out).size);
