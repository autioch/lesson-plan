# Architecture

The authority on how the app is layered and where its code lives. [security.md](security.md) owns
the auth / rules / write-path posture; [development.md](development.md) owns coding conventions and
commands.

## Layering

This is a static site generated at build time. No runtime layers in the traditional sense; instead:

```text
Read:   JSON files → component rendering → static HTML
```

| Layer               | Does                                                                                            | Must not                                                 |
| ------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **JSON files**      | Source of record for everything displayed: schedule, palette, day names, and every fixed string | Hold HTML, rendering logic, or component state           |
| **Data processing** | Transform JSON into the shape components need; computed fields (derived times, timetable grids) | Be intermingled with component rendering; read the clock |
| **Components**      | Render headers, cells, and document structure; read the processed data                          | Load or transform JSON directly; hold logic or copy      |
| **Page script**     | The two runtime facts: which weekday it is, and which day the phone shows                       | Hold data, copy, or layout decisions                     |

Core rules:

- **Data is immutable.** The JSON file is the source of record; all transformations are computed at
  build time or in pure functions.
- **Components are presentation-only.** They read prepared data and render HTML; no data fetching,
  no logic beyond layout and markup decisions, and no copy of their own — every visible string is a
  label from the data.
- **Nothing user-visible lives outside the plan data.** Colours, day names and abbreviations, page
  title, "DZIŚ", "wolne", the legend titles and the break templates are all data. Code holds
  structure; CSS holds theme.
- **The build never reads the clock.** The site is generated once a term, so "today" is a runtime
  fact — see [Today](#today).

## Source layout

```text
src/
├─ components/       # Astro components (DayTabs, WeekGrid, Legend, PrintSheet)
├─ data/             # plans/ — one JSON per school year, the source of record — and its types
├─ layouts/          # Page wrapper (shared head, structure)
├─ pages/            # Astro pages (one per route) and the page script
├─ utils/            # Pure build-time transforms (no rendering, no I/O, no clock)
└─ assets/           # tokens.css, plan.css (screen), print.css
```

One route: `/`, the responsive plan built to `designs/`. It renders three screen bands and an
A4-landscape print sheet from the same DOM.

The site is published to GitHub Pages under the project subpath `/lesson-plan/`. That subpath is
defined once in `src/site.mjs`: `astro.config.mjs` feeds it to the build as `base`, and layouts
prefix hand-written asset URLs with `asset()`. Anything referencing an absolute `/…` URL without it
404s in production while working fine locally.

Import aliases: none currently used.

## Data loading & composition

At build time, Astro imports the shared file plus one JSON file per school year, merges and renders
one of them, and passes it through one transform:

- **`src/data/plans/commons.json`** — what the school fixes and a year does not: `locale`, `labels`
  (every fixed string), `palette` (`{ id, hex, legendTitle, inLegend }` — the only place a colour is
  written), `slots` (the bell day), `days` (`name`, `short`, `weekday`).
- **`src/data/plans/<year>.json`** — what one year decides, named for the September it starts. Root
  keys: `teachers`, `lessonTypes` (referencing a colour by `colorId`), and `lessons` — the week,
  keyed by day name, one entry per slot in `slots` order.
- **`src/data/plans/index.ts`** — merges commons into **every** year to build `plans`, and names the
  live one in `ACTIVE_YEAR`. Only the active year reaches the page; the rest are merged purely so
  `astro check` types them against `LessonsPlan` and a type change names every file it breaks.
  Publishing a new year is one line here — see [importing-a-plan.md](../importing-a-plan.md).
- **`src/data/types.ts`** — `PlanCommons`, `SchoolYear`, and the `LessonsPlan` they merge into; the
  checklist of what may be rendered, and where the line between the two files falls.

Past years are never edited: a published year is a snapshot of the week that hung on the wall. The
split is what makes that affordable — an edit to commons reaches back into published years, which is
accepted for copy, colours and bell times and for nothing else.

`src/pages/index.astro` reads the active year once and `src/utils/plan.ts` turns it into the render shape
(shared row set, breaks, cells, legend). Components lay that out and compute nothing. A reference
that does not resolve — an unknown `lessonId`, `colorId` or `teacherId` — throws and fails the
build rather than rendering a blank tile.

## Today

The site is built once a term, so a weekday baked into the HTML would be wrong the next morning.
Nothing in `src/utils/` may read the clock: the build emits no today marks and opens on Monday.
The page script in `index.astro` reads `new Date()`, matches it against the `data-weekday` each day
carries from the data, and applies the marks and the initial day selection. A page with JavaScript
off shows Monday, unmarked.

## State ownership

Static site; the only runtime state is which day a phone is showing.

| Data                                            | Owner                                               |
| ----------------------------------------------- | --------------------------------------------------- |
| Palette, copy, bell times, day names            | `src/data/plans/commons.json`                       |
| Schedule, teachers, lesson types                | `src/data/plans/<year>.json`                        |
| Derived render shape                            | `src/utils/plan.ts`                                 |
| Render logic and HTML structure                 | `src/components/`                                   |
| Theme — type scale, spacing, surfaces, text ink | `src/assets/tokens.css`                             |
| Page routing                                    | `src/pages/`                                        |
| Today, and the selected day (≤480px only)       | `data-day` on the page root, set by the page script |

## Design goals

Single source of truth · data separate from render · repeatable build output · no runtime fetching
or state mutation.
