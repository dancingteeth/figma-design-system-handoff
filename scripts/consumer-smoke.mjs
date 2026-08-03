#!/usr/bin/env node
/**
 * Consumer smoke test: pack a design package, install the tarball into a
 * throwaway consumer, and prove the public surface resolves on disk.
 *
 * Generalises the production pack-and-install gate so a bootstrap team gets
 * the Step 6 "consumer smoke" check (SKILL.md) without writing their own
 * script. It answers: "does what we ship actually install, and do the
 * published files exist?" Wire it into the adapter as `consumerSmokeCmd`:
 *
 *   consumerSmokeCmd: node <skill>/scripts/consumer-smoke.mjs --pkg <designPackageRoot>
 *
 * Usage:
 *   node scripts/consumer-smoke.mjs --pkg packages/design-system
 *   node scripts/consumer-smoke.mjs --pkg packages/design-system \
 *     --check-file src/tokens.ts --check-contains "export const"
 *
 * Options:
 *   --pkg <dir>           Package directory (default: cwd)
 *   --check-file <rel>    Optional file inside the installed package to read
 *   --check-contains <s>  Optional substring --check-file must contain
 *   --keep                Keep the temp dir for debugging
 *
 * Packing prefers pnpm (handles pnpm workspace manifests); falls back to
 * npm pack. Installing always uses npm (universal with Node).
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function parseArgs(argv) {
  const args = { pkg: process.cwd(), checkFile: null, checkContains: null, keep: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--pkg") args.pkg = argv[++i];
    else if (a === "--check-file") args.checkFile = argv[++i];
    else if (a === "--check-contains") args.checkContains = argv[++i];
    else if (a === "--keep") args.keep = true;
    else if (a === "-h" || a === "--help") {
      console.log(
        "Usage: node consumer-smoke.mjs [--pkg <dir>] [--check-file <rel> [--check-contains <s>]] [--keep]",
      );
      process.exit(0);
    }
  }
  return args;
}

function has(cmd) {
  try {
    execFileSync(cmd, ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const args = parseArgs(process.argv);
const pkgDir = path.resolve(args.pkg);
const pkgPath = path.join(pkgDir, "package.json");
if (!fs.existsSync(pkgPath)) {
  console.error(`consumer-smoke: no package.json at ${pkgPath}`);
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
if (!manifest.name) {
  console.error("consumer-smoke: package.json has no name — cannot install it into a consumer.");
  process.exit(1);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "consumer-smoke-"));
process.on("exit", () => {
  if (!args.keep) fs.rmSync(tmp, { recursive: true, force: true });
});

// --- 1. Pack -------------------------------------------------------------
const packDest = path.join(tmp, "pack-out");
fs.mkdirSync(packDest, { recursive: true });

if (has("pnpm")) {
  execFileSync("pnpm", ["pack", "--pack-destination", packDest], { cwd: pkgDir, stdio: "inherit" });
} else {
  // npm pack runs in the package dir and drops <name>-<version>.tgz there.
  const before = new Set(fs.readdirSync(pkgDir).filter((f) => f.endsWith(".tgz")));
  execFileSync("npm", ["pack"], { cwd: pkgDir, stdio: "inherit" });
  const produced = fs.readdirSync(pkgDir).filter((f) => f.endsWith(".tgz") && !before.has(f));
  if (produced.length === 0) {
    console.error("consumer-smoke: npm pack produced no .tgz");
    process.exit(1);
  }
  fs.renameSync(path.join(pkgDir, produced[0]), path.join(packDest, produced[0]));
}

const tgz = fs.readdirSync(packDest).filter((f) => f.endsWith(".tgz")).sort().pop();
if (!tgz) {
  console.error("consumer-smoke: no .tgz produced by pack");
  process.exit(1);
}
const tgzPath = path.join(packDest, tgz);

// --- 2. Install into a throwaway consumer ---------------------------------
const consumerDir = path.join(tmp, "consumer");
fs.mkdirSync(consumerDir, { recursive: true });
fs.writeFileSync(
  path.join(consumerDir, "package.json"),
  JSON.stringify(
    {
      name: "consumer-smoke",
      private: true,
      type: "module",
      dependencies: { [manifest.name]: `file:${tgzPath}` },
    },
    null,
    2,
  ),
);
execFileSync("npm", ["install", "--ignore-scripts", "--no-package-lock", "--no-audit", "--no-fund"], {
  cwd: consumerDir,
  stdio: "inherit",
});

// --- 3. Probe the installed package ---------------------------------------
const installedRoot = path.join(consumerDir, "node_modules", ...manifest.name.split("/"));
const installedPkgPath = path.join(installedRoot, "package.json");
if (!fs.existsSync(installedPkgPath)) {
  console.error(`consumer-smoke: ${manifest.name} did not install (no ${installedPkgPath})`);
  process.exit(1);
}
const installed = JSON.parse(fs.readFileSync(installedPkgPath, "utf8"));

let failed = 0;
function walkExports(label, node) {
  if (node == null) return;
  if (typeof node === "string") {
    const star = node.indexOf("*");
    const probe = star === -1 ? node : node.slice(0, star).replace(/[/\\]+$/, "");
    if (!fs.existsSync(path.join(installedRoot, probe))) {
      console.error(`MISSING  ${label} → ${node}`);
      failed++;
    }
    return;
  }
  if (Array.isArray(node)) return node.forEach((n, i) => walkExports(`${label}[${i}]`, n));
  if (typeof node === "object") {
    for (const [k, v] of Object.entries(node)) walkExports(`${label}.${k}`, v);
  }
}
walkExports("exports", installed.exports);
for (const key of ["main", "module", "types"]) {
  if (typeof installed[key] === "string" && !fs.existsSync(path.join(installedRoot, installed[key]))) {
    console.error(`MISSING  ${key} → ${installed[key]}`);
    failed++;
  }
}

if (args.checkFile) {
  const abs = path.join(installedRoot, args.checkFile);
  if (!fs.existsSync(abs)) {
    console.error(`MISSING  --check-file → ${args.checkFile}`);
    failed++;
  } else if (args.checkContains) {
    const body = fs.readFileSync(abs, "utf8");
    if (!body.includes(args.checkContains)) {
      console.error(`STALE    ${args.checkFile} does not contain ${JSON.stringify(args.checkContains)}`);
      failed++;
    }
  }
}

if (failed > 0) {
  console.error(`consumer-smoke: FAIL (${failed} problems; packed ${tgz})`);
  process.exit(1);
}
console.log(`consumer-smoke: OK (installed ${tgz}; exports resolve on disk)`);
if (args.keep) console.log(`consumer-smoke: temp dir kept at ${tmp}`);
