# figma-design-system-handoff

Agent skill for turning **any** Figma web/app frame (via **Figma MCP**) into a
maintainable design system and working UI — tokens, primitives, page chrome —
instead of pasting raw codegen.

Brand-agnostic. Point it at a customer Figma file with or without an existing
design package by filling [ADAPTER.md](./skills/figma-design-system-handoff/ADAPTER.md).

Also packaged as an [Agent Plugin](https://agent-plugins.org/) (`plugin.json` + `skills/`). Figma MCP stays client-configured (auth is not portable in Agent Plugins 1.0.0).

## Who it's for

- **Designers** handed a finished Figma file by a PM, frontend engineer, or
  founder and asked to "turn this into a working design system." The skill
  drives the extraction; you approve naming and packaging decisions. No dev
  background assumed — start at [SETUP.md](./skills/figma-design-system-handoff/SETUP.md).
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

The full rubric lives in [`SKILL.md`](./skills/figma-design-system-handoff/SKILL.md). Bootstrap mode is in
[`BOOTSTRAP.md`](./skills/figma-design-system-handoff/BOOTSTRAP.md). Paste-ready prompts:
[`PROMPT_PACK.md`](./skills/figma-design-system-handoff/PROMPT_PACK.md). Measurements:
[`MEASUREMENTS_CHECKLIST.md`](./skills/figma-design-system-handoff/MEASUREMENTS_CHECKLIST.md). Assets:
[`ASSETS.md`](./skills/figma-design-system-handoff/ASSETS.md). State + primitive vocabulary:
[`STATES.md`](./skills/figma-design-system-handoff/STATES.md). Token JSON contract:
[`TOKEN_JSON.md`](./skills/figma-design-system-handoff/TOKEN_JSON.md). Optional Node helpers:
[`scripts/extract-primitives.mjs`](./skills/figma-design-system-handoff/scripts/extract-primitives.mjs) (parse a
dump), [`scripts/compare-figma-to-tokens.mjs`](./skills/figma-design-system-handoff/scripts/compare-figma-to-tokens.mjs)
(diff a dump against the token JSON),
[`scripts/verify-package-exports.mjs`](./skills/figma-design-system-handoff/scripts/verify-package-exports.mjs) and
[`scripts/consumer-smoke.mjs`](./skills/figma-design-system-handoff/scripts/consumer-smoke.mjs) (Step 6 release
gates), plus [`scripts/self-test.mjs`](./skills/figma-design-system-handoff/scripts/self-test.mjs) to prove the
helpers work offline. Proven reference:
[`REFERENCE_IMPLEMENTATION.md`](./skills/figma-design-system-handoff/REFERENCE_IMPLEMENTATION.md).

## Install

```bash
npx skills add dancingteeth/figma-design-system-handoff
```

After a GitHub release, refresh:

```bash
npx skills check
npx skills update figma-design-system-handoff
```

New to agents or Figma MCP? [SETUP.md](./skills/figma-design-system-handoff/SETUP.md) is the designer-facing
one-time setup (agent, Figma MCP, Node) — no dev background assumed.

**Plan limit:** live Figma MCP usually needs a paid Dev Mode seat. Without it,
inventory against a live file will not work — offline helpers
([`scripts/self-test.mjs`](./skills/figma-design-system-handoff/scripts/self-test.mjs) and saved design-context
dumps) still run.

Or copy the `skills/figma-design-system-handoff/` directory into your agent
skills directory (keep the folder intact so relative links and `scripts/` work).

Examples: `~/.cursor/skills/figma-design-system-handoff/`, `.agents/skills/figma-design-system-handoff/`, `.claude/skills/figma-design-system-handoff/`.

Clients that load [Agent Plugins](https://agent-plugins.org/) can use the repo root (`plugin.json` + `skills/`) as the plugin package.

Changelog: [`CHANGELOG.md`](./CHANGELOG.md).

## Customer / brand overlay

This repo is the **methodology**. For a specific brand:

1. Install this skill.
2. Add a thin project skill or `AGENTS.md` section that fills [ADAPTER.md](./skills/figma-design-system-handoff/ADAPTER.md) (file key defaults, CSS/TS paths, verify commands).
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
[`BOOTSTRAP.md`](./skills/figma-design-system-handoff/BOOTSTRAP.md) for the complete creation sequence.

For best extraction quality, prefer Figma frames with **Auto Layout** on major
sections and **Components/variants** for repeated controls — designer checklist
in [`SETUP.md`](./skills/figma-design-system-handoff/SETUP.md#prepare-the-figma-file). Freeform artboards still
work; layout semantics will be weaker.

For responsive work, supply all required Figma target frames or variable modes
in the adapter. A single static frame cannot prove mobile behavior,
interaction states, accessibility, or production parity.

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
