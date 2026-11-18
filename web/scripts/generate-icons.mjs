// Generates favicons, phone home-screen icons and social images from the brand vectors.
// Source: public/brand/logo-mark.svg (extracted from MARs_LogoGlobalColors.ai; same artwork as MARs_LogoNoText.eps).
// Run: npm run icons
import { readFile, writeFile, mkdir } from "node:fs/promises";
import sharp from "sharp";

const root = new URL("..", import.meta.url);
const path = (p) => new URL(p, root);
const markSvg = await readFile(path("public/brand/logo-mark.svg"), "utf8");
const [, , markW, markH] = markSvg.match(/viewBox="([^"]+)"/)[1].split(" ").map(Number);
const markInner = markSvg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const minX = Number(markSvg.match(/viewBox="([-\d.]+)/)[1]);

/** Square SVG with the mark centred at `scale` of the width, on an optional background. */
function squareSvg({ size, scale, background, radius = 0, markColors = {} }) {
  const w = size * scale;
  const h = (w * markH) / markW;
  const x = (size - w) / 2;
  const y = (size - h) / 2 - size * 0.02; // optical centring: the roof is visually heavier at the top
  let inner = markInner;
  for (const [from, to] of Object.entries(markColors)) inner = inner.replaceAll(from, to);
  const bg = background ? `<rect width="${size}" height="${size}" rx="${radius}" fill="${background}"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${bg}<g transform="translate(${x} ${y}) scale(${w / markW}) translate(${-minX} 0)">${inner}</g></svg>`;
}

// Render at high density for smooth edges, then resize to the exact pixel size the SVG declares.
const png = (svg) => {
  const size = Number(svg.match(/width="(\d+)"/)[1]);
  return sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();
};

/** Packs PNG buffers into a .ico container (PNG-in-ICO, supported by all modern browsers). */
function ico(images) {
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const e = 6 + i * 16;
    header.writeUInt8(size >= 256 ? 0 : size, e);
    header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(data.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((i) => i.data)]);
}

await mkdir(path("public/icons"), { recursive: true });
const WHITE = "#FFFFFF";

// Browser tab favicon (.ico for legacy, 16/32/48), transparent background, mark fills the width.
const icoSizes = [16, 32, 48];
const icoImages = await Promise.all(
  icoSizes.map(async (size) => ({ size, data: await png(squareSvg({ size, scale: 0.98 })) })),
);
await writeFile(path("src/app/favicon.ico"), ico(icoImages));

// Scalable favicon for modern browsers; windows turn white in dark browser themes so they stay visible.
const iconSvg = squareSvg({ size: 64, scale: 0.98 }).replace(
  /<svg([^>]*)>/,
  `<svg$1><style>@media (prefers-color-scheme: dark){path[fill="#6e6f72"]{fill:#ffffff}}</style>`,
);
await writeFile(path("src/app/icon.svg"), iconSvg);

// iPhone / iPad home-screen icon (iOS adds its own rounded corners; must be opaque).
await writeFile(path("src/app/apple-icon.png"), await png(squareSvg({ size: 180, scale: 0.72, background: WHITE })));

// Android / PWA icons. "Maskable" keeps the mark inside the 80% safe zone for circle and squircle masks.
await writeFile(path("public/icons/icon-192.png"), await png(squareSvg({ size: 192, scale: 0.72, background: WHITE })));
await writeFile(path("public/icons/icon-512.png"), await png(squareSvg({ size: 512, scale: 0.72, background: WHITE })));
await writeFile(
  path("public/icons/icon-maskable-512.png"),
  await png(squareSvg({ size: 512, scale: 0.6, background: WHITE })),
);

console.log("Icons written: favicon.ico, icon.svg, apple-icon.png, icons/icon-192|512|maskable-512.png");
