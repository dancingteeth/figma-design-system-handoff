# Bootstrap a design system from Figma

Use this path when the project has a Figma board, optional v0/prototype
screens, and no canonical frontend design system yet.

This is not a promise to infer every product decision from pixels. It is the
smallest repeatable path for turning a raw design language into a package that
can support a validated first screen and future screens.

## Inputs

Required:

- Figma file and root frame/node
- at least one target screen or board
- intended frontend stack
- owner who can approve token and component decisions

Useful but optional:

- v0 or other prototype output
- mobile/tablet frames
- Figma variables and styles
- product copy and data examples
- exported assets

Prototype output is evidence of intended composition and content. Inspect it
for reusable behavior, but do not copy its generated token values or monolithic
component structure into the design package without reconciliation.

## Bootstrap sequence

### 1. Establish the package boundary

Before applying extracted values, record:

- design package root
- consumer app root
- token prefix and naming convention
- target frames/modes
- asset export directory
- validation commands
- release owner

If the repository has no conventions, propose these paths for approval:

```text
packages/design-system/
├── src/
│   ├── foundations.css      # colors, type, radius, spacing, effects
│   ├── primitives.css       # button, input, tabs, badges, states
│   ├── components.css       # screen/page chrome
│   └── tokens.ts            # optional TS helpers and allowlists
├── design-tokens.json       # machine-readable public token map
├── DESIGN.md                # human design-system contract
└── AGENTS.md                # code-generation and authoring rules
```

Do not create this layout silently if the team already has a package
convention. The adapter is the source of truth.

### 2. Extract before styling

Run the main skill through Steps 1–2:

1. map the Figma root
2. split large frames into blocks
3. capture design context, variables, styles, and screenshots
4. produce the strict inventory JSON
5. capture exact measurements and responsive differences

Do not start by copying generated JSX. The inventory and measurements are the
input to the token plan.

### 3. Create foundations first

Promote values that are reused or clearly system-level:

- color roles, not only raw swatches
- type families, weights, sizes, and line-height
- spacing and radius scales where repetition supports them
- surfaces, gradients, shadows, and blur
- focus, disabled, loading, validation, and motion roles

Preserve unusual values when the design uses them intentionally. Do not force
everything into a scale just to make the JSON look tidy.

### 4. Create primitives second

Promote repeated interactive patterns from the inventory:

- button
- input
- tab/segmented control
- badge/status
- banner/callout
- skeleton/loading
- focus and pressable behavior

Use component variants and state evidence from Figma. Do not promote a
one-off card or screen geometry into a generic primitive merely because it is
visually prominent.

### 5. Create page chrome third

Keep screen-specific geometry in the page/component layer:

- sidebar shell
- header/hero arrangement
- table/list layout
- pinned or overflowing rows
- screen-specific glow and decorative layers
- unique card dimensions or segment positions

If the same pattern appears on a second screen, promote it deliberately in a
later reconciliation rather than guessing during the first pass.

### 6. Build one reference consumer

Implement one representative screen against the new package. It should:

- import the package CSS
- consume tokens and primitives rather than duplicate values
- use semantic DOM and accessible controls
- keep data-driven content separate from decorative Figma layers
- localize all assets
- retain Figma traceability where useful (`data-figma-*`, node comments, or the
  project’s equivalent)

The first screen is the package's integration test. A package that only looks
correct inside a hardcoded artboard is not ready.

### 7. Reconcile after the first screen

Compare the reference screen with Figma and classify every mismatch:

- missing foundation token
- missing primitive/state recipe
- page-only geometry
- asset/export issue
- typography metric
- responsive behavior
- implementation/accessibility issue

Apply the smallest correction in the correct layer, then update all declared
mirrors and documentation.

### 8. Release the first usable system

Before handoff, return:

1. token inventory and unresolved decisions
2. primitive/component inventory
3. reference screen and target viewport results
4. asset registry
5. verification/build/lint/browser outcomes
6. known unverified behavior
7. release/version recommendation

Future screens should begin with the existing package and repeat the
inventory → measurement → reconcile flow. They should not fork the first
screen's CSS.

## Bootstrap anti-patterns

- Treating v0 output as the design-system source of truth
- Dumping every Figma hex into one flat token file
- Creating a giant `FigmaMainScreen` as the package API
- Promoting screen geometry before seeing a second use
- Building tokens without a reference consumer
- Calling parity complete without target viewport screenshots
- Silently inventing responsive, accessibility, or interaction behavior
