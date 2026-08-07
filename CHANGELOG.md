# Changelog

Versions match `metadata.version` in [`SKILL.md`](./skills/figma-design-system-handoff/SKILL.md) and `plugin.json`.

## 1.0.2 — 2026-08-08

- **Agent Plugins packaging:** add root [`plugin.json`](./plugin.json) and move the skill payload to [`skills/figma-design-system-handoff/`](./skills/figma-design-system-handoff/) (docs + `scripts/`). `npx skills add` discovery unchanged. Figma MCP remains client-configured (no `mcp.json` — auth is not portable in Agent Plugins 1.0.0).
- `scripts/self-test.mjs` also asserts `SKILL.md` ↔ `plugin.json` version sync.
- No workflow rubric changes.

## 1.0.1 — 2026-08-04

Feedback + designer readiness polish:

- Shorten the skill description for better trigger matching.
- Document that Figma MCP tool names vary by server; map to structure /
  design-context / variables / screenshot roles.
- Drop the undefined Plugin API (`use_figma`) promise — mark unread variable
  modes as **unverified** instead.
- Promote the licensed-font hard rule in [`ASSETS.md`](./skills/figma-design-system-handoff/ASSETS.md).
- Add designer guidance for **Auto Layout + Components** in
  [`SETUP.md`](./skills/figma-design-system-handoff/SETUP.md#prepare-the-figma-file), with agent checks in
  prerequisites / Step 0 / [`BOOTSTRAP.md`](./skills/figma-design-system-handoff/BOOTSTRAP.md).
- `scripts/self-test.mjs` asserts SKILL↔CHANGELOG version sync and that the
  font-drop rule remains present in ASSETS.md.
- Note that live Figma MCP usually needs a paid Dev Mode seat; offline helpers
  still run without it.

## 1.0.0 — 2026-08-03

Initial public release of the brand-agnostic Figma MCP → design-system
handoff skill.

### Workflow

- Bootstrap or update a design system from a raw Figma board.
- Chunked MCP discovery: root metadata, block context, variables, and
  screenshots with a truncation guard.
- Exact measurements for layout, typography, styles, effects, responsive
  targets, and interaction states.
- Foundations / primitives / page-chrome layering.
- Optional shadcn/v0 bridge and portable state vocabulary.
- First reference consumer as the design-system integration test.
- Asset localization, registration, and SVG `<img>` safety rules.
- Per-screen parity documentation for future screens.

### Validation

- Primitive extraction helper.
- Figma-dump versus token-JSON drift comparison.
- Package export verification.
- Pack-and-install consumer smoke test.
- Offline self-test fixtures.
- Build, lint/typecheck, browser, visual, responsive, and accessibility gates.

### Supporting docs

- [`SETUP.md`](./skills/figma-design-system-handoff/SETUP.md) — designer-facing onboarding.
- [`ADAPTER.md`](./skills/figma-design-system-handoff/ADAPTER.md) — bootstrap/integration project contract.
- [`BOOTSTRAP.md`](./skills/figma-design-system-handoff/BOOTSTRAP.md) — raw Figma → first design package.
- [`STATES.md`](./skills/figma-design-system-handoff/STATES.md) — state and primitive vocabulary.
- [`TOKEN_JSON.md`](./skills/figma-design-system-handoff/TOKEN_JSON.md) — machine-readable token contract.
