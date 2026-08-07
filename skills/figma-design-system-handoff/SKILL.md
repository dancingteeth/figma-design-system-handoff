---
name: figma-design-system-handoff
description: >-
  Create or update a design system from a Figma web/app frame via Figma MCP —
  chunked discovery, measurements, tokens, primitives, and a reference screen
  instead of raw codegen. Use for Figma→tokens handoff, pixel parity,
  design-token diff, or bootstrap when no design system exists.
license: MIT
metadata:
  author: dancingteeth
  version: "1.0.2"
---

# Figma → Design-System Handoff

Turn a Figma frame into a small **design system and exact-copy UI** (CSS
variables / Tailwind utilities / token JSON / TS mirrors) — not a giant
generated artboard.

**Brand-agnostic.** Resolve the project adapter first ([ADAPTER.md](./ADAPTER.md)). If the project has no design system, use the bootstrap path in [BOOTSTRAP.md](./BOOTSTRAP.md). Sibling docs load on demand: [PROMPT_PACK.md](./PROMPT_PACK.md), [MEASUREMENTS_CHECKLIST.md](./MEASUREMENTS_CHECKLIST.md), [ASSETS.md](./ASSETS.md), [STATES.md](./STATES.md), [TOKEN_JSON.md](./TOKEN_JSON.md). Provenance: [SOURCES.md](./SOURCES.md).

## Primary use case: bootstrap from Figma

This workflow can start with only a Figma board and optional v0 or other
prototype output. It extracts the design language, creates a small design
package, promotes repeated values into foundations and primitives, then uses a
first reference screen to validate the system before more product work builds
on it.

An existing design system is an optional adapter mode, not a prerequisite.
Prototype code is visual evidence and content context; it is not automatically
the architecture or token source of truth.

## When to use

- Designer/PM pastes a Figma URL and wants it wired into tokens + components.
- Engineer needs inventory → measurements → reconcile → apply for a new screen.
- Refreshing exported binaries (icons, logos, glows) with registry/traceability.
- Avoiding raw MCP/codegen dumps as the final architecture.

**Not this skill:** pure structure cleanup, backend work, or “redesign freely” without Figma parity. If the task is only one-off markup with no design system, prefer a generic implement-design flow — still use **chunked MCP** from this skill when nodes are large.

## Prerequisites

- Figma MCP connected (remote: pass `fileKey`; desktop: open file, omit `fileKey`).
- A Figma URL or `fileKey` + `nodeId` (from `?node-id=A-B` → `A:B`).
- A design system to reconcile against — or willingness to bootstrap one via the adapter.
- Node.js (current LTS) for the optional `scripts/*.mjs` helpers.
- Prefer Figma frames built with **Auto Layout** and **Components/variants** —
  freeform absolute artboards still work, but spacing/sizing semantics are weaker
  and more values stay page-chrome one-offs. Designer checklist:
  [SETUP.md](./SETUP.md#prepare-the-figma-file).

First time setting up an agent + Figma MCP, or the requester is a designer
without a dev environment? [SETUP.md](./SETUP.md) is the no-code-assumed
walkthrough — hand it over before starting Step 0.

**Figma MCP tool names vary by server.** Before Step 1, list the tools your MCP
exposes and map them to these roles (examples in parentheses are common, not
universal):

| Role | Purpose | Common names |
| --- | --- | --- |
| Structure | Cheap node tree / metadata | `get_metadata` |
| Design context | Layout + tokens + reference codegen | `get_design_context` |
| Variables | Bound Figma variable defs | `get_variable_defs` |
| Screenshot | Visual ground truth | `get_screenshot` |

Use whatever your server actually provides for each role. If a role is missing,
mark that coverage **unverified** and continue with the tools you have.

## Workflow — 8 steps (do not skip)

Copy into your reply and tick as you go:

```
- [ ] Step 0  — Parse URL + choose bootstrap or integration mode
- [ ] Step 1a — get_metadata(root) → enumerate blocks
- [ ] Step 1b — per-block: structure + design context + variables + screenshot
- [ ] Step 1c — parse design context for unique primitive values
- [ ] Step 1d — strict per-block JSON, then screen aggregate
- [ ] Step 1e — responsive/state/style inventory across target frames
- [ ] Step 2  — Measurements (Prompt 2 + MEASUREMENTS_CHECKLIST.md)
- [ ] Step 3  — Reconcile plan (Prompt 3) into the design package
- [ ] Step 4  — Apply edits — create/update CSS / TS / JSON mirrors
- [ ] Step 5  — Refresh assets (ASSETS.md)
- [ ] Step 6  — Validate (verify / build / lint / visual diff / consumer smoke)
- [ ] Step 7  — Release notes + four-block summary
```

Paste-ready prompts: [PROMPT_PACK.md](./PROMPT_PACK.md).

### Step 0 — Input + adapter

1. Parse Figma URL: `https://www.figma.com/design/:fileKey/:name?node-id=A-B` → `fileKey`, node `A:B`.
2. Resolve [ADAPTER.md](./ADAPTER.md). Choose:
   - **Bootstrap mode** when no canonical tokens/package exist.
   - **Integration mode** when a design system already exists.
3. Confirm stack hints (React/Vue/Svelte, Tailwind v3/v4, CSS modules, etc.) — codegen language should match the consumer.
4. In bootstrap mode, record the proposed package root, consumer app root,
   token prefix, target frames, and release owner before creating files.
5. Quick Figma readiness check (ask the designer if unclear): major stacks use
   Auto Layout; repeated controls are Components with variants for hover /
   pressed / disabled when those states exist. If the file is mostly freeform
   absolute positioning, warn that HUG/FILL/gap semantics will be incomplete and
   more values will land as page chrome — see [SETUP.md](./SETUP.md#prepare-the-figma-file).

### Step 1 — Chunked MCP discovery (STRICT)

> **Hard rule.** Large frames truncate on a single `get_design_context`. Codegen also **drops** Layer Effects, many variable bindings, and flattens gradient strokes. **Always** chunk block-by-block. Root call = structure only.

#### 1a. Cheap structure pass

```
get_metadata(fileKey, rootNodeId)
```

Enumerate **top-level blocks** (nav/sidebar, hero/header, cards, tables, footers, glow layers, …). If metadata is huge, descend one level — do not paste the full tree as evidence.

#### 1b. Four-role pass per block

For each block (parallel when possible), call your MCP's tools for the four
roles above — structure, design context, variables, screenshot.

**Truncation guard:** if design-context output is ~600+ lines or marked truncated → abort and split into children. Never implement from sparse root metadata alone.

Omit `fileKey` on Figma desktop MCP variants that use the open file.

> **Token export — fidelity limits.** Design-context / variable tools can resolve
> only the **default mode**, and some servers restrict Variables access by plan.
> Capture every available mode (see `MEASUREMENTS_CHECKLIST.md` §12). If modes or
> aliased values cannot be read, mark them **unverified** in the inventory and
> continue — do not invent mode values or promise a Plugin API path this skill
> does not ship.

#### 1c. Parse — do not eyeball

Extract unique primitives from each design-context dump (hex, rgba, arbitrary Tailwind like `rounded-[30px]`, `text-[10px]`, blur, gap, tracking). Merge per-block → screen-level sets.

Preferred: run [`scripts/extract-primitives.mjs`](./scripts/extract-primitives.mjs) on each dump (Node). Agents may also extract in-process with the same regexes — avoid inventing values by skimming JSX.

#### 1d. Strict per-block contract

```json
{
  "source": {
    "figmaFileKey": "<fileKey>",
    "figmaNodeId": "<blockNodeId>",
    "figmaNodeName": "<blockName>",
    "rootNodeId": "<screenRootNodeId>"
  },
  "boundVariables": [
    { "name": "<Figma variable>", "value": "<resolved>" }
  ],
  "primitives": {
    "colorsHex": [],
    "colorsRgba": [],
    "blur": [],
    "radius": [],
    "fontSize": [],
    "tracking": [],
    "gap": []
  },
  "components": [
    {
      "nodeId": "<…>",
      "name": "<…>",
      "componentKey": "<…>",
      "componentSetKey": "<… or null>",
      "variantProps": {},
      "instanceOverrides": []
    }
  ],
  "textStyles": [
    {
      "nodeId": "<…>",
      "styleRef": "<… or null>",
      "fontFamily": "<…>",
      "fontSize": "<…>",
      "lineHeight": "<…>"
    }
  ],
  "effectStyles": [
    {
      "nodeId": "<…>",
      "styleRef": "<… or null>",
      "effects": []
    }
  ],
  "missingInDesignSystem": ["<value or role with no token yet>"]
}
```

Aggregate one **screen-level** object after all blocks. Group inventory as:

- **Generic primitives** — reusable across screens
- **Page chrome** — screen-bound geometry
- **Missing in design system** — gaps to fill in Step 3–4

#### 1e. Responsive, state, and style inventory

Do not treat one desktop frame as the whole design. For every supplied target frame or Figma variable mode, record:

- viewport/frame width and height
- layout mode, breakpoint/mode name, and safe-area assumptions
- what changes between frames: visibility, order, sizing, spacing, typography, overflow, and asset treatment
- component states visible in the file: default, hover, pressed, selected, focus, disabled, loading, and validation
- text style and effect style references that recur across blocks

If only one frame exists, state that responsive and unshown interactive behavior is **unverified**. Do not infer it from arbitrary CSS breakpoints.

### Step 2 — Measurements (1:1 parity)

Run every measurable property through [MEASUREMENTS_CHECKLIST.md](./MEASUREMENTS_CHECKLIST.md). Emit:

```json
{
  "measurements": [
    {
      "tokenCandidate": "--…",
      "figmaNodeId": "…",
      "figmaNodeName": "…",
      "property": "width|height|padding-top|…",
      "figmaValue": "…",
      "currentTokenValue": "… or null",
      "currentTokenName": "… or null",
      "layer": "system|<screen>-page"
    }
  ]
}
```

`layer`: `system` (foundations/primitives) or `<screen>-page` (page chrome). Do **not** collapse asymmetric paddings, per-corner radii, or multi-shadow stacks.

### Step 3 — Reconcile plan

Against adapter paths, or the proposed bootstrap package, using the rules in
[BOOTSTRAP.md](./BOOTSTRAP.md). Rules:

1. Reusable → foundations or primitives.
2. Screen-only → page chrome utilities (`{prefix}-cmp-{screen}-*` or the repo’s existing convention).
3. Never hardcode design-system values in app/UI packages when a token exists.
4. Preserve public names; renames are major.
5. **Restore what codegen drops:**
   - Drop / inner shadows → shadow tokens or explicit `box-shadow`
   - Background blur → `backdrop-filter`
   - Gradient strokes → often a `::before` ring + mask (codegen flattens to rgba)
6. Prefer page chrome when unsure whether a value is reusable; promote later.
7. Preserve the product's semantic and accessibility contract: real headings, landmarks, labels, buttons/links, keyboard focus, meaningful image alt text, and no nested interactive elements.
8. Separate data-driven behavior from decorative Figma layers. Do not encode a static frame as a fixed-height canvas unless the product explicitly requires a prototype.
9. **Bridge generated semantic classes.** When the consumer uses shadcn/v0/Radix codegen (`bg-background`, `text-foreground`, `bg-primary`, `border-border`), map those semantic names to brand tokens via a `bridgeCss` layer. Generated components resolve to the brand system only when the bridge CSS is loaded — importing the package without its CSS produces no visual change.
10. **Use the state + primitive vocabulary** in [STATES.md](./STATES.md): interaction layers, `:focus-visible`-only focus rings, validation fg/bg/border triples, motion, and primitive utilities. Mirror every state token in `foundationsCss`, `tokenTs`, and `tokenJson`.

Plan must list: added / updated / deprecated tokens, utility changes, TS/JSON mirror updates, risk (breaking vs not), recommended semver.

### Step 4 — Apply

In bootstrap mode, create the smallest package that can support the first
validated screen:

- foundations CSS: tokens, type scale, shared gradients/effects, **state tokens**
- primitives CSS: reusable controls and state recipes ([STATES.md](./STATES.md))
- page/component CSS: screen-bound geometry only
- bridge CSS (if the consumer uses shadcn/v0/Radix): semantic names → brand tokens
- Tailwind v4 `@source` pointing at the package `src/` so dynamic `@utility` classes survive production tree-shaking
- TypeScript token helpers where the consumer needs them
- machine-readable token JSON ([TOKEN_JSON.md](./TOKEN_JSON.md)) + optional schema
- agent/design-system authoring docs
- a per-screen `<SCREEN>_DS.md` parity doc recording the Figma→token mapping for the reference screen

In integration mode, touch **all mirrors** the adapter declares. In both modes,
treat reference codegen as **reference only** — rebuild into maintainable
component boundaries.

### Step 5 — Assets

Follow [ASSETS.md](./ASSETS.md): localize binaries, no expiring MCP URLs in final code, literal hex in SVGs used as `<img>`, register with `figmaNodeId` when possible.

### Step 6 — Validate

Run every adapter command that exists:

1. design-package verification
2. consumer build
3. lint/typecheck
4. browser preview or equivalent render
5. visual comparison against the captured Figma screenshots
6. required target viewport sizes and modes
7. keyboard/focus and basic semantic/accessibility checks
8. consumer smoke — pack the design package and install it into a throwaway consumer to prove the public surface exports resolve

**Accessibility audit — gate 7 is checklist-driven, not "basic checks":**
- Contrast passes WCAG 2.x AA on normal-size text, including the disabled/hover/validation triples in [STATES.md](./STATES.md).
- `:focus-visible` ring visible on every interactive control; nothing focusable-but-invisible.
- Logical tab order and a keyboard-only pass for every action; no nested interactive elements.
- Real landmarks and heading hierarchy, labels/aria, and meaningful alt text on meaningful images.

Record each item pass/fail in the release summary — never report "accessible" without the checklist.

Optionally run [`scripts/compare-figma-to-tokens.mjs`](./scripts/compare-figma-to-tokens.mjs) on a saved Figma dump to confirm the public token set still covers Figma (overlap / only-in-Figma candidates / only-in-repo) without a live MCP session.

Starter implementations ship for gates 1 and 8:
[`scripts/verify-package-exports.mjs`](./scripts/verify-package-exports.mjs)
(every `exports` / `main` / `types` target in the package resolves on disk) and
[`scripts/consumer-smoke.mjs`](./scripts/consumer-smoke.mjs) (pack → install
into a throwaway consumer → probe the installed surface). Point the adapter
`verifyCmd` / `consumerSmokeCmd` at them, or replace with project equivalents.
`node scripts/self-test.mjs` proves all helpers work offline right after
install — no Figma session needed.

In bootstrap mode, the first consumer screen is a required design-system
smoke test: it must consume the new package rather than duplicate its values.
If a command cannot run, record the exact blocker and mark that gate
**unverified**; never report parity as complete. If parity fails, re-check
paddings → radii → effects → type line-height units → HUG/FILL (see checklist
quality gates).

### Step 7 — Release + summary

Follow adapter `releaseFlow` + `semverPolicy`. Keep the per-screen `<SCREEN>_DS.md` parity doc (started in Step 4) in the package so future screens reuse the mapping instead of re-deriving it. Return the four-block template below.

## Output format

```markdown
## Adapter
- brand / tokenPrefix:
- figmaFileKey / rootNodeId / screen:
- mode (bootstrap | integration):
- foundations / primitives / pageChrome paths:
- verify / build / preview commands:
- target viewports / modes and unverified states:

## Figma Inventory
- Primitives:
- Page chrome:
- Missing in design system:

## Figma → Token Diff Table
| Figma node | Property | Figma value | Token | Status |
| --- | --- | --- | --- | --- |
| … | … | … | … | added\|updated\|unchanged\|gap |

## Applied File Changes
- …

## Release Readiness
- verify / build / lint / visual diff / responsive / accessibility:
- Recommended semver:
```

## Anti-patterns

- One-shot `get_design_context` on a large root; implementing from truncated/sparse output.
- Pasting a giant `FigmaMainScreen.tsx` as final architecture.
- Shipping temporary/localhost MCP asset URLs.
- Hardcoding brand hex/radii/shadows in UI when tokens exist (or should).
- Promoting page-only geometry into foundations too early.
- Ignoring layer effects / asymmetric padding / per-corner radii.
- SVGs as `<img>` with `var(--…)` fills (silent empty color).
- Claiming visual parity without a screenshot diff.
- Claiming responsive or interactive coverage when only one static frame was inspected.
- Skipping mirrors (CSS changed, TS/JSON left stale) when the adapter requires them.
- Importing the design package without importing its CSS — TS-only imports apply zero tokens to the DOM.
- Omitting Tailwind v4 `@source` for dynamically-composed `@utility` classes — they tree-shake away in production.
- Shipping shadcn/v0/Radix components without the `bridgeCss` layer — semantic classes keep default/light-theme colors.
- Sourcing licensed font binaries (`.otf`/`.ttf`) from a Figma screen export instead of the project's font drop.
- Storing a derived row rank in component data on tabular screens — derive it from render index (`index + 1`); only a pinned/static row carries an explicit rank.
- Letting the state vocabulary drift across screens (hover/focus/validation hardcoded per component) instead of consuming the [STATES.md](./STATES.md) tokens.

## Related skills

- Generic “implement this frame” skills: use for throwaway prototypes; still borrow **chunked MCP** from here for large nodes.
- Brand-specific package skills (e.g. a company’s npm-shipped handoff): use those when present — they are adapters on top of this methodology.
