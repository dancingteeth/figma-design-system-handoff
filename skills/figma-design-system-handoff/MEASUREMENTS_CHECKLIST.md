# Measurements checklist — exact-copy parity from Figma

Use during **Prompt 2**. Every item is either a captured Figma value **or** mapped to an existing design-system token. Null in the diff = parity gap.

> **Mental model.** Figma codegen drops detail: layer effects, asymmetric paddings, per-corner radii, gradient stops, image fit modes, constraints, variable bindings. Screenshot + this checklist beat codegen as ground truth.

---

## 1. Box model

For every node:

- `width`, `height` (px)
- `x`, `y` (relative to parent)
- `absoluteBoundingBox` when parent coordinates matter
- `opacity`, `visible` / `locked`
- `z-order` vs siblings

## 2. Auto-layout

If `layoutMode != NONE`:

- `layoutMode` (`HORIZONTAL` | `VERTICAL`)
- `primaryAxisAlignItems` (`MIN` | `CENTER` | `MAX` | `SPACE_BETWEEN`) / `counterAxisAlignItems` (`MIN` | `CENTER` | `MAX` | `BASELINE`)
- `itemSpacing`, `layoutWrap` (`NO_WRAP` | `WRAP`), `counterAxisSpacing`
- `layoutSizingHorizontal` / `layoutSizingVertical` (`HUG` | `FIXED` | `FILL`)
- `layoutGrow`, `layoutPositioning` (`AUTO` | `ABSOLUTE`)

If free-form:

- `constraints.horizontal` (`LEFT` | `RIGHT` | `CENTER` | `LEFT_RIGHT` | `SCALE`) / `constraints.vertical` (`TOP` | `BOTTOM` | `CENTER` | `TOP_BOTTOM` | `SCALE`) per child
- Offsets from each constrained edge

## 3. Padding (all four sides)

- `paddingTop` / `paddingRight` / `paddingBottom` / `paddingLeft`

Do **not** collapse unless all four are equal. Asymmetric padding is the #1 pixel-off bug.

## 4. Border-radius (per corner)

- `topLeftRadius` / `topRightRadius` / `bottomRightRadius` / `bottomLeftRadius`

Shorthand only when all four match.

## 5. Strokes

- `strokeWeight`, `strokeAlign` (`INSIDE` | `CENTER` | `OUTSIDE`)
- `strokeColor` / `strokeOpacity`, `strokeDashes`
- `individualStrokeWeights` when sides differ
- **Gradient strokes:** stops + angle; plan a mask/`::before` ring — codegen often flattens to rgba

## 6. Fills

- Solid: hex + opacity + blend mode (`PASS_THROUGH` | `MULTIPLY` | `SCREEN` | `OVERLAY` | `DARKEN` | `LIGHTEN` | `COLOR_DODGE` | `COLOR_BURN` | `SOFT_LIGHT` | `HARD_LIGHT` | `DIFFERENCE` | `EXCLUSION`)
- Gradients: every stop (position + color + opacity) + transform/angle — preserve high precision
- Image fills: `scaleMode` (`FILL` | `FIT` | `CROP` | `TILE`), `imageTransform` (matrix), `scalingFactor` (for `TILE`)
- Stacked fills + order (Figma renders top-of-list on top)

## 7. Effects (codegen usually drops these)

| Effect | Capture | Typical CSS restore |
| --- | --- | --- |
| `DROP_SHADOW` | offsetX/Y, blur, spread, color, opacity, blend | `box-shadow` / shadow token |
| `INNER_SHADOW` | same | `box-shadow: inset …` |
| `LAYER_BLUR` | radius | `filter: blur(N)` |
| `BACKGROUND_BLUR` | radius | `backdrop-filter: blur(N)` |

Map to existing shadow/blur tokens or add new ones per adapter naming.

## 8. Typography (per text node)

- `fontFamily`, `fontWeight`, `fontSize`
- `lineHeight` — **unit** (`PIXELS` | `PERCENT` | `AUTO`) **and** value
- `letterSpacing` — value + unit
- `textCase`, `textDecoration`
- `paragraphSpacing` / `paragraphIndent`
- `textAlignHorizontal` / `textAlignVertical`
- `textAutoResize`, truncation / `maxLines`, `leadingTrim`

Map to the design-system type scale; new combinations need new tokens/utilities.

## 9. Gradients (text + background)

- Stops with exact positions (do not casually round)
- Angle / handles → CSS gradient
- Blend mode if not pass-through

## 10. Images / SVGs

- Intrinsic size, aspect ratio, object-fit/position
- Mask / clip children node ids
- `<img>` SVGs: literal hex fills; see [ASSETS.md](./ASSETS.md)
- Provenance: web-shipped binaries come from the adapter `figmaAssetSourceNode`; typography **metrics** may come from a different board than font **binaries** (licensed `.otf` lives in `public/fonts`, never scraped from Figma)

## 11. Components / instances / variants

- `componentKey` / `componentSetKey`
- `componentProperties` (variant props) → primitive utility candidates
- Instance overrides (one-offs vs true variants)
- Text style references and resolved style values
- Effect style references and resolved effect values
- Repeated component instances across frames (evidence for promotion into a primitive)

## 12. Figma variables

For each bound property:

- Variable name, mode, resolved value → token candidates

## 13. Page-level frame metadata

- Frame width × height, background fill
- Layout grids if present
- Safe-area / scroll notes
- Breakpoint / mode metadata when multi-mode variables exist
- Target frame/mode identity and the relationship to other responsive targets
- Content reflow: hidden, reordered, wrapped, truncated, or replaced elements

## 14. Interactive state recipes

Even on static frames, capture hints. Map each to the portable vocabulary in
[STATES.md](./STATES.md) so states stay consistent across screens:

- Interaction layers: hover / pressed / active / selected → `--color-<p>-state-*`
- Focus ring: color / width / offset, `:focus-visible` only → `--ring-<p>-focus-*`
- Disabled / loading: fg / bg / opacity → `--color-<p>-disabled-*`, `--opacity-<p>-*`
- Placeholder / help text → `--color-<p>-placeholder`, `--color-<p>-help`
- Validation roles: success / warning / error / info, each as fg / bg / border triple → `--color-<p>-*-{,-bg,-border}`
- Motion: fast / base / slow + easings → `--duration-<p>-*`, `--ease-<p>-*`

Reuse system defaults when the frame does not redraw every state; do not
hardcode per-component hover/focus/validation shades.

## 15. Motion

From prototype or specs: duration, easing, skeleton/shimmer timing → motion tokens when the system has them.

## 16. Stacking

Document bleed-past-parent stacking; note transparent hosts where page glow must show through.

## 17. Implementation contract

Before applying codegen, record the implementation constraints visible in the
repo and the design:

- semantic heading and landmark structure
- keyboard focus order and visible focus treatment
- button/link/input semantics and labels
- image alt text or intentional decorative status
- overflow, scroll, and fixed/sticky behavior
- data-driven content versus decorative Figma-only layers

If the design does not specify a behavior, mark it unverified. Do not turn a
static artboard into a fixed-height production page to hide the gap.

---

## Mapping shortcut

```
Used on more than one screen (now or soon)?
├── Yes → foundations or primitives
└── No  → page chrome
If unsure → page chrome; promote later
```

## Quality gates

Before calling parity done:

1. Asymmetric **paddings**
2. Per-corner **radii**
3. **Layer effects** + gradient strokes
4. Typography **line-height units** (`AUTO`→`normal`; `PERCENT`→unitless; `PIXELS`→px)
5. **HUG vs FILL** mismatches shifting neighbors
6. Responsive target frames/modes were checked, or explicitly marked unverified
7. Keyboard/focus and basic semantic checks were run, or explicitly marked unverified
