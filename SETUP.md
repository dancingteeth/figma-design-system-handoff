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
You want: `get_metadata`, `get_design_context`, `get_variable_defs`,
`get_screenshot`.

## 3. Node.js — only for the small helper scripts

The skill ships tiny scripts (extract primitives, token drift check, package
verification). They need Node; the main workflow does not.

- macOS: `brew install node` — or the LTS installer from nodejs.org
- Windows: LTS installer from nodejs.org
- Verify: `node -v` → any current LTS (v20+)

## 4. Install this skill

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

1. In Figma, right-click the frame that represents the design → **Copy link to
   selection**.
2. Tell the agent: **"Use the figma-design-system-handoff skill on \<URL\>."**
3. The agent runs an 8-step workflow and will pause to ask you for:
   - where the design system should live (accept the proposed
     `packages/design-system/` or point at your existing package),
   - the token prefix — your brand slug, e.g. `acme`,
   - which frames are the responsive targets (desktop / tablet / mobile),
   - who approves token and release decisions.
4. You get a four-block summary: what was found in Figma, which tokens were
   added or changed, which files were touched, and what was verified.

## If you don't have (or want) a dev environment

- Steps 1–3 (inventory, measurements, reconcile plan) run entirely in the agent
  + Figma — no Node required.
- The helper scripts need Node (§3).
- Visual/build validation needs the frontend's dev server. If you don't have
  one, hand that gate to the frontend engineer — the skill records unrun gates
  as **unverified** instead of claiming parity.

## What to hand the frontend afterwards

- the design package path + the four-block summary,
- the per-screen `<SCREEN>_DS.md` parity doc,
- one instruction: consume tokens and primitives (`<prefix>-btn`,
  `var(--color-<prefix>-…)`) instead of copying hex values into components.
