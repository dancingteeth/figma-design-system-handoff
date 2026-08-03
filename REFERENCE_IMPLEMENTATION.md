# Reference implementation

This document records the production workflow behind the skill without
including any customer name, brand assets, private file keys, or customer
repository paths.

## What has been exercised

### Chunked Figma extraction

1. Root `get_metadata` for structure
2. Block-level `get_metadata`
3. Block-level `get_design_context`
4. Block-level `get_variable_defs`
5. Block-level `get_screenshot`

Large frames were split before implementation. The root response was treated
as a structural map, not as the implementation payload.

### Three-layer design-system boundary

| Layer | Responsibility |
| --- | --- |
| Foundations | Color, type, radius, spacing, state, validation, motion, and shared effects |
| Primitives | Reusable interactive recipes such as buttons, inputs, tabs, badges, banners, skeletons, and focus rings |
| Page chrome | Screen-bound layout utilities and geometry |

Repeated values were promoted into foundations or primitives. Screen-specific
geometry stayed page-specific.

### Machine-readable reconciliation

Public changes were mirrored across the surfaces declared by the adapter:

- CSS tokens and utilities
- TypeScript token helpers and allowlists
- machine-readable token JSON
- design-system documentation
- changelog and release metadata

The generic skill treats TypeScript and JSON mirrors as optional adapter fields,
but requires every declared mirror to stay synchronized.

### Codegen gaps restored manually

The workflow has been used to restore details that Figma codegen omitted:

- background blur
- drop and inner shadows
- gradient strokes
- asymmetric padding
- per-corner radii
- overflowing layers and stacking order
- image SVGs with literal fills
- typography line-height and small type values

### Bridge, state vocabulary, and drift checks

The production workflow also exercised:

- a **shadcn/v0 bridge** CSS layer mapping generated semantic classes
  (`bg-background`, `text-foreground`, `bg-primary`) to brand tokens, with the
  hard rule that importing the package without its CSS produces no visual change
- a **state + primitive vocabulary** (interaction layers, `:focus-visible`-only
  focus ring, validation fg/bg/border triples, motion) mirrored across CSS, TS,
  and machine-readable JSON
- an **offline token-drift check** comparing a saved Figma design-context dump
  against the public token JSON (overlap / only-in-Figma / only-in-repo) without
  a live MCP session
- a **pack-and-install consumer smoke** proving the npm package's public surface
  exports resolve in a throwaway consumer
- **per-screen parity docs** (`<SCREEN>_DS.md`) accumulating the Figma→token
  mapping so future screens reuse it
- **two-source provenance**: typography metrics board separate from the web-asset
  source node, with licensed fonts excluded from Figma exports

### Validation

The workflow validated a design package, built a consumer example, linted the
repository, and performed browser visual comparison against Figma screenshots.
The generic adapter exposes these as verification, build, lint/typecheck,
preview, browser, responsive, and accessibility gates.

## What this does not prove

This skill does not claim that pixels alone settle every product decision. It
does prove a disciplined bootstrap workflow for an empty design-system layer:
extract the Figma language, obtain approval for the package boundary and
public token decisions, create foundations/primitives/page chrome, implement a
reference consumer, and validate before future screens build on it.
