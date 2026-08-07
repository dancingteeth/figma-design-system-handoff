# Prompt pack — Figma → Design-System Handoff

Paste-ready prompts for [SKILL.md](./SKILL.md). Replace placeholders:

| Placeholder | Meaning |
| --- | --- |
| `<FILE_KEY>` | Figma file key |
| `<ROOT_NODE_ID>` | Screen root (`A:B`) |
| `<SCREEN_NAME>` | Human label |
| `<BLOCK_NODE_ID>` | One block from Prompt 1a |
| `<CLIENT_LANGUAGES>` | Consumer languages, e.g. `typescript,css` |
| `<CLIENT_FRAMEWORKS>` | Consumer frameworks, e.g. `tailwind,react` |
| Adapter paths | From [ADAPTER.md](./ADAPTER.md) |

> **STRICT.** Always Prompt 1a → 1b per block → 1c → 1d. One-shot root `get_design_context` truncates and drops variables + Layer Effects.

Cross-refs: [MEASUREMENTS_CHECKLIST.md](./MEASUREMENTS_CHECKLIST.md), [ASSETS.md](./ASSETS.md).

---

## Prompt 1a — Cheap structural pass on the root

```text
Use Figma MCP on file key <FILE_KEY>, node <ROOT_NODE_ID> (<SCREEN_NAME>).

Call ONLY:
  get_metadata(fileKey="<FILE_KEY>", nodeId="<ROOT_NODE_ID>")
(Omit fileKey when using Figma desktop MCP.)

From the metadata, enumerate top-level BLOCKS that compose the screen
(sidebar/nav, header/hero, summary/cards, lists/tables, footers, glow/background, …).

Return JSON only:
{
  "screenRootNodeId": "<ROOT_NODE_ID>",
  "blocks": [
    { "nodeId": "<…>", "name": "<…>", "kind": "nav|header|card|table|row|background|footer|other" }
  ]
}

If a block still looks huge, split one level into its children — never paste the full metadata tree.
```

---

## Prompt 1b — Four-tool pass per block

```text
For EACH block from Prompt 1a, run your Figma MCP's tools for these four roles
in parallel (omit fileKey on desktop MCP that uses the open file). Tool names
vary by server — map from your MCP's actual tool list:

  structure / metadata     → e.g. get_metadata(fileKey="<FILE_KEY>", nodeId="<BLOCK_NODE_ID>")
  design context           → e.g. get_design_context(fileKey="<FILE_KEY>", nodeId="<BLOCK_NODE_ID>",
                             clientLanguages="<CLIENT_LANGUAGES>", clientFrameworks="<CLIENT_FRAMEWORKS>")
  variables                → e.g. get_variable_defs(fileKey="<FILE_KEY>", nodeId="<BLOCK_NODE_ID>",
                             clientLanguages="<CLIENT_LANGUAGES>", clientFrameworks="<CLIENT_FRAMEWORKS>")
  screenshot               → e.g. get_screenshot(fileKey="<FILE_KEY>", nodeId="<BLOCK_NODE_ID>")

Adjust clientLanguages / clientFrameworks to match the consumer stack.

Truncation guard:
- If design-context output exceeds ~600 lines or is truncated, ABORT and re-run on children.
- Do not paste raw codegen into the user reply — keep dumps for Prompt 1c.

Variable tools (when present) are authoritative for bound variables even when
design context shows literals. If variables or modes cannot be read, mark them
unverified — do not invent values.

Save payloads keyed by node id for 1c / 1d / Step 2.
```

---

## Prompt 1c — Parse design-context dumps for unique primitives

```text
For each per-block get_design_context dump, extract unique primitives.

Prefer:
  node scripts/extract-primitives.mjs < dump.txt
(from this skill repo, or the installed skill directory).

Or apply the same regexes in-process:
- className="…" → split classes
- #[0-9a-fA-F]{6}
- rgba(…)
- classes starting with backdrop-blur-[ / rounded-[ / tracking-[ / gap-[
- text-[…px]

Merge per-block sets into one SCREEN-level primitives object (union, dedupe).
Keep per-block objects for Prompt 1d.

Reconcile side: pipe the same dump(s) through
  node scripts/compare-figma-to-tokens.mjs --tokens <tokenJson> < dump.txt
to diff Figma hex against the public token set (see Prompt 6).
```

---

## Prompt 1d — Strict per-block JSON contract

```text
For EACH block, emit:

{
  "source": {
    "figmaFileKey": "<FILE_KEY>",
    "figmaNodeId": "<BLOCK_NODE_ID>",
    "figmaNodeName": "<BLOCK_NAME>",
    "rootNodeId": "<ROOT_NODE_ID>"
  },
  "boundVariables": [
    { "name": "<Figma variable name>", "value": "<resolved value>" }
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
      "instanceOverrides": [],
      "variantProps": {}
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
  "missingInDesignSystem": ["<value or role with no current token>"]
}

Then emit one SCREEN-level aggregate (same shape; figmaNodeId = root; merge primitives).
```

---

## Prompt 1e — Responsive, state, and style inventory

```text
Using all supplied target frames and Figma variable modes for <SCREEN_NAME>,
compare the layouts rather than treating the first frame as the complete design.

Return:
{
  "targets": [
    {
      "nodeId": "<…>",
      "name": "<desktop|tablet|mobile|mode>",
      "viewport": { "width": "<…>", "height": "<…>" },
      "mode": "<… or null>"
    }
  ],
  "responsiveChanges": [
    {
      "element": "<node id/name>",
      "property": "visibility|order|size|spacing|type|overflow|asset",
      "from": "<…>",
      "to": "<…>",
      "evidence": "<node ids or variable refs>"
    }
  ],
  "states": [
    {
      "component": "<node id/name>",
      "state": "default|hover|pressed|selected|focus|disabled|loading|validation",
      "evidence": "<component property/style/variant ref>"
    }
  ],
  "unverified": [
    "Responsive or interactive behavior not represented in the supplied Figma targets"
  ]
}

Do not invent breakpoints or interaction behavior. Record unverified coverage explicitly.
```

---

## Prompt 2 — Exact sizing export

```text
Using Figma MCP payloads for file <FILE_KEY> / nodes under <ROOT_NODE_ID>,
extract exact numeric layout values for EVERY measurable property on the frame.
Follow MEASUREMENTS_CHECKLIST.md.

Capture at least:
- box: width, height, x, y, absoluteBoundingBox, opacity, visibility, z-order
- auto-layout: layoutMode, alignments, itemSpacing, wrap, HUG/FIXED/FILL, layoutGrow, absolute children
- padding: top/right/bottom/left separately
- radius: per corner
- stroke: weight, align, color, dashes, per-side weights, gradient strokes
- fills: solid / gradient stops+angle / image scaleMode
- effects: dropShadow, innerShadow, layerBlur, backgroundBlur (codegen drops these)
- typography: family, weight, size, lineHeight unit+value, letterSpacing, case, decoration, truncate
- constraints when not auto-layout
- bound variables (name, mode, resolved value)
- frame width/height, layout grids, safe-area and scroll behavior

Output:
{
  "measurements": [
    {
      "tokenCandidate": "--…",
      "figmaNodeId": "…",
      "figmaNodeName": "…",
      "property": "…",
      "figmaValue": "…",
      "currentTokenValue": "… or null",
      "currentTokenName": "… or null",
      "layer": "system|<screen>-page"
    }
  ]
}

Rules:
- layer = system if reusable across screens; <screen>-page if geometry-specific.
- null current* when no token covers the role yet.
- Never collapse asymmetric paddings / radii / shadow channels.
```

---

## Prompt 3 — Reconcile plan

```text
Using inventory + measurements, produce a reconciliation plan in `<MODE>` mode
against the adapter paths:
- <foundationsCss>
- <primitivesCss>
- <pageChromeCss>
- <tokenTs> (if any)
- <tokenJson> (if any)
- <agentDocs>

Rules:
1) If MODE is `bootstrap`, propose the smallest package files under
   `<designPackageRoot>` needed for the first reference screen. If MODE is
   `integration`, preserve the existing package structure.
2) Reusable states/primitives → foundations or primitives layer.
3) Page-only geometry → page chrome utilities with the repo’s naming convention.
4) Do not hardcode design-system values in UI packages when a token exists.
5) Keep public names stable (renames = major).
6) Restore codegen drops: shadows, backdrop-filter, gradient strokes (often ::before mask rings).
7) Asymmetric paddings/radii stay explicit unless truly symmetric.
8) Preserve semantic/accessibility requirements and separate decorative layers
   from data-driven product behavior.
9) If the consumer uses shadcn/v0/Radix codegen, map semantic classes
   (bg-background, text-foreground, bg-primary, border-border) to brand tokens
   via <bridgeCss>. Plan the bridge mappings as part of the reconcile.
10) State tokens (hover/pressed/active/selected, :focus-visible-only focus ring,
    validation fg/bg/border triples, motion) follow STATES.md. Mirror each new
    state token in <foundationsCss>, <tokenTs>, and <tokenJson> (states/validation).

Return:
- Added tokens (name, value, layer)
- Updated tokens (reason, risk)
- Deprecated/renamed (rare; why)
- Utility class changes
- Bridge mappings (semantic name → brand token), if any
- TS / JSON mirror updates (including tokenJson states/validation/utilities per TOKEN_JSON.md)
- Risk notes + recommended semver per adapter policy
```

---

## Prompt 4 — Apply updates

```text
Apply the reconciliation plan.

If MODE is `bootstrap`, create the approved foundations, primitives,
page/component, token JSON, and agent/design-system documentation files before
implementing the first reference screen. If MODE is `integration`, update only
files that need changes among adapter paths + changelog/docs.
Rebuild UI into existing component boundaries — do not paste one giant generated screen.

Then run every available adapter gate:
- verifyCmd
- buildCmd
- lintCmd / typecheck
- previewCmd (visual diff vs Figma screenshots)
- target viewport checks
- keyboard/focus and basic semantic/accessibility checks

If a gate cannot run, record it as unverified with the reason. Do not claim
pixel parity, responsive coverage, or accessibility coverage for an unrun gate.

Finally:
- Follow releaseFlow (changeset / PR note / version bump).
- Return: Adapter, Figma Inventory, Figma → Token Diff Table, Applied File Changes, Release Readiness.
```

---

## Optional Prompt 5 — Refresh assets

```text
Re-export these Figma nodes into <publicAssetDir>:
- <nodeId> → <filename.ext>  (SVG vs PNG notes)

Asset rules (ASSETS.md):
- No temporary MCP / localhost URLs in final code.
- SVGs used as <img>: literal hex fills (no var(--…)); prefer square viewBox; no preserveAspectRatio="none".
- kebab-case role filenames: nav-*.svg, icon-*.svg, bg-*.svg, logo-*.png, …
- Register each binary with figmaNodeId in the adapter asset registry when one exists.
- Run any sync script that mirrors public → package assets before release.
```

---

## Optional Prompt 6 — Offline token drift check

Verify that Figma MCP `get_design_context` output matches (or extends) the public
`<tokenJson>` without keeping a long agent chat.

```text
1. Run Prompt 1a → 1b for the root node; save ONLY the concatenated
   design-context / codegen text to e.g. tmp/figma-dump.txt.
2. From the repo root:
     node scripts/compare-figma-to-tokens.mjs --tokens <tokenJson> < tmp/figma-dump.txt
   Optional — compare only one section:
     node scripts/compare-figma-to-tokens.mjs --tokens <tokenJson> --subset states < tmp/figma-dump.txt
3. Read the report:
   - overlap          → already covered by tokens
   - only in Figma    → candidate new tokens to reconcile
   - only in repo     → CSS vars / literals not present in this Figma slice (often fine)
```

Mirrors Prompt 1c hex extraction on the reconcile side. Run before Step 4 to
avoid token drift, and after Step 4 to confirm the new set covers Figma.
