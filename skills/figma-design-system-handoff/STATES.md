# States + primitives — portable vocabulary template

The **system layer** between foundations and page chrome: semantic **state
tokens** (hover / focus / pressed / disabled / loading / validation / motion) and
the **interactive primitive utilities** that consume them. Brand-agnostic —
replace `<p>` with the adapter `tokenPrefix`.

Pair with [MEASUREMENTS_CHECKLIST.md](./MEASUREMENTS_CHECKLIST.md) §14 and
[ADAPTER.md](./ADAPTER.md) layer rules. Mirror every token here in
`foundationsCss`, `tokenTs`, and `tokenJson` ([TOKEN_JSON.md](./TOKEN_JSON.md)).

> **Status discipline.** Numeric opacities, easings, and ring widths are a
> **v1 contract** — reconcile them with a future Figma "States" board without
> renaming CSS variables or classes. Adopters depend on stable names; add new
> tokens next to existing ones and bump minor.

## 1. State foundation tokens (`foundationsCss`)

### 1.1 Interaction layers
| Token | CSS variable | Use |
| --- | --- | --- |
| Hover | `--color-<p>-state-hover` | Translucent white over any clickable surface |
| Pressed | `--color-<p>-state-pressed` | `:active` press feedback |
| Active | `--color-<p>-state-active` | Persistent "is active" surface (nav highlight) |
| Selected | `--color-<p>-state-selected` | Brand-tinted selection |

### 1.2 Disabled / loading / muted text
| Token | CSS variable |
| --- | --- |
| Disabled foreground | `--color-<p>-disabled-fg` |
| Disabled background | `--color-<p>-disabled-bg` |
| Placeholder text | `--color-<p>-placeholder` |
| Help text | `--color-<p>-help` |
| Disabled opacity | `--opacity-<p>-disabled` |
| Loading opacity | `--opacity-<p>-loading` |

### 1.3 Focus ring — `:focus-visible` only
| Token | CSS variable |
| --- | --- |
| Ring color | `--ring-<p>-focus-color` |
| Ring width | `--ring-<p>-focus-width` |
| Ring offset | `--ring-<p>-focus-offset` |
| Error ring color | `--ring-<p>-error-color` |

Convention: **`:focus-visible` only** — mouse-only focus stays clean. Apply via a
`<p>-focus-ring` utility (auto-inside `<p>-btn`, `<p>-input`, `<p>-tab`).

### 1.4 Validation palette — fg / bg / border triples
| Role | fg | bg | border |
| --- | --- | --- | --- |
| Success | `--color-<p>-success` | `--color-<p>-success-bg` | `--color-<p>-success-border` |
| Warning | `--color-<p>-warning` | `--color-<p>-warning-bg` | `--color-<p>-warning-border` |
| Error | `--color-<p>-error` | `--color-<p>-error-bg` | `--color-<p>-error-border` |
| Info | `--color-<p>-info` | `--color-<p>-info-bg` | `--color-<p>-info-border` |

### 1.5 Motion
| Token | CSS variable |
| --- | --- |
| Fast | `--duration-<p>-fast` |
| Base | `--duration-<p>-base` |
| Slow | `--duration-<p>-slow` |
| Standard easing | `--ease-<p>-standard` |
| Emphasized easing | `--ease-<p>-emphasized` |

### 1.6 Skeleton
| Token | CSS variable |
| --- | --- |
| Skeleton background | `--color-<p>-skeleton-bg` |
| Skeleton shimmer | `--color-<p>-skeleton-shimmer` |
| Skeleton cycle duration | `--duration-<p>-skeleton` |

Consumed by `<p>-skeleton` (§2). Shimmer timing comes from the Figma prototype
or spec — [MEASUREMENTS_CHECKLIST.md](./MEASUREMENTS_CHECKLIST.md) §15.

### 1.7 Control sizing
| Token | CSS variable | Typical value |
| --- | --- | --- |
| Control small | `--height-<p>-control-sm` | `32px` |
| Control medium | `--height-<p>-control-md` | `40px` |
| Control large | `--height-<p>-control-lg` | `48px` |
| Control radius | `--radius-<p>-control` | per design |
| Control radius pill | `--radius-<p>-control-pill` | `999px` |

Buttons, inputs, and tabs share one height ramp so mixed-control rows align.
Values come from the Figma control components and their variants
([MEASUREMENTS_CHECKLIST.md](./MEASUREMENTS_CHECKLIST.md) §11).

## 2. Primitive utilities (`primitivesCss`)

| Utility | Use |
| --- | --- |
| `<p>-btn` (+ `-primary` / `-ghost` / `-md` …) | Buttons; ships with `<p>-focus-ring` |
| `<p>-input` (+ `-error`) | Text inputs |
| `<p>-tabs` | Tab / segmented control |
| `<p>-badge` (+ `-success` / `-warning` / `-error` / `-info` / `-neutral`) | Status chips |
| `<p>-banner` (+ variants) | Callout / notice blocks |
| `<p>-skeleton` | Loading shimmer |
| `<p>-focus-ring` | `:focus-visible` ring on any focusable element |
| `<p>-pressable` | Hover/active layer + cursor + transition for custom clickables |
| `<p>-disabled` | Disabled opacity + `pointer-events: none` (when you can't toggle the native attr) |
| `<p>-sr-only` | Visually hidden, screen-reader visible |

Size modifiers (`-sm` / `-md` / `-lg`) consume the §1.7 control-height ramp so
buttons, inputs, and tabs align in mixed rows.

## 3. TS mirror pattern (`tokenTs`)

```ts
export const <P>_STATE_TOKENS = {
  motionFast: "var(--duration-<p>-fast)",
  easeStandard: "var(--ease-<p>-standard)",
  skeletonDuration: "var(--duration-<p>-skeleton)",
} as const;

export const <P>_CONTROL_SIZES = {
  sm: "var(--height-<p>-control-sm)",
  md: "var(--height-<p>-control-md)",
  lg: "var(--height-<p>-control-lg)",
} as const;

export const <P>_VALIDATION_TOKENS = {
  error: { fg: "var(--color-<p>-error)", bg: "var(--color-<p>-error-bg)", border: "var(--color-<p>-error-border)" },
} as const;

export const <P>_PRIMITIVE_UTILITIES = ["<p>-btn", "<p>-input", "<p>-tabs", "<p>-badge", "<p>-banner", "<p>-skeleton"] as const;
export const <P>_PRIMITIVE_DEFAULTS = {
  button: { primary: "<p>-btn <p>-btn-primary <p>-btn-md <p>-focus-ring" },
  input:  { error: "<p>-input <p>-input-error" },
} as const;
```

`<P>_PRIMITIVE_UTILITIES` is the codegen/lint allowlist — keep it in sync with
`primitivesCss`.

## 4. Boundaries

| Layer | File | Examples |
| --- | --- | --- |
| Foundations | `foundationsCss` | Brand colors, type ramp, radii, **state tokens** (§1) |
| System primitives | `primitivesCss` | `<p>-btn/input/tabs/badge/banner/skeleton`, focus/pressable |
| Page chrome | `pageChromeCss` | `<p>-cmp-<screen>-*` |
| Bridge | `bridgeCss` | shadcn/v0 semantic names → brand tokens |

**Rule of thumb:** if a value or class would reuse on a different screen with no
screen context, it belongs in foundations or primitives — not page chrome.

## 5. Figma reconciliation (when a "States" board lands)

1. Compare hover/pressed/active opacities with §1.1 — adjust the four
   `--color-<p>-state-*` tokens only.
2. Compare focus ring color/width with §1.3 — adjust `--ring-<p>-focus-*` only.
3. Compare validation hex with §1.4.
4. Compare motion durations + easings with §1.5.
5. **Do not rename** CSS variables or `<p>-*` classes — adopters depend on them.
   Add new tokens next to existing ones and bump minor.
