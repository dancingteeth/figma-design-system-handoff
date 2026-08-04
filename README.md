# figma-design-system-handoff

Agent skill for turning **any** Figma web/app frame (via **Figma MCP**) into a
maintainable design system and working UI — tokens, primitives, page chrome —
instead of pasting raw codegen.

Brand-agnostic. Point it at a customer Figma file with or without an existing
design package by filling [ADAPTER.md](./ADAPTER.md).

## Who it's for

- **Designers** handed a finished Figma file by a PM, frontend engineer, or
  founder and asked to "turn this into a working design system." The skill
  drives the extraction; you approve naming and packaging decisions. No dev
  background assumed — start at [SETUP.md](./SETUP.md).
- **Engineers** wiring a Figma frame into tokens + components with pixel
  parity, or refreshing the package after the Figma changed.

## The problem

Figma MCP / codegen agents fail in predictable ways:

1. **One-shot root calls truncate** on large frames and silently drop Layer Effects, variables, and gradient-stroke detail.
2. **Generated screens become the architecture** — giant `FigmaMainScreen.tsx`, expiring asset URLs, no tokens.
3. **Parity gaps** hide in asymmetric padding, per-corner radii, and effects codegen never emits.

## What it does

| Step | Focus |
| --- | --- |
| **0** | Parse Figma URL; resolve adapter (token paths, commands, semver) |
| **1** | Chunked MCP: metadata → per-block context + variables + screenshot |
| **2** | Exact measurements checklist → token-diff JSON |
| **3–4** | Create or update foundations / primitives / page chrome |
| **5** | Localize assets; no MCP localhost URLs |
| **6–7** | Verify / build / visual diff / release readiness |

The full rubric lives in [`SKILL.md`](./SKILL.md). Bootstrap mode is in
[`BOOTSTRAP.md`](./BOOTSTRAP.md). Paste-ready prompts:
[`PROMPT_PACK.md`](./PROMPT_PACK.md). Measurements:
[`MEASUREMENTS_CHECKLIST.md`](./MEASUREMENTS_CHECKLIST.md). Assets:
[`ASSETS.md`](./ASSETS.md). State + primitive vocabulary:
[`STATES.md`](./STATES.md). Token JSON contract:
[`TOKEN_JSON.md`](./TOKEN_JSON.md). Optional Node helpers:
[`scripts/extract-primitives.mjs`](./scripts/extract-primitives.mjs) (parse a
dump), [`scripts/compare-figma-to-tokens.mjs`](./scripts/compare-figma-to-tokens.mjs)
(diff a dump against the token JSON),
[`scripts/verify-package-exports.mjs`](./scripts/verify-package-exports.mjs) and
[`scripts/consumer-smoke.mjs`](./scripts/consumer-smoke.mjs) (Step 6 release
gates), plus [`scripts/self-test.mjs`](./scripts/self-test.mjs) to prove the
helpers work offline. Proven reference:
[`REFERENCE_IMPLEMENTATION.md`](./REFERENCE_IMPLEMENTATION.md).

## Install

```bash
npx skills add dancingteeth/figma-design-system-handoff
```

After a GitHub release, refresh:

```bash
npx skills check
npx skills update figma-design-system-handoff
```

New to agents or Figma MCP? [SETUP.md](./SETUP.md) is the designer-facing
one-time setup (agent, Figma MCP, Node) — no dev background assumed.

Or copy these files into your agent skills directory (keep relative links intact):

- `SKILL.md`
- `SETUP.md`
- `ADAPTER.md`
- `BOOTSTRAP.md`
- `PROMPT_PACK.md`
- `MEASUREMENTS_CHECKLIST.md`
- `ASSETS.md`
- `STATES.md`
- `TOKEN_JSON.md`
- `REFERENCE_IMPLEMENTATION.md`
- `SOURCES.md`
- `scripts/extract-primitives.mjs`
- `scripts/compare-figma-to-tokens.mjs`
- `scripts/verify-package-exports.mjs`
- `scripts/consumer-smoke.mjs`
- `scripts/self-test.mjs`
- `scripts/fixtures/sample-figma-dump.txt`

Examples: `~/.cursor/skills/figma-design-system-handoff/`, `.agents/skills/figma-design-system-handoff/`, `.claude/skills/figma-design-system-handoff/`.

Changelog: [`CHANGELOG.md`](./CHANGELOG.md).

## Customer / brand overlay

This repo is the **methodology**. For a specific brand:

1. Install this skill.
2. Add a thin project skill or `AGENTS.md` section that fills [ADAPTER.md](./ADAPTER.md) (file key defaults, CSS/TS paths, verify commands).
3. Optionally keep a brand npm package skill that *links* here for steps 1–2 and supplies paths for 3–7. If the brand ships the skill from its npm package, consumers can symlink it into their agent skills directory so it stays in sync on `pnpm up`/`npm update`:
   ```bash
   mkdir -p .cursor/skills && ln -s ../../node_modules/<brand-pkg>/skills/<skill> .cursor/skills/<skill>
   mkdir -p .claude/skills && ln -s ../../node_modules/<brand-pkg>/skills/<skill> .claude/skills/<skill>
   ```

Do not fork the whole skill per customer — fork the adapter.

## Bootstrap and integration modes

**Bootstrap mode** starts with a Figma board and optional v0/prototype output.
It creates a small design package, builds one reference consumer, and promotes
only proven repeated patterns. This is the primary path when no frontend
design system exists.

**Integration mode** maps the same workflow onto an existing design package.
Choose it only when canonical token and component paths already exist.

Neither mode treats generated v0 code as the architecture. See
[`BOOTSTRAP.md`](./BOOTSTRAP.md) for the complete creation sequence.

For best extraction quality, prefer Figma frames with **Auto Layout** on major
sections and **Components/variants** for repeated controls — designer checklist
in [`SETUP.md`](./SETUP.md#prepare-the-figma-file). Freeform artboards still
work; layout semantics will be weaker.

For responsive work, supply all required Figma target frames or variable modes
in the adapter. A single static frame cannot prove mobile behavior,
interaction states, accessibility, or production parity.

A live Community / worked-example token package is intentionally deferred until
a Figma plan with MCP access is available. Offline helpers
(`scripts/self-test.mjs`) still validate without MCP.

Adjacent but out of scope: applying finished tokens to **pre-existing HTML
exports** (branded standalone pages, audits, marketing exports) is a companion
workflow that pairs with this skill but is not part of it.

## Tested with (author dogfood)

| Host | Notes |
| ---- | ----- |
| Cursor + Figma MCP | Chunked discovery + Tailwind/React consumers |
| Claude Code / Codex | Symlink or `npx skills add` |

Observed use, not a certification matrix. Weaker models should stay strict on the truncation guard and the four-block output template.

## If it helped

Star the repo — cheap signal this is worth keeping public.

Better: open a short GitHub issue with one catch (e.g. “truncation guard forced a split”, “restored background blur token”).

Optional tip: [Ko-fi](https://ko-fi.com/dancingteeth). More agent tooling: [Vibing Agents](https://agents.dancingteeth.net).
