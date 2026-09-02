/**
 * Reads the school's timetable PDF and prints one class's week as a grid.
 *
 * The school issues one PDF a year holding every class (21 pages in 2026, one
 * class per page). This turns the page for a single class into a day × slot
 * table an agent can transcribe into `src/data/plans/<year>.json` — see
 * docs/importing-a-plan.md, which owns the procedure and the vocabulary.
 *
 * Node built-ins only, by design: this runs once a year and is not worth a
 * dependency. The PDF is text with TrueType fonts and its own ToUnicode maps,
 * so the text comes out exactly as printed, Polish diacritics included — there
 * is no OCR here and no guessing.
 *
 * Usage:
 *   node scripts/read-plan-pdf.mjs <pdf>            list the classes and pages
 *   node scripts/read-plan-pdf.mjs <pdf> <class>    the week for one class
 *   node scripts/read-plan-pdf.mjs <pdf> <class> --raw   every item with x/y
 *
 * Geometry is derived from each page, not hardcoded: slot columns come from the
 * page's own header digits, day bands from the day labels down the left edge.
 * What is assumed is the generator's layout ("aSc e-Plan lekcji"): a day's cells
 * sit from 30pt below its label to 47pt above it. If the school changes tools,
 * this is the line that breaks — the grid comes out empty or scrambled, loudly.
 */

import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";

/* ---------- object layer ---------- */

function loadObjects(buf) {
  const raw = buf.toString("latin1");
  const objs = new Map();
  const objRe = /(\d+)\s+(\d+)\s+obj\b/g;
  let m;
  while ((m = objRe.exec(raw))) {
    const start = objRe.lastIndex;
    const end = raw.indexOf("endobj", start);
    if (end < 0) continue;
    const body = raw.slice(start, end);
    const sIdx = body.search(/\bstream\r?\n/);
    if (sIdx < 0) {
      objs.set(`${m[1]} ${m[2]}`, {
        dict: body,
        streamStart: -1,
        streamEnd: -1,
      });
      continue;
    }
    const lead = body.slice(sIdx).match(/\bstream\r?\n/)[0].length;
    const streamStart = start + sIdx + lead;
    objs.set(`${m[1]} ${m[2]}`, {
      dict: body.slice(0, sIdx),
      streamStart,
      streamEnd: raw.indexOf("endstream", streamStart),
    });
  }
  return objs;
}

/** /Length is sometimes an indirect reference; endstream is the fallback. */
function streamBytes(buf, objs, obj) {
  if (!obj || obj.streamStart < 0) return null;
  let end = obj.streamEnd;
  const direct = obj.dict.match(/\/Length\s+(\d+)(?!\s+\d+\s+R)/);
  const indirect = obj.dict.match(/\/Length\s+(\d+\s+\d+)\s+R/);
  if (direct) end = obj.streamStart + Number(direct[1]);
  else if (indirect) {
    const len = objs.get(indirect[1])?.dict.match(/(\d+)/);
    if (len) end = obj.streamStart + Number(len[1]);
  }
  const slice = buf.subarray(obj.streamStart, end);
  if (!/\/FlateDecode/.test(obj.dict)) return slice;
  try {
    return inflateSync(slice);
  } catch {
    try {
      return inflateSync(buf.subarray(obj.streamStart, obj.streamEnd));
    } catch {
      return null;
    }
  }
}

/* ---------- fonts ---------- */

function parseCMap(text) {
  const map = new Map();
  const utf16 = (h) => {
    let out = "";
    for (let i = 0; i + 4 <= h.length; i += 4)
      out += String.fromCharCode(parseInt(h.slice(i, i + 4), 16));
    return out;
  };
  const pairRe = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g;
  for (const block of text.match(/beginbfchar[\s\S]*?endbfchar/g) ?? []) {
    let p;
    while ((p = pairRe.exec(block))) map.set(parseInt(p[1], 16), utf16(p[2]));
  }
  const rangeRe = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g;
  for (const block of text.match(/beginbfrange[\s\S]*?endbfrange/g) ?? []) {
    let r;
    while ((r = rangeRe.exec(block))) {
      const lo = parseInt(r[1], 16);
      const hi = parseInt(r[2], 16);
      const base = parseInt(r[3].slice(0, 4), 16);
      for (let c = lo; c <= hi; c++)
        map.set(c, String.fromCharCode(base + (c - lo)));
    }
  }
  return map;
}

/* ---------- page content ---------- */

function pageFontMap(buf, objs, pageDict) {
  const resRef = pageDict.match(/\/Resources\s+(\d+\s+\d+)\s+R/);
  const resText = resRef
    ? (objs.get(resRef[1])?.dict ?? "")
    : (pageDict.match(/\/Resources\s*<<([\s\S]*?)>>\s*\//)?.[1] ?? "");
  const fontRef = resText.match(/\/Font\s+(\d+\s+\d+)\s+R/);
  const fontText = fontRef
    ? (objs.get(fontRef[1])?.dict ?? "")
    : (resText.match(/\/Font\s*<<([\s\S]*?)>>/)?.[1] ?? "");

  const fonts = new Map();
  for (const entry of fontText.match(/\/(\w+)\s+\d+\s+\d+\s+R/g) ?? []) {
    const [, name, ref] = entry.match(/\/(\w+)\s+(\d+\s+\d+)\s+R/);
    const toUni = objs.get(ref)?.dict.match(/\/ToUnicode\s+(\d+\s+\d+)\s+R/);
    const bytes = toUni ? streamBytes(buf, objs, objs.get(toUni[1])) : null;
    fonts.set(name, bytes ? parseCMap(bytes.toString("latin1")) : null);
  }
  return fonts;
}

const TOKEN_RE =
  /(BT|ET)|\/(\w+)\s+[\d.]+\s+Tf|([-\d.]+)\s+([-\d.]+)\s+T[dD]|([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+Tm|(\[[\s\S]*?\])\s*TJ|(\((?:\\.|[^\\)])*\))\s*Tj|(<[0-9A-Fa-f\s]*>)\s*Tj/g;

function decodeLiteral(body, cmap) {
  const bytes = body.replace(/\\([nrtbf()\\]|[0-7]{1,3})/g, (_, g) =>
    /^[0-7]+$/.test(g)
      ? String.fromCharCode(parseInt(g, 8))
      : ({ n: "\n", r: "\r", t: "\t", b: "\b", f: "\f" }[g] ?? g),
  );
  return mapBytes(bytes, cmap);
}

function decodeHex(body, cmap) {
  const hex = body.replace(/\s+/g, "");
  let bytes = "";
  for (let i = 0; i + 2 <= hex.length; i += 2)
    bytes += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
  return mapBytes(bytes, cmap);
}

function mapBytes(bytes, cmap) {
  if (!cmap) return bytes;
  let out = "";
  for (const ch of bytes) out += cmap.get(ch.charCodeAt(0)) ?? ch;
  return out;
}

/** Every text-showing operator on the page, with the position it was drawn at. */
function pageItems(buf, objs, page) {
  const fonts = pageFontMap(buf, objs, page.dict);
  const refs = [];
  const single = page.dict.match(/\/Contents\s+(\d+\s+\d+)\s+R/);
  if (single) refs.push(single[1]);
  for (const r of page.dict
    .match(/\/Contents\s*\[([\s\S]*?)\]/)?.[1]
    ?.match(/\d+\s+\d+\s+R/g) ?? [])
    refs.push(r.replace(/\s+R$/, ""));

  let content = "";
  for (const ref of refs) {
    const bytes = streamBytes(buf, objs, objs.get(ref));
    if (bytes) content += bytes.toString("latin1") + "\n";
  }

  const items = [];
  let tm = [1, 0, 0, 1, 0, 0];
  let cmap = null;
  let t;
  TOKEN_RE.lastIndex = 0;
  while ((t = TOKEN_RE.exec(content))) {
    if (t[1] === "BT") tm = [1, 0, 0, 1, 0, 0];
    else if (t[2]) cmap = fonts.get(t[2]) ?? null;
    else if (t[3] !== undefined) {
      const [dx, dy] = [Number(t[3]), Number(t[4])];
      tm = [
        tm[0],
        tm[1],
        tm[2],
        tm[3],
        tm[4] + dx * tm[0] + dy * tm[2],
        tm[5] + dx * tm[1] + dy * tm[3],
      ];
    } else if (t[5] !== undefined) tm = t.slice(5, 11).map(Number);
    else {
      let text = "";
      if (t[11])
        for (const piece of t[11].match(
          /\((?:\\.|[^\\)])*\)|<[0-9A-Fa-f\s]*>/g,
        ) ?? [])
          text += piece.startsWith("(")
            ? decodeLiteral(piece.slice(1, -1), cmap)
            : decodeHex(piece.slice(1, -1), cmap);
      else if (t[12]) text = decodeLiteral(t[12].slice(1, -1), cmap);
      else if (t[13]) text = decodeHex(t[13].slice(1, -1), cmap);
      if (text.trim())
        items.push({ x: +tm[4].toFixed(1), y: +tm[5].toFixed(1), text });
    }
  }
  return items;
}

function orderedPages(objs) {
  const byKey = new Map(
    [...objs].filter(([, o]) => /\/Type\s*\/Page[^s]/.test(o.dict)),
  );
  const tree = [...objs.values()].find((o) => /\/Type\s*\/Pages/.test(o.dict));
  const kids = tree?.dict.match(/\/Kids\s*\[([\s\S]*?)\]/)?.[1];
  const refs = (kids?.match(/\d+\s+\d+\s+R/g) ?? [])
    .map((r) => r.replace(/\s+R$/, ""))
    .filter((r) => byKey.has(r));
  return refs.length ? refs.map((r) => [r, byKey.get(r)]) : [...byKey];
}

/* ---------- layout ---------- */

/** The class label sits alone on the title line: "0a", "1b", "5c". */
const classOf = (items, topCut) =>
  items.find((i) => i.y > topCut && /^\d+[a-z]$/.test(i.text))?.text ?? "?";

function layout(items) {
  /* Day labels run down the left edge — "Pn", "Wt", "Śr", "Czw", "Pi". The
   * school's name and the footer start at the left edge too, so length is what
   * separates a day from a sentence. */
  const labels = items
    .filter((i) => i.x < 60 && i.text.length <= 3)
    .sort((a, b) => b.y - a.y)
    .map((i) => ({ name: i.text, y: i.y }));
  if (!labels.length) return null;

  /* Cells run from 30pt below a day's label to 47pt above it — measured off the
   * generator's own output, and the same on every page. Anything above the top
   * day's band is the header (class, slot numbers, bell times); anything below
   * the last is the footer. */
  const topCut = labels[0].y + 47;
  const bottomCut = labels.at(-1).y - 30;

  const header = items.filter((i) => i.y > topCut);
  const digitRow = header.filter((i) => /^\d$/.test(i.text));
  const columns = digitRow.sort((a, b) => a.x - b.x).map((i) => i.x);
  const times = header
    .filter((i) => /^\d{1,2}:\d{2} - \d{1,2}:\d{2}$/.test(i.text))
    .sort((a, b) => a.x - b.x)
    .map((i) => i.text);

  return { labels, topCut, bottomCut, columns, times };
}

/** Nearest column centre. Rooms are right-aligned and a merged cell spans two
 *  columns, so an odd-looking x is worth a second look, not a silent fix. */
const columnOf = (x, columns) =>
  columns.reduce(
    (best, c, i) => (Math.abs(x - c) < Math.abs(x - columns[best]) ? i : best),
    0,
  );

/** The day whose label is the first at or below the item, allowing the 30pt
 *  the last line of a cell hangs under its label. */
const dayOf = (y, labels) => labels.findIndex((l) => l.y <= y + 30);

/* ---------- output ---------- */

const [, , pdfPath, wantedClass, ...flags] = process.argv;
if (!pdfPath) {
  console.error("usage: node scripts/read-plan-pdf.mjs <pdf> [class] [--raw]");
  process.exit(1);
}

const buf = readFileSync(pdfPath);
const objs = loadObjects(buf);
const pages = orderedPages(objs);

if (!wantedClass) {
  console.log(`${pages.length} pages in ${pdfPath}\n`);
  pages.forEach(([, page], i) => {
    const items = pageItems(buf, objs, page);
    const geo = layout(items);
    console.log(
      `  page ${String(i + 1).padStart(2)}  class ${classOf(items, geo?.topCut ?? Infinity)}`,
    );
  });
  console.log("\nRun again with a class name for its week.");
  process.exit(0);
}

const hit = pages
  .map(([, page], i) => ({
    page,
    no: i + 1,
    items: pageItems(buf, objs, page),
  }))
  .find(
    (p) =>
      classOf(p.items, layout(p.items)?.topCut ?? Infinity) === wantedClass,
  );

if (!hit) {
  console.error(`No page for class "${wantedClass}".`);
  process.exit(1);
}

const geo = layout(hit.items);
console.log(`class ${wantedClass} — page ${hit.no} of ${pages.length}`);

if (flags.includes("--raw")) {
  for (const i of [...hit.items].sort((a, b) => b.y - a.y || a.x - b.x))
    console.log(`${i.x}\t${i.y}\t${JSON.stringify(i.text)}`);
  process.exit(0);
}

for (const [dayIndex, label] of geo.labels.entries()) {
  console.log(`\n${label.name}`);
  const inDay = hit.items.filter(
    (i) =>
      i.x >= 60 &&
      i.y <= geo.topCut &&
      i.y >= geo.bottomCut &&
      dayOf(i.y, geo.labels) === dayIndex,
  );
  geo.columns.forEach((_, col) => {
    const cell = inDay
      .filter((i) => columnOf(i.x, geo.columns) === col)
      .sort((a, b) => b.y - a.y);
    if (!cell.length) return;
    const slot = `slot ${col} ${geo.times[col] ?? ""}`.padEnd(22);
    console.log(`  ${slot}${cell.map((i) => i.text).join(" · ")}`);
  });
}

console.log("\nslots, paste-ready:");
console.log(
  JSON.stringify(
    geo.times.map((t) => {
      const [from, to] = t.split(" - ");
      const mins = (s) =>
        Number(s.split(":")[0]) * 60 + Number(s.split(":")[1]);
      const pad = (s) => s.padStart(5, "0");
      return { start: pad(from), duration: mins(to) - mins(from) };
    }),
    null,
    2,
  ),
);
