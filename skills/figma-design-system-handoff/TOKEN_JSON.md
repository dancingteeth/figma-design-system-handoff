# Token JSON contract — machine-readable design map

The adapter field `tokenJson` ([ADAPTER.md](./ADAPTER.md)) points at a
machine-readable map that makes the design package self-describing for agents,
codegen, and design tools. This doc defines a portable shape generalised from a
production npm-published design system. Adopt the sections you need; skip the
rest. Ship a JSON Schema (`tokenJsonSchema`) when the project validates it in CI.

**Runtime rule:** prefer CSS variables at runtime; the hex values in this file
are canonical from `foundationsCss` and exist for agents/tools, not for direct
UI import.

## Top-level shape

```json
{
  "$schema": "./design-tokens.schema.json",
  "name": "<brand>",
  "package": "<npm name or null>",
  "version": "<package semver>",
  "figmaFile": "<human label>",
  "figmaFileKey": "<fileKey>",
  "description": "Machine-readable token map for agents, codegen, and design tools.",

  "figmaSandbox": { },
  "webAssetsSourceOfTruth": { },
  "monorepo": { },
  "states": { },
  "validation": { },
  "utilities": { "primitives": [], "layoutComponents": [] },
  "colors": { },
  "radius": { },
  "type": { }
}
```

## Provenance — two Figma sources

A mature system usually separates **metric** sources from **binary** sources:

- `figmaSandbox` — the file/nodes used for layout parity and screen trace.
  ```json
  "figmaSandbox": {
    "fileKey": "<fileKey>",
    "screens": { "<screenKey>": "<nodeId>" }
  }
  ```
- `webAssetsSourceOfTruth` — the node that is the canonical source for
  **web-shipped binaries** (SVG/PNG/raster), with an `excludes` list for assets
  that must NOT be scraped from Figma (licensed fonts, third-party marks).
  ```json
  "webAssetsSourceOfTruth": {
    "figmaFileKey": "<fileKey>",
    "rootNodeId": "<nodeId>",
    "rootNodeName": "<…>",
    "typescriptExport": "<optional TS constant name>",
    "excludes": ["Licensed font .otf — use <foundationsCss> @font-face + public/fonts"]
  }
  ```

Typography **metrics** may come from one board while **font binaries** come from
a licensed drop in `public/`. Never source licensed `.otf` from a Figma export.

## monorepo — where things live

```json
"monorepo": {
  "tokens": {
    "css": "<foundationsCss>",
    "typescript": "<tokenTs>",
    "machineReadable": "<tokenJson>",
    "bridgeCss": "<bridgeCss or null>",
    "rule": "Add reusable colors, radii, shadows, and <prefix>-* utilities here first — not only in the consumer app."
  },
  "brandArtifacts": {
    "canonicalDir": "<packageAssetDir or publicAssetDir>",
    "entries": [
      { "id": "<screen>-<role>", "path": "<repo-relative>", "figmaNodeId": "A:B" }
    ]
  },
  "consumer": {
    "appRoot": "<consumerAppRoot>",
    "exampleConsumer": "<optional second consumer that proves the public surface>"
  }
}
```

`brandArtifacts.entries` is the asset registry ([ASSETS.md](./ASSETS.md)). Use
colon form for `figmaNodeId` (`A:B`, not `A-B`). `id` = `<screen>-<role>`.

## states / validation — semantic vocabulary

Mirror the state and validation tokens here so agents can discover them without
parsing CSS. See [STATES.md](./STATES.md) for the full vocabulary.

```json
"states": {
  "interaction": { "hover": "--color-<p>-state-hover", "pressed": "...", "active": "...", "selected": "..." },
  "disabled":    { "fg": "...", "bg": "...", "opacity": "--opacity-<p>-disabled" },
  "loading":     { "opacity": "--opacity-<p>-loading" },
  "focus":       { "color": "--ring-<p>-focus-color", "width": "...", "offset": "..." },
  "motion":      { "fast": "--duration-<p>-fast", "base": "...", "slow": "...", "easeStandard": "..." }
},
"validation": {
  "success": { "fg": "...", "bg": "...", "border": "..." },
  "warning": { "fg": "...", "bg": "...", "border": "..." },
  "error":   { "fg": "...", "bg": "...", "border": "..." },
  "info":    { "fg": "...", "bg": "...", "border": "..." }
}
```

## utilities — class allowlists

```json
"utilities": {
  "primitives": ["<p>-btn", "<p>-input", "<p>-tabs", "<p>-badge", "<p>-banner", "<p>-skeleton", "<p>-focus-ring"],
  "layoutComponents": ["<p>-cmp-<screen>-*"]
}
```

Use these as codegen/lint allowlists so generated code only emits known classes.

## How agents use this file

1. **Discovery (Step 0):** read `monorepo.tokens.*` to resolve adapter paths; read
   `figmaSandbox` / `webAssetsSourceOfTruth` for provenance.
2. **Reconcile (Step 3):** diff Figma hex/variables against `colors`, `states`,
   `validation`; anything only-in-Figma is a candidate new token.
3. **Apply (Step 4):** update every mirror declared here (`css`, `typescript`,
   this file) so they stay synchronized.
4. **Drift check:** run
   [`scripts/compare-figma-to-tokens.mjs`](./scripts/compare-figma-to-tokens.mjs)
   on a saved Figma dump to verify the public token set still covers Figma
   without keeping a long agent chat.
