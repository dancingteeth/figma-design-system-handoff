---
tags:
  - agent_skills
---
# Setup — for designers (and anyone without a dev environment)

You have a **finished Figma design**. A PM, frontend engineer, or founder asked
you to "turn this into a design system" or "make the product match the Figma."
This skill does the heavy lifting through an AI agent; you approve decisions
and check results. **No coding background assumed.**

Total one-time setup: ~15 minutes.

## 1. An AI coding agent

Pick any agent that reads `SKILL.md` skills:

- **Cursor** (cursor.com) — reads `.cursor/skills/`
- **Claude Code** — reads `.claude/skills/`
- **Codex CLI** — point it at the skill files via `AGENTS.md`
- any other agent that supports `SKILL.md`

## 2. Figma MCP connection — how the agent "sees" your Figma

MCP is the bridge between the agent and Figma. Two ways — pick one:

- **Figma desktop app (easiest for designers).** Open your file in the Figma
  desktop app, then **Figma menu → Preferences → Enable Dev Mode MCP Server**.
  The agent reads the file you have open — no keys or URLs to copy. Requires a
  Figma plan/seat that includes MCP access (check Figma's current plan docs).
- **Remote MCP server.** Your agent connects to Figma's hosted MCP endpoint
  (OAuth sign-in); you pass a file link with each request. Configured in your
  agent's MCP/tools settings.

Figma's Help Center article **"Dev Mode MCP Server"** (help.figma.com) has the
exact config snippet to paste into each agent.

**Quick check it works** — ask the agent: *"what Figma MCP tools do you have?"*
Map whatever names come back to these roles: **structure**, **design context**,
**variables**, and **screenshot**. Common names are `get_metadata`,
`get_design_context`, `get_variable_defs`, `get_screenshot` — but they are **not**
universal across MCP servers.

## 3. Prepare the Figma file (Auto Layout + Components)

Agents extract spacing, sizing, and reusable controls much more accurately when
the file is structured for product UI — not as a freeform artboard.

### Why this matters

| Figma practice | What the agent can read |
| --- | --- |
| **Auto Layout** on stacks/rows/cards | Direction, gap, padding, HUG/FILL/FIXED — maps cleanly to flex/grid |
| **Components + variants** | Buttons, inputs, tabs, badges as reusable primitives with states |
| Absolute-positioned freeform layers | Only x/y/width/height — more one-off page chrome, weaker responsive rules |

You do **not** need a perfect design system in Figma first. A finished screen that
uses Auto Layout on major sections and Components for repeated controls is enough.

### Minimum checklist before handoff

1. Wrap major sections (sidebar, header, card stacks, table rows, button groups)
   in **Auto Layout** (Shift+A) instead of placing every layer by hand.
2. Convert repeated controls into **Components**. Add variants for states you
   actually designed (default / hover / pressed / disabled / error) — do not invent
   states the file never shows.
3. Prefer **Fill** / **Hug** over fixed widths when the layout should flex.
4. Keep decorative glows/illustrations as absolute children when needed — that is
   fine; put the structural chrome in Auto Layout.
5. If the file is mostly freeform and you cannot restructure yet, still run the
   skill — tell the agent. It will mark layout semantics as incomplete and lean
   harder on screenshots + page-chrome tokens.

Figma Help: search **"Add auto layout"** and **"Create and use components"** on
help.figma.com.

## 4. Node.js — only for the small helper scripts

The skill ships tiny scripts (extract primitives, token drift check, package
verification). They need Node; the main workflow does not.

- macOS: `brew install node` — or the LTS installer from nodejs.org
- Windows: LTS installer from nodejs.org
- Verify: `node -v` → any current LTS (v20+)

## 5. Install this skill

```bash
npx skills add dancingteeth/figma-design-system-handoff
```

Or copy the files into your project's agent skills directory (paths in
[README.md](./README.md#install)). Then prove the helpers work — no Figma
session needed:

```bash
node <skill-dir>/scripts/self-test.mjs
```

## Your first run

1. Run the [Prepare the Figma file](#prepare-the-figma-file) checklist (or note
   that the file is still freeform).
2. In Figma, right-click the frame that represents the design → **Copy link to
   selection**.
3. Tell the agent: **"Use the figma-design-system-handoff skill on \<URL\>."**
4. The agent runs an 8-step workflow and will pause to ask you for:
   - where the design system should live (accept the proposed
     `packages/design-system/` or point at your existing package),
   - the token prefix — your brand slug, e.g. `acme`,
   - which frames are the responsive targets (desktop / tablet / mobile),
   - who approves token and release decisions.
5. You get a four-block summary: what was found in Figma, which tokens were
   added or changed, which files were touched, and what was verified.

## If you don't have (or want) a dev environment

- Steps 1–3 (inventory, measurements, reconcile plan) run entirely in the agent
  + Figma — no Node required.
- The helper scripts need Node (§4).
- Visual/build validation needs the frontend's dev server. If you don't have
  one, hand that gate to the frontend engineer — the skill records unrun gates
  as **unverified** instead of claiming parity.
- Figma MCP usually needs a Figma plan/seat that includes Dev Mode MCP. Without
  it, inventory/measurement against live Figma cannot run — use offline dumps
  only if you already have them.

## What to hand the frontend afterwards

- the design package path + the four-block summary,
- the per-screen `<SCREEN>_DS.md` parity doc,
- one instruction: consume tokens and primitives (`<prefix>-btn`,
  `var(--color-<prefix>-…)`) instead of copying hex values into components.
