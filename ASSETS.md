# Assets — download, export, localize, register

Pairs with [SKILL.md](./SKILL.md) Step 5 and Prompt 5 in [PROMPT_PACK.md](./PROMPT_PACK.md). Paths come from [ADAPTER.md](./ADAPTER.md) (`publicAssetDir`, `packageAssetDir`, `assetRegistryPath`).

Licensed font binaries are **out of scope** unless the project already documents a font drop — do not scrape fonts from Figma exports into public packages. Separate the **typography metrics board** (font family/size/line-height for measurement) from the **web-asset source node** (`figmaAssetSourceNode` in [ADAPTER.md](./ADAPTER.md)) that exports SVG/PNG/rasters; licensed `.otf`/`.ttf` come from the project font drop in `public/fonts`, never from a Figma export.

---

## 1. Goals

1. **No ephemeral URLs** — Figma MCP / localhost asset links must not ship in final code.
2. **Traceability** — prefer storing `figmaNodeId` next to each binary in a registry.
3. **Deterministic names** — kebab-case + role; sync scripts and case-sensitive deploys stay happy.
4. **Correct SVG coloring** — `<img>` SVGs cannot see page CSS variables.

---

## 2. Taxonomy (roles)

Use roles that match the screen; examples:

| Role | Example names |
| --- | --- |
| Logo | `logo-mark.png`, `logo-wordmark.svg` |
| Nav / chrome icons | `nav-home.svg`, `nav-settings.svg` |
| Decorative glow / bg | `bg-horizon.svg`, `bg-glow.png` |
| Status / trend | `trend-up.svg`, `trend-down.svg` |
| Avatar / rings | `avatar-user.png`, `avatar-ring-gold.svg` |
| Illustrations | `illu-<scene>.png` |

---

## 3. Export settings

### SVG (icons, trends, simple glows)

- Format SVG; avoid outlining text unless intentional
- **Replace `var(--…)` / Figma variable paints with literal hex** when the file is loaded via `<img>`
- Prefer square (or near-square) `viewBox`; do **not** use `preserveAspectRatio="none"`
- Prefer separate assets for directional variants over CSS `scaleY(-1)` (anti-aliasing differs)
- Strip sensitive comments only if required; node-id comments can help traceability

### PNG (photos, 3D marks, soft blurs)

- Export near on-screen size; add a clear 2x variant only if you name it distinctly
- Transparent background; tight crop (padding shifts `object-position`)

### Tiles / patterns

- Export the smallest repeating tile; use CSS repeat — do not bake a full-bleed 1440×900 raster unless necessary

---

## 4. Naming

- kebab-case only: `nav-profile.svg`, not `Nav Profile.SVG`
- Role prefixes: `nav-`, `icon-`, `bg-`, `logo-`, `illu-`, `avatar-`, `trend-`
- State suffixes only when separate files ship: `-active`, `-hover`, `-disabled`
- Color suffixes only for hard-coded color variants; otherwise color via CSS / tokens

---

## 5. Drop locations

```
<publicAssetDir>     # canonical export drop + local preview (adapter)
<packageAssetDir>    # optional mirror for npm-shipped design packages
```

Typical flow:

1. Export → `publicAssetDir`
2. Wire app imports / `public/` URLs
3. If the design package ships binaries, run the project’s sync script → `packageAssetDir`
4. Register in `tokenJson` / manifest with `id`, `path`, `figmaNodeId`

```json
{ "id": "<screen>-<role>", "path": "<repo-relative-path>", "figmaNodeId": "1:320" }
```

Full registry shape and provenance sections (`figmaSandbox`, `webAssetsSourceOfTruth`, `monorepo.brandArtifacts.entries`) are defined in [TOKEN_JSON.md](./TOKEN_JSON.md). Use colon form for `figmaNodeId` (`A:B`, not `A-B`).

---

## 6. Bundlers

- Prefer stable local paths or `new URL("./file.svg", import.meta.url)` patterns the bundler understands
- Next.js / pipelines without `import.meta.url` assets: copy into `public/` and use string paths
- Do not leave `localhost` or signed MCP URLs in committed source

---

## 7. SVG fill footgun

SVGs via `<img src>` are sandboxed:

- ❌ `fill="var(--color-brand)"` → often invisible
- ✅ `fill="#63c1e6"` (or whatever the design specifies)
- ✅ Inline SVG + `currentColor` when you need live tokenized color

---

## 8. Refresh checklist

1. List node id → filename → format (Prompt 5)
2. Export with §3 settings
3. Drop into `publicAssetDir`
4. Sync to package assets if required
5. Update registry entries
6. Visual diff vs Figma
7. Run verify/build; bump per adapter semver (patch for binary swap, minor for new ids)

---

## 9. Anti-patterns

- Assets only inside `node_modules/`
- Base64-everything in CSS when separate files hash better
- `<img>` + CSS variables inside the SVG
- Spaces / underscores / mixed case filenames
- Forgetting registry / `figmaNodeId`
- Stretching icons with `preserveAspectRatio="none"`
