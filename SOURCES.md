# Sources — Figma Design-System Handoff

Human context and provenance for [`SKILL.md`](./SKILL.md). **Not required** for the agent to execute the skill; kept separate to save context on every run.

| Contribution | Credit |
| --- | --- |
| Chunked MCP discovery, truncation guard, four-tool per-block pass | Production Figma handoff work generalized into this skill |
| Measurements taxonomy (asymmetric padding, per-corner radii, layer effects) | Production Figma handoff work generalized into this skill |
| Inventory → measurements JSON → reconcile → apply → assets prompt pack | Same |
| Codegen gap list (shadows, backdrop blur, gradient strokes, `<img>` SVG vars) | Same |
| Adapter split (methodology vs brand package) | This repo — so customer brands and community installs do not fork brand assets |
| Reference and evidence boundary | `REFERENCE_IMPLEMENTATION.md`, documenting the production workflow this skill has exercised |
| Figma MCP tool surface (`get_metadata`, `get_design_context`, `get_variable_defs`, `get_screenshot`) | [Figma MCP](https://www.figma.com/) / agent tooling docs — verify names on your server |
| Skills packaging pattern (`npx skills add`, multi-file skill) | [unified-code-review](https://github.com/dancingteeth/unified-code-review) |
| shadcn / v0 / Radix semantic-class bridge (`bg-background`, `text-foreground`, `bg-primary` → brand tokens); "CSS required, not TS-only"; Tailwind v4 `@source` tree-shaking | Production Figma handoff work generalized into this skill |
| Machine-readable token JSON contract (provenance `figmaSandbox` / `webAssetsSourceOfTruth`, asset registry, state/validation/utility mirrors) + JSON Schema | Same |
| Offline Figma-dump vs. token-JSON drift check (`compare-figma-to-tokens.mjs`) | Same |
| Pack-and-install consumer smoke test proving the public package surface | Same |
| State + primitive vocabulary (interaction layers, `:focus-visible`-only ring, validation fg/bg/border triples, motion, primitive utilities, TS defaults) | Same |
| Per-screen `<SCREEN>_DS.md` worked-example parity doc | Same |
| Two-Figma-source provenance (typography metrics board vs. web-asset node; licensed-font exclusion) | Same |

Brand-specific tokens, fonts, file keys, and customer assets intentionally **do not** live here — put those in the consuming design package or a thin project adapter.
