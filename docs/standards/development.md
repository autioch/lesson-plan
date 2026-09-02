# Development Guide

Coding conventions, commands, and dev tooling. [CLAUDE.md](../../CLAUDE.md) holds the high-level
rules; [architecture.md](architecture.md) owns the layering, data flow, and source layout;
[security.md](security.md) owns the security posture. Read those for **where code lives and how the
system is built**; read this before writing code for **how to write it here**.

## Conventions

- **Components are Astro files** — use `.astro` for page structure and `.astro` for UI components.
  Keep files small and focused on one element or feature.
- **Type safety:** use TypeScript where possible. Define types in `src/data/` for data shapes and
  pass them to components.
- **One folder per component**, holding its implementation and any component-local styles.
- **Styling:** use scoped styles inside `.astro` files with `<style>` tags, or shared stylesheets
  in `src/assets/`. Rules that cross component boundaries — the responsive bands — belong in the
  shared stylesheet; scoped styles cannot express them.
- **No copy in components.** Every user-visible string is a label from `commons.json`, passed in as
  a prop. A hardcoded word in an `.astro` file is a bug, not a shortcut.
- **No dates at build time.** Frontmatter and `src/utils/` must never call `new Date()`: the site is
  generated once a term. Anything that depends on the day belongs in the page script.
- **Layout is never a build-time prop.** This is a static site: frontmatter cannot know the
  viewport, so anything that varies by width is decided in CSS. See
  [styling.md](styling.md#surfaces).
- **Data is read-only:** JSON files in `src/data/` are the source of record. Transformations are
  pure functions in TypeScript modules, never mutations.
- **Props are closed:** variant / option props are enums or string literals; content is free-form.
- **Reuse shared components** from `src/components/` instead of duplicating HTML.
- **Docs and code travel together.** A change to data shape, a new component, or a layout change
  updates this doc in the same commit — never a tree where docs contradict code.

## Adding a feature

1. **Data layer** — extend `src/data/plans/` and its type in `src/data/types.ts`. The three files
   split by change frequency: new copy, colours or day labels go in `commons.json`; a new teacher or
   subject goes in `catalog.json`; only the week itself goes in that year's file — and never into a
   component. A type change must keep the archived years compiling too — they are all merged and
   typed by `src/data/plans/index.ts`.
2. **Components** — add or extend components in `src/components/`.
3. **Page** — mount the component in `src/pages/` where it belongs, or create a new page.
4. **Build and verify** — run `npm run build` and check the output.
5. **Commit** — with a clear message describing what data or UI changed.

**Copy from** — canonical examples for building blocks:

| Building…                   | Copy the pattern from                                                  |
| --------------------------- | ---------------------------------------------------------------------- |
| Page structure / layout     | [src/pages/index.astro](../../src/pages/index.astro)                   |
| Data type definitions       | [src/data/types.ts](../../src/data/types.ts)                           |
| A school year's week        | [src/data/plans/2026.json](../../src/data/plans/2026.json)             |
| Shared copy, colours, bells | [src/data/plans/commons.json](../../src/data/plans/commons.json)       |
| Teachers and subjects       | [src/data/plans/catalog.json](../../src/data/plans/catalog.json)       |
| A component reading labels  | [src/components/WeekGrid.astro](../../src/components/WeekGrid.astro)   |
| Build-time transform        | [src/utils/plan.ts](../../src/utils/plan.ts)                           |
| Band-aware layout CSS       | [src/assets/plan.css](../../src/assets/plan.css)                       |
| Runtime (clock, day pick)   | the `<script>` in [src/pages/index.astro](../../src/pages/index.astro) |

## Keeping docs in sync

Two doc classes, two rules:

- **Durable docs** — CLAUDE.md, README.md, and every doc under `docs/` — describe the **current**
  state. They must never contradict the code.
- **Working notes** — a plan file for an in-flight multi-session feature — are scratch. They are
  deleted at close-out; the durable record is the commit history.

Durable docs stay current two ways:

- **Per commit (scoped, primary):** a commit that changes code or config updates the durable docs
  that change affects, in the _same commit_ — use the map below to find which. Local and cheap:
  touch only what the change touches.
- **Per iteration (full, backstop):** the close-out of a feature-sized change runs one repo-wide
  **reconcile** auditing all durable docs against the code, fixing whatever the per-commit passes
  missed.

**Doc-sync map** — when you change… update these.

| Change                             | Sync these durable docs                                             |
| ---------------------------------- | ------------------------------------------------------------------- |
| Data shape (JSON / types)          | `architecture.md`; this guide (Copy-from)                           |
| User-visible copy or a colour      | `commons.json` only — no doc change, but never a component          |
| A new teacher or subject           | `catalog.json` only — no doc change; append a row, never repurpose  |
| A new school year published        | `docs/importing-a-plan.md` if the procedure itself changed          |
| New component or changed structure | this guide (Copy-from); `architecture.md` (layout)                  |
| New page or route                  | this guide (Copy-from); README.md if user-facing                    |
| Build config or command            | this guide (command reference); CLAUDE.md if the gate story changes |
| Styling / UI convention            | this guide (Conventions); [styling.md](styling.md)                  |
| Product behavior / content         | README.md; any user-facing docs                                     |
| Working method / process change    | CLAUDE.md (the routing table); `docs/workflow.md`                   |

The map is the single lookup both the per-commit sync and the retro reconcile use — keep it current
when you add a new doc or code area.

## Full command reference

| Command             | Purpose                                               |
| ------------------- | ----------------------------------------------------- |
| `npm run dev`       | Dev server with hot reload                            |
| `npm run build`     | Production static build. Confirms compile.            |
| `npm run preview`   | Preview the production build locally                  |
| `npm run ci:ts`     | `astro check` — types, including `.astro` frontmatter |
| `npm run ci:lint`   | ESLint over JS/TS, `.astro`, CSS, JSON and Markdown   |
| `npm run ci:knip`   | Unused files, exports, types and dependencies         |
| `npm run ci:format` | `prettier --check .`                                  |
| `npm run ci`        | All four, in that order — read-only                   |
| `npm run fix`       | `eslint --fix` then `prettier --write`                |
| `npm run verify`    | `fix`, then `ci`, then `build` — **the gate**         |

One tool sits outside npm: `node scripts/read-plan-pdf.mjs <pdf> [class]` prints a class's week out
of the school's timetable PDF, once a year. See [importing-a-plan.md](../importing-a-plan.md).

**The gate** is `npm run verify`. There are **no git hooks in this repo** — run it yourself before
pushing. CI is the authority: [ci.yml](../../.github/workflows/ci.yml) runs `ci` + `build` on every
pull request, and [deploy.yml](../../.github/workflows/deploy.yml) re-runs them on `main` before
deploying. CI runs `ci`, never `fix` — a check that rewrites files is not a check.

Configs: [eslint.config.mjs](../../eslint.config.mjs),
[prettier.config.mjs](../../prettier.config.mjs), [knip.json](../../knip.json). `designs/` is
excluded from all of them — it is a verbatim design snapshot, not our code.

Node is pinned in [.nvmrc](../../.nvmrc); both workflows read it, so local and CI never drift.

## Agent tooling

Permissions live in two files, split by what belongs to the repo and what belongs to a machine:

- **[.claude/settings.json](../../.claude/settings.json)** — tracked. Generic `Bash(cmd:*)` prefix
  rules for the toolchain this repo actually uses: git's local operations, npm/npx, `node`, and the
  small shell tools. **Add a rule here in its generic form** rather than letting a prompt append a
  one-off literal — a literal for a command with a path or a session id in it can never match twice,
  which is how an allowlist grows to ninety dead entries.
- **[.claude/settings.local.json](../../.claude/settings.local.json)** — gitignored. Only what is
  true of one machine: enabled MCP servers, absolute scratchpad paths.

Anything not listed still prompts. Three categories stay that way on purpose: **anything leaving the
machine** (`git push`, `gh pr create`, `gh pr merge`) is in `ask`, because
[CLAUDE.md](../../CLAUDE.md) requires it regardless of what else is allowed; **`sed -i`** is absent
so in-place rewrites of source go through the Edit tool, where the diff is visible; and **command
dispatchers** (`xargs`, `sh -c`, `eval`) are absent so a chain cannot launder a command past those
`ask` rules.

**The allowlist is friction control, not a security boundary.** `Bash(node:*)` is arbitrary code
execution, so a determined process could reach anything the shell can — the `ask` entries are a
speed bump and a reminder, and the actual guard on pushing, publishing or deleting is
[CLAUDE.md](../../CLAUDE.md#working-style). Widen the list for convenience; don't mistake it for
a control.

**A newly created `settings.json` is not picked up mid-session** — the watcher only sees edits to a
file that existed at session start. Symptom: prompts for commands the tracked file already allows,
and duplicates of those rules appearing in `settings.local.json`. Restart the session.

[.mcp.json](../../.mcp.json) declares GitHub's hosted MCP server, so PRs, issues and checks are
read and written through it rather than by shelling out to `gh`. It authenticates with a
`GITHUB_PAT` environment variable — see [owner-tasks.md](../owner-tasks.md) — and is enabled per
machine via `enabledMcpjsonServers` in `.claude/settings.local.json`. MCP servers connect at session
start, so a new token or a config change needs a restarted session.
