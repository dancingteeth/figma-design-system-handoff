#!/usr/bin/env node
/**
 * Best-effort extraction of visual primitives from a Figma MCP
 * get_design_context dump. It is a discovery aid, not a Figma parser.
 *
 * Usage:
 *   node scripts/extract-primitives.mjs < dump.txt
 *   node scripts/extract-primitives.mjs dump.txt
 *   cat a.txt b.txt | node scripts/extract-primitives.mjs
 *
 * Prints JSON: { colorsHex, colorsRgba, blur, radius, fontSize, tracking, gap }
 */
import fs from "node:fs";

function readInput(argv) {
  const files = argv.slice(2).filter((a) => a !== "-");
  if (files.length > 0) {
    return files.map((f) => fs.readFileSync(f, "utf8")).join("\n");
  }
  return fs.readFileSync(0, "utf8");
}

function byPrefix(classes, prefix) {
  const needle = `${prefix}-[`;
  return [...new Set(classes.filter((c) => c.startsWith(needle)))].sort();
}

function extract(src) {
  const classes = [];
  for (const m of src.matchAll(/className="([^"]+)"/g)) {
    classes.push(...m[1].split(/\s+/).filter(Boolean));
  }
  // Also catch class= and className={'…'} lightly
  for (const m of src.matchAll(/\bclass(?:Name)?(?:=|\s*:\s*)["'`]([^"'`]+)["'`]/g)) {
    classes.push(...m[1].split(/\s+/).filter(Boolean));
  }
  // Design-context responses can contain CSS or generated class strings that
  // are not inside a simple className="..." attribute.
  for (const m of src.matchAll(
    /\b(backdrop-blur|rounded|tracking|gap|text)-\[[^\]\n]+\]/g,
  )) {
    classes.push(m[0]);
  }
  const uniq = [...new Set(classes)];

  const colorsHex = [
    ...new Set(src.match(/#[0-9a-fA-F]{3,8}\b/g) || []),
  ].sort();
  const colorsRgba = [...new Set(src.match(/rgba?\([^)]*\)/g) || [])].sort();
  const fontSize = [
    ...new Set(
      uniq.filter(
        (c) =>
          c.startsWith("text-[") &&
          /(?:px|rem|em|%|vw|vh)\]$/.test(c),
      ),
    ),
  ].sort();

  return {
    colorsHex,
    colorsRgba,
    blur: byPrefix(uniq, "backdrop-blur"),
    radius: byPrefix(uniq, "rounded"),
    fontSize,
    tracking: byPrefix(uniq, "tracking"),
    gap: byPrefix(uniq, "gap"),
  };
}

const src = readInput(process.argv);
if (!src.trim()) {
  console.error("No input. Pipe a design_context dump or pass file paths.");
  process.exit(1);
}
process.stdout.write(`${JSON.stringify(extract(src), null, 2)}\n`);
