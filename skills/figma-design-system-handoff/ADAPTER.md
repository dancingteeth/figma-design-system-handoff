# Design-system adapter

This skill is **brand-agnostic**. Before Steps 3–7, resolve an **adapter** —
the contract that maps Figma values onto this project's token/CSS/TS surfaces,
or defines the package to create in bootstrap mode.

Agents: fill every field you can from the repo (README, `AGENTS.md`, `DESIGN.md`, `design-tokens.json`, package.json). Ask the user only for gaps. Do **not** invent a second design system beside an existing one.

## Adapter fields

| Field | Example | Purpose |
| --- | --- | --- |
| `brand` | `acme` | Short slug for names (`--color-acme-bg`, `acme-btn`) |
| `tokenPrefix` | `acme` | CSS var / utility infix (`--color-{tokenPrefix}-*`, `{tokenPrefix}-type-*`) |
| `mode` | `bootstrap` / `integration` | Whether the design package is new or already exists |
| `designPackageRoot` | `packages/design-system/` | Package to create or update |
| `consumerAppRoot` | `apps/web/` | First/reference frontend consumer |
| `figmaFileKey` | `AbCdEf…` | Default Figma file (override per URL) |
| `figmaFileName` | `Acme Prod` | Human label for logs |
| `targetFrames` | `desktop: 1440x1132, mobile: 390x…` | Figma frames/modes required for responsive validation |
| `stack` | `React + Vite + Tailwind v4` | Consumer implementation stack |
| `foundationsCss` | `packages/design/src/theme.css` | Colors, type, radii, shared `@theme` / tokens |
| `primitivesCss` | `packages/design/src/primitives.css` | Reusable interactive utilities (btn, input, …) |
| `pageChromeCss` | `packages/design/src/components.css` | Screen-only layout utilities |
| `bridgeCss` | `packages/design/src/shadcn-bridge.css` | shadcn/v0/Radix semantic names (`bg-background`, `text-foreground`, `bg-primary`) → brand tokens; required when the consumer uses shadcn/v0 codegen (optional) |
| `tailwindSource` | `@source "../node_modules/<pkg>/src"` | Tailwind v4 `@source` path so dynamically-composed `@utility` classes survive production tree-shaking (optional) |
| `tokenTs` | `packages/design/src/tokens.ts` | TS mirrors / allowlists (optional) |
| `tokenJson` | `packages/design/design-tokens.json` | Machine-readable map ([TOKEN_JSON.md](./TOKEN_JSON.md)) (optional but preferred) |
| `tokenJsonSchema` | `packages/design/design-tokens.schema.json` | JSON Schema for `tokenJson` when validated in CI (optional) |
| `agentDocs` | `AGENTS.md`, `DESIGN.md` | Authoring rules for agents |
| `publicAssetDir` | `apps/web/public/<screen>/` | Canonical Figma export drop |
| `packageAssetDir` | `packages/design/src/assets/<screen>/` | Optional npm-shipped mirror |
| `assetRegistryPath` | path inside `tokenJson` or a manifest | Where binaries are registered |
| `figmaAssetSourceNode` | `<node-id for web binaries>` | Figma node that is the canonical source for web-shipped binaries; licensed fonts are excluded — see [ASSETS.md](./ASSETS.md) |
| `verifyCmd` | `pnpm verify:design` | Package integrity check (starter: `scripts/verify-package-exports.mjs --pkg <designPackageRoot>`) |
| `buildCmd` | `pnpm -C examples/… build` | Consumer build smoke |
| `lintCmd` | `pnpm lint` | Touched-file lint |
| `typecheckCmd` | `pnpm typecheck` | Type validation (optional) |
| `previewCmd` | `pnpm dev` | Visual diff vs Figma screenshot |
| `browserCheck` | `Playwright smoke / manual browser` | Render, viewport, keyboard, and semantic checks |
| `consumerSmokeCmd` | `pnpm <pkg>:smoke` | Pack the design package + install the tarball into a throwaway consumer to prove the public surface exports resolve (starter: `scripts/consumer-smoke.mjs --pkg <designPackageRoot>`) |
| `releaseFlow` | `changeset` / `release-please` / manual | How versions ship |
| `semverPolicy` | see below | What bump means for tokens |

In `bootstrap` mode, `foundationsCss`, `primitivesCss`, `pageChromeCss`,
`tokenTs`, and `tokenJson` are proposed paths under `designPackageRoot` until
the project approves or changes them. See [BOOTSTRAP.md](./BOOTSTRAP.md).

### Semver policy (default)

| Bump | When |
| --- | --- |
| `patch` | Token *values* change; docs-only; binary swaps with same ids |
| `minor` | New tokens / utilities / exports; backward compatible |
| `major` | Renames, removals, or changed semantics of public tokens/utilities |

Repos override this if the package already documents different rules.

## Layer rules (portable)

1. **Foundations** — reusable across screens: color, type scale, radius, spacing, state/validation, motion, glass/gradient primitives.
2. **Primitives** — interactive recipes reused across screens: button, input, tabs, badge, banner, skeleton, focus ring.
3. **Page chrome** — geometry that only makes sense on one screen (pinned-row bleed, segment preset positions, unique card size). Prefer page chrome when unsure; promote later.
4. **Bridge** — when the consumer uses shadcn/v0/Radix codegen, a `bridgeCss` layer maps semantic classes (`bg-background`, `text-foreground`, `bg-primary`, `border-border`) to brand tokens. Generated components resolve to the brand system only when the bridge is loaded. State tokens (hover/focus/pressed/disabled/loading/validation/motion) follow the vocabulary in [STATES.md](./STATES.md).

Never hardcode a design-system hex/radius/shadow in a UI package when a token already covers the role. Never import the package's TypeScript without its CSS — TS-only imports apply zero tokens to the DOM.

## Discovery order

1. User-supplied adapter (chat / project skill overlay).
2. Repo files: `AGENTS.md`, `DESIGN.md`, `CLAUDE.md`, `design-tokens.json`, design-package README.
3. Heuristics: Tailwind v4 `@theme`, `*-design-system.css`, `tokens.ts`, a shadcn/v0 bridge file (`*-bridge.css` mapping `--background`/`--primary`/…), and `@source` directives pointing at the package `src/`.
4. If nothing exists — use bootstrap mode: propose the package boundary,
   approve the token/component naming contract, then create foundations,
   primitives, page chrome, and a first reference consumer as described in
   [BOOTSTRAP.md](./BOOTSTRAP.md).

## Example filled adapter (illustrative)

```yaml
brand: acme
tokenPrefix: acme
mode: bootstrap
designPackageRoot: packages/design-system/
consumerAppRoot: apps/web/
figmaFileKey: <from Figma URL>
targetFrames: desktop=<node-id>, mobile=<node-id>
stack: React + Vite + Tailwind v4
foundationsCss: packages/design-system/src/foundations.css
primitivesCss: packages/design-system/src/primitives.css
pageChromeCss: packages/design-system/src/components.css
bridgeCss: packages/design-system/src/shadcn-bridge.css   # if consumer uses shadcn/v0
tailwindSource: "@source \"../node_modules/@acme/design-system/src\""
tokenTs: packages/design-system/src/tokens.ts
tokenJson: packages/design-system/design-tokens.json
tokenJsonSchema: packages/design-system/design-tokens.schema.json
figmaAssetSourceNode: "<node-id for web binaries; excludes licensed fonts>"
publicAssetDir: apps/web/public/<screen>/
consumerSmokeCmd: pnpm acme-design:smoke
verifyCmd: pnpm verify:acme-design
buildCmd: pnpm -C apps/web build
lintCmd: pnpm lint
typecheckCmd: pnpm typecheck
previewCmd: pnpm dev
browserCheck: pnpm test:e2e
releaseFlow: changeset
```

## Output

Once resolved, paste a short **Adapter** block at the top of the handoff summary so reviewers know which paths were authoritative.
