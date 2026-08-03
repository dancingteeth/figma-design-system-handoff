# Changelog

Versions match `metadata.version` in [`SKILL.md`](./SKILL.md).

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

- [`SETUP.md`](./SETUP.md) — designer-facing onboarding.
- [`ADAPTER.md`](./ADAPTER.md) — bootstrap/integration project contract.
- [`BOOTSTRAP.md`](./BOOTSTRAP.md) — raw Figma → first design package.
- [`STATES.md`](./STATES.md) — state and primitive vocabulary.
- [`TOKEN_JSON.md`](./TOKEN_JSON.md) — machine-readable token contract.
