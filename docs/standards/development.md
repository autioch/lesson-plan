# Development Guide

Coding conventions, commands, and dev tooling. [CLAUDE.md](../../CLAUDE.md) holds the high-level
rules; [architecture.md](architecture.md) owns the layering, data flow, and source layout;
[security.md](security.md) owns the security posture. Read those for **where code lives and how the
system is built**; read this before writing code for **how to write it here**.

## Conventions

- **Type safety:** use TypeScript where possible. Define types in `src/data/` for data shapes and
  pass them to components.
- **One flat `.astro` file per component** in `src/components/`, no folder and no styles of its
  own. **Split by reason to change, not by size**: extract when a piece changes for a reason its
  container doesn't (a tile vs. the grid holding it), or when it is used twice (`Legend`, in the
  sidebar and the sheet). A `.map()` is a shape, not a reason, and a component with one reason to
  change and one use stays whole however long it gets. The tree:
  [architecture.md](architecture.md#the-component-tree).
- **Styling:** every rule lives in `src/styles/`; components carry no `<style>` block. The
  responsive bands cross component boundaries and scoped styles cannot express them — see
  [styling.md](styling.md#surfaces).
- **No copy in components.** Every user-visible string is a label from `commons.json`, passed in as
  a prop. A hardcoded word in an `.astro` file is a bug, not a shortcut.
- **No dates at build time.** Frontmatter and `src/utils/` must never call `new Date()`: the site is
  generated once a term. The clock is read in exactly one place, `src/scripts/today.ts`.
- **Runtime code lives in `src/scripts/`**, one module per concern, each exporting an entry point
  the page calls. Modules never wire themselves up on import — the page owns the load order, and
  motion depends on it. See [architecture.md](architecture.md#the-runtime-scripts).
- **A script finds elements by a `js-` class, never by a styling one.** `js-day-tab`, `js-plan`,
  `js-swipe-area` — one per element a module queries, named for the **job the script wants**, not
  for the element. That is the whole point of the duplicate class: `js-swipe-area` says why the hook
  is on `.grid`, and grep answers "does anything script this?" in a way `.grid` never could. The
  hooks are listed in [architecture.md](architecture.md#the-runtime-scripts).
  - **A `js-` class is never styled and never carries state.** No CSS rule may select one; adding a
    modifier to it (`js-day-tab--today`) puts styling back on the hook and defeats it.
  - **The other direction keeps its own names.** What a script _writes_ for CSS or assistive tech to
    read — `tab--today`, `plan--ready`, `data-day`, `aria-selected` — is a contract with the reader,
    so those stay BEM modifiers and ARIA. The prefix marks how JS **finds** an element, not
    everything JS touches.
  - **Nothing enforces this.** Removing a hook keeps the gate green and breaks the page silently, so
    a component that exposes one says so in its header.
- **Layout is never a build-time prop.** This is a static site: frontmatter cannot know the
  viewport, so anything that varies by width is decided in CSS. See
  [styling.md](styling.md#surfaces).
- **Only what the app actually uses.** No field a component never reads, no branch the current data
  never reaches, no label nothing renders — and nothing kept "for later" or left behind from a shape
  the plan used to have. Speculative code is not free here: it reads as a requirement, and the next
  person has to prove it is dead before touching it. If the plan grows a case, add the branch then,
  with the data that needs it. **`knip` does not catch this class** — it sees unused files, exports
  and dependencies, not an unread property on a type or an unreachable arm of a conditional. Finding
  those is a manual pass against the real data.
- **One name per concept, JSON to DOM.** A colour is `hex` in `commons.json`, `hex` on a cell, and
  `hex` in the component. **`src/utils/plan.ts` declares a type only for what it derives** — a row,
  a cell, the plan; anything it passes through keeps the data's type and the data's field names, so
  a pass-through needs no `.map()` at all. Rename only when a shape genuinely collides: a cell
  flattens a lesson type and a teacher, so the teacher's name becomes `teacher` because `name` is
  taken. Say why in the type.
- **A field names its content, not where it shows.** Every string a reader can see is `name`, or
  `nameShort` for the abbreviated form — a day, a lesson type, a palette colour all use them, and it
  makes no difference whether the value lands in a text node, a `title`, an `aria-label` or an
  `<option>`. That is why `name` is safe where `title` was not: `name` describes the content, `title`
  named a presentation slot and is a global HTML attribute, so a field called `title` collides the
  moment it meets an element. Never name a data field after an HTML attribute.
- **Data is read-only:** JSON files in `src/data/` are the source of record. Transformations are
  pure functions in TypeScript modules, never mutations.
- **Props are closed:** variant / option props are enums or string literals; content is free-form.
- **Reuse shared components** from `src/components/` instead of duplicating HTML. **A surface is not
  a reason to duplicate one** — screen and paper render the same tree, and the difference is CSS.
  See [styling.md](styling.md#surfaces).
- **Motion is tokenized and optional.** Durations and easing come from `tokens.css`; a hand-written
  `ms` is a bug, because zeroing those tokens is how `prefers-reduced-motion` is honoured. See
  [styling.md](styling.md#motion).
- **Docs and code travel together.** A change to data shape, a new component, or a layout change
  updates this doc in the same commit — never a tree where docs contradict code.

## Adding a feature

1. **Data layer** — extend `src/data/` and its type in `src/data/types.ts`. The three files
   split by change frequency: new copy, colours or day labels go in `commons.json`; a new teacher or
   subject goes in `catalog.json`; only the week itself goes in that year's file — and never into a
   component. A type change must keep the archived years compiling too — they are all merged and
   typed by `src/data/index.ts`.
2. **Components** — add or extend components in `src/components/`.
3. **Page** — mount the component in `src/pages/` where it belongs, or create a new page.
4. **Build and verify** — run `npm run build` and check the output.
5. **Commit** — with a clear message describing what data or UI changed.

**Copy from** — canonical examples for building blocks:

| Building…                    | Copy the pattern from                                                    |
| ---------------------------- | ------------------------------------------------------------------------ |
| Page structure / layout      | [src/pages/index.astro](../../src/pages/index.astro)                     |
| Data type definitions        | [src/data/types.ts](../../src/data/types.ts)                             |
| A school year's week         | [src/data/2026.json](../../src/data/2026.json)                           |
| Shared copy, colours, bells  | [src/data/commons.json](../../src/data/commons.json)                     |
| Teachers and subjects        | [src/data/catalog.json](../../src/data/catalog.json)                     |
| A component reading labels   | [src/components/WeekRow.astro](../../src/components/WeekRow.astro)       |
| A leaf component             | [src/components/LessonCell.astro](../../src/components/LessonCell.astro) |
| A component composing others | [src/components/WeekGrid.astro](../../src/components/WeekGrid.astro)     |
| Build-time transform         | [src/utils/plan.ts](../../src/utils/plan.ts)                             |
| Band-aware layout CSS        | [src/styles/plan.css](../../src/styles/plan.css)                         |
| A paper-only override        | [src/styles/print.css](../../src/styles/print.css)                       |
| A runtime browser module     | [src/scripts/day-select.ts](../../src/scripts/day-select.ts)             |
| The load sequence            | the `<script>` in [src/pages/index.astro](../../src/pages/index.astro)   |

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

[.gitattributes](../../.gitattributes) pins text files to **LF** in both the index and the working
copy, because Git for Windows sets `core.autocrlf=true` system-wide and the gate writes LF — left to
disagree, `npm run verify` leaves untouched files listed as modified with an empty diff. Fix that
class of problem in the attributes file, which travels with the clone, never in one machine's
`core.autocrlf`.

Node is pinned in [.nvmrc](../../.nvmrc); both workflows read it, so local and CI never drift.

## Agent tooling

Permissions live in two files, split by what belongs to the repo and what belongs to a machine:

- **[.claude/settings.json](../../.claude/settings.json)** — tracked. Generic prefix rules for the
  toolchain this repo actually uses: git, npm/npx, `node`, `gh`, the small shell tools, and the
  read-only GitHub MCP tools. **The wildcard form is `Bash(git *)` — a space, not `Bash(git:*)`.**
  The colon form parses as valid JSON, saves without complaint and matches nothing, so the symptom is
  an allowlist that looks right and prompts anyway. **Add a rule in its generic form** rather than
  letting a prompt append a one-off literal — a literal for a command with a path or a session id in
  it can never match twice, which is how an allowlist grows to ninety dead entries.
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

**Two things defeat the allowlist no matter what is in it**, and both are on the caller, not the
config:

- **Shell substitutions.** A command containing `$(…)` or `$?` cannot be matched against a prefix
  rule, so it prompts even when its bare form is allowed, then records a literal that can never match
  again. Read a value in one call and pass it in the next.
- **Chains.** In `a && b; c | d`, every part must be allowed or the whole line prompts. Prefer one
  command per call; the failing fragment is then obvious instead of hidden in a chain.

[.mcp.json](../../.mcp.json) declares GitHub's hosted MCP server, so PRs, issues and checks are
read and written through it rather than by shelling out to `gh`. It authenticates with a
`GITHUB_PAT` environment variable — see [owner-tasks.md](../owner-tasks.md) — and is enabled per
machine via `enabledMcpjsonServers` in `.claude/settings.local.json`. MCP servers connect at session
start, so a new token or a config change needs a restarted session.
