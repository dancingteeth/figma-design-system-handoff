#!/usr/bin/env node
/**
 * Offline token-drift check: compare a saved Figma MCP get_design_context dump
 * against the project's machine-readable token map (tokenJson).
 *
 * Generalises the production "compare-figma-codegen-to-tokens" workflow so a
 * team can verify that Figma output still matches (or extends) the public token
 * set without keeping a long agent chat. It is the reconcile-side companion to
 * extract-primitives.mjs (which parses a dump; this one diffs it against tokens).
 *
 * Usage:
 *   node scripts/compare-figma-to-tokens.mjs --tokens design-tokens.json < dump.txt
 *   node scripts/compare-figma-to-tokens.mjs --tokens design-tokens.json dump.txt
 *   cat a.txt b.txt | node scripts/compare-figma-to-tokens.mjs --tokens design-tokens.json
 *
 * Options:
 *   --tokens <path>   Required. Path to the project tokenJson.
 *   --subset <key>    Optional. Only report on hex found under this top-level
 *                     key (e.g. "states", "colors", "validation").
 *   --json            Emit machine-readable JSON instead of the human report.
 *
 * Prints: overlap, onlyInFigma (candidate new tokens), onlyInRepo.
 */
import fs from "node:fs";

function parseArgs(argv) {
  const args = { tokens: null, subset: null, json: false, files: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--tokens") args.tokens = argv[++i];
    else if (a === "--subset") args.subset = argv[++i];
    else if (a === "--json") args.json = true;
    else if (a !== "-") args.files.push(a);
  }
  return args;
}

function readDump(files) {
  if (files.length > 0) return files.map((f) => fs.readFileSync(f, "utf8")).join("\n");
  return fs.readFileSync(0, "utf8");
}

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;

// Normalize to 6-digit uppercase, dropping alpha for match purposes.
function normalizeHex(h) {
  let s = h.slice(1);
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  if (s.length === 8) s = s.slice(0, 6);
  return `#${s.toUpperCase()}`;
}

function hexFromDump(src) {
  return [...new Set((src.match(HEX_RE) || []).map(normalizeHex))].sort();
}

function collectHexFromJson(obj, subset) {
  const acc = new Set();
  function walk(value) {
    if (value == null) return;
    if (typeof value === "string") {
      for (const m of value.matchAll(HEX_RE)) acc.add(normalizeHex(m[0]));
    } else if (Array.isArray(value)) {
      for (const v of value) walk(v);
    } else if (typeof value === "object") {
      for (const v of Object.values(value)) walk(v);
    }
  }
  walk(subset ? (obj[subset] ?? {}) : obj);
  return [...acc].sort();
}

const args = parseArgs(process.argv);
if (!args.tokens) {
  console.error("Missing --tokens <path>. Point at the project tokenJson.");
  process.exit(1);
}
let tokenObj;
try {
  tokenObj = JSON.parse(fs.readFileSync(args.tokens, "utf8"));
} catch (e) {
  console.error(`Could not read/parse tokens at ${args.tokens}: ${e.message}`);
  process.exit(1);
}
const dump = readDump(args.files);
if (!dump.trim()) {
  console.error("No Figma dump input. Pipe a get_design_context dump or pass file paths.");
  process.exit(1);
}

const figmaHex = hexFromDump(dump);
const repoHex = collectHexFromJson(tokenObj, args.subset);
const overlap = figmaHex.filter((h) => repoHex.includes(h));
const onlyInFigma = figmaHex.filter((h) => !repoHex.includes(h));
const onlyInRepo = repoHex.filter((h) => !figmaHex.includes(h));

const report = {
  subset: args.subset || null,
  figmaHexCount: figmaHex.length,
  repoHexCount: repoHex.length,
  overlap,
  onlyInFigma,
  onlyInRepo,
};

if (args.json) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  const line = (label, arr) =>
    `  ${label} (${arr.length}): ${arr.length ? arr.join(", ") : "—"}`;
  process.stdout.write(
    [
      `Token drift report${args.subset ? ` (subset: ${args.subset})` : ""}`,
      line("overlap", overlap),
      line("only in Figma → candidate new tokens", onlyInFigma),
      line("only in repo → not in this Figma slice", onlyInRepo),
      "",
    ].join("\n"),
  );
}
