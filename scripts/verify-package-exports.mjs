#!/usr/bin/env node
/**
 * Package-surface check: every file referenced by package.json ("exports",
 * "main", "module", "types") exists on disk.
 *
 * Generalises the production "verify-<brand>-package" step so a bootstrap
 * team gets the Step 6 design-package verification gate (SKILL.md) without
 * writing their own script. Wire it into the adapter as `verifyCmd`:
 *
 *   verifyCmd: node <skill>/scripts/verify-package-exports.mjs --pkg <designPackageRoot>
 *
 * Usage:
 *   node scripts/verify-package-exports.mjs --pkg packages/design-system
 *   node scripts/verify-package-exports.mjs            # defaults to cwd
 *
 * Exit 0 = every declared file target resolves. Exit 1 = something is missing.
 */
import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const args = { pkg: process.cwd() };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--pkg") args.pkg = argv[++i];
    else if (argv[i] === "-h" || argv[i] === "--help") {
      console.log("Usage: node verify-package-exports.mjs [--pkg <dir>]");
      process.exit(0);
    }
  }
  return args;
}

const { pkg } = parseArgs(process.argv);
const pkgDir = path.resolve(pkg);
const pkgPath = path.join(pkgDir, "package.json");
if (!fs.existsSync(pkgPath)) {
  console.error(`verify-package-exports: no package.json at ${pkgPath}`);
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
} catch (e) {
  console.error(`verify-package-exports: could not parse ${pkgPath}: ${e.message}`);
  process.exit(1);
}

const targets = [];
const addTarget = (label, spec) => {
  if (typeof spec === "string" && spec.trim()) targets.push({ label, target: spec });
};

// exports can be: string | { import/require/default/types/... } | nested
// conditions | arrays. Walk it and collect every string leaf.
function walkExports(label, node) {
  if (node == null) return;
  if (typeof node === "string") return addTarget(label, node);
  if (Array.isArray(node)) return node.forEach((n, i) => walkExports(`${label}[${i}]`, n));
  if (typeof node === "object") {
    for (const [k, v] of Object.entries(node)) walkExports(`${label}.${k}`, v);
  }
}
walkExports("exports", manifest.exports);
addTarget("main", manifest.main);
addTarget("module", manifest.module);
addTarget("types", manifest.types);

if (targets.length === 0) {
  console.error(
    "verify-package-exports: no exports/main/module/types declared — nothing to check. " +
      "Declare the public surface in package.json first.",
  );
  process.exit(1);
}

let failed = 0;
for (const { label, target } of targets) {
  // Wildcard targets ("./dist/*") can't be stat'ed directly — check the
  // static prefix directory exists instead.
  const star = target.indexOf("*");
  const probe = star === -1 ? target : target.slice(0, star).replace(/[/\\]+$/, "");
  const abs = path.join(pkgDir, probe);
  if (!fs.existsSync(abs)) {
    console.error(`MISSING  ${label} → ${target}`);
    failed++;
  }
}

if (failed > 0) {
  console.error(`verify-package-exports: FAIL (${failed} of ${targets.length} targets missing in ${pkgDir})`);
  process.exit(1);
}
console.log(
  `verify-package-exports: OK (${targets.length} file targets in ${manifest.name ?? pkgDir})`,
);
