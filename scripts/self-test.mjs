#!/usr/bin/env node
/**
 * Offline self-test for the skill's helper scripts — no Figma MCP session
 * required. Run once after installing the skill (or in CI) to prove the
 * tooling works on this machine:
 *
 *   node scripts/self-test.mjs
 *
 * Covers:
 *   0. SKILL.md metadata.version matches latest CHANGELOG heading
 *   1. ASSETS.md still states the licensed-font hard rule
 *   2. extract-primitives.mjs   — fixture parses into every bucket
 *   3. compare-figma-to-tokens.mjs — fixture diffs against a synthetic token map
 *   4. verify-package-exports.mjs  — synthetic package surface resolves
 *
 * consumer-smoke.mjs is intentionally not run here (it packs and installs a
 * real package — run it against your design package via the adapter's
 * consumerSmokeCmd).
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptsDir, "..");
const fixture = path.join(scriptsDir, "fixtures", "sample-figma-dump.txt");

let failures = 0;
function check(label, ok, detail = "") {
  console.log(`${ok ? "ok  " : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}
function run(script, args = []) {
  return execFileSync(process.execPath, [path.join(scriptsDir, script), ...args], {
    encoding: "utf8",
  });
}

// 0. version sync: SKILL.md metadata.version ↔ latest CHANGELOG ## heading -----
const skillMd = fs.readFileSync(path.join(repoRoot, "SKILL.md"), "utf8");
const changelogMd = fs.readFileSync(path.join(repoRoot, "CHANGELOG.md"), "utf8");
const skillVersion = skillMd.match(/^\s*version:\s*"([^"]+)"/m)?.[1] ?? null;
const changelogVersion = changelogMd.match(/^##\s+(\d+\.\d+\.\d+)\b/m)?.[1] ?? null;
check(
  "version sync: SKILL.md ↔ CHANGELOG",
  Boolean(skillVersion) && skillVersion === changelogVersion,
  `skill=${skillVersion ?? "?"} changelog=${changelogVersion ?? "?"}`,
);

// 1. ASSETS.md font-drop hard rule still present --------------------------------
const assetsMd = fs.readFileSync(path.join(repoRoot, "ASSETS.md"), "utf8");
check(
  "ASSETS.md: licensed font hard rule",
  /licensed font binaries/i.test(assetsMd) &&
    /out of\s*\n?\s*scope|out of scope/i.test(assetsMd) &&
    /never from a Figma export|Do not scrape fonts from Figma|excludes.*licensed fonts/i.test(
      assetsMd,
    ),
);

// 2. extract-primitives on the fixture -------------------------------------
const extracted = JSON.parse(run("extract-primitives.mjs", [fixture]));
check(
  "extract-primitives: hex",
  ["#181f23", "#7e7e7e", "#c8e2ff", "#ff0000"].every((h) => extracted.colorsHex.includes(h)),
);
check(
  "extract-primitives: rgba",
  extracted.colorsRgba.some((c) => c.startsWith("rgba(")),
);
check("extract-primitives: radius", extracted.radius.includes("rounded-[30px]"));
check("extract-primitives: blur", extracted.blur.includes("backdrop-blur-[12px]"));
check("extract-primitives: fontSize", extracted.fontSize.includes("text-[10px]"));
check("extract-primitives: tracking", extracted.tracking.includes("tracking-[0.08em]"));
check("extract-primitives: gap", extracted.gap.includes("gap-[16px]"));

// 3. compare-figma-to-tokens: fixture vs a synthetic token map -------------
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fdsh-selftest-"));
try {
  const tokenJson = path.join(tmp, "design-tokens.json");
  fs.writeFileSync(
    tokenJson,
    JSON.stringify({
      name: "selftest",
      colors: { bg: { hex: "#181F23" }, accent: { hex: "#00AAFF" } },
    }),
  );
  const report = JSON.parse(
    run("compare-figma-to-tokens.mjs", ["--tokens", tokenJson, "--json", fixture]),
  );
  check("compare: overlap", report.overlap.includes("#181F23"));
  check(
    "compare: onlyInFigma",
    report.onlyInFigma.includes("#FF0000") && !report.onlyInFigma.includes("#181F23"),
  );
  check("compare: onlyInRepo", report.onlyInRepo.includes("#00AAFF"));

  // 4. verify-package-exports on a synthetic package -------------------------
  const pkgDir = path.join(tmp, "pkg");
  fs.mkdirSync(path.join(pkgDir, "src"), { recursive: true });
  fs.writeFileSync(path.join(pkgDir, "src", "index.js"), "export {};\n");
  fs.writeFileSync(
    path.join(pkgDir, "package.json"),
    JSON.stringify({
      name: "selftest-pkg",
      version: "0.0.0",
      type: "module",
      exports: { ".": "./src/index.js" },
    }),
  );
  const verifyOut = run("verify-package-exports.mjs", ["--pkg", pkgDir]);
  check("verify-package-exports: ok", /OK/.test(verifyOut));
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\nself-test: FAIL (${failures} check${failures === 1 ? "" : "s"})`);
  process.exit(1);
}
console.log("\nself-test: OK");
