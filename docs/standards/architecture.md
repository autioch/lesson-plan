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
├─ components/       # Astro components (DayTabs, WeekGrid, Legend)
├─ data/             # plans/ — one JSON per school year, the source of record — and its types
├─ layouts/          # Page wrapper (shared head, structure)
├─ pages/            # Astro pages (one per route) and the page script
├─ utils/            # Pure build-time transforms (no rendering, no I/O, no clock)
└─ assets/           # tokens.css, plan.css (screen + the bands paper shares), print.css (deltas)
```

One route: `/`, the responsive plan built to `designs/`. It renders three screen bands and an
A4-landscape print sheet **from one DOM** — there is no second markup tree for paper, and adding one
is a regression, not a shortcut. The sheet is band C's layout at a scale of its own; `print.css`
holds only what paper alone changes. See [styling.md](styling.md#surfaces).

The site is published to GitHub Pages under the project subpath `/lesson-plan/`. That subpath is
defined once in `src/site.mjs`: `astro.config.mjs` feeds it to the build as `base`, and layouts
prefix hand-written asset URLs with `asset()`. Anything referencing an absolute `/…` URL without it
404s in production while working fine locally.

Import aliases: none currently used.

## Data loading & composition

At build time, Astro imports two shared files plus one JSON file per school year, merges and renders
one of them, and passes it through one transform. **The three files are split by how often they
change**, not by who uses them:

- **`src/data/plans/commons.json`** — the school's fixtures, effectively frozen: `locale`, `labels`
  (every fixed string), `palette` (`{ id, hex, legendTitle, inLegend }` — the only place a colour is
  written), `slots` (the bell day: `id`, `start`, `duration`), `days` (`id`, `name`, `short`,
  `weekday`).
- **`src/data/plans/catalog.json`** — the people and subjects the years draw on, append-only:
  `teachers` (`id`, `name`, optional `anonymous`) and `lessonTypes` (`id`, `name`, optional `short`,
  `colorId`). A row is added when a new one appears and edited only to correct it; a teacher who
  leaves keeps their row and the lessons simply stop referencing it. Rows no year references are
  inert — `buildPlan` renders what the lessons point at, so nothing flags a retired row and nothing
  needs to.
- **`src/data/plans/<year>.json`** — one year's week, named for the September it starts. One root
  key, `lessons`: `Day.id` → `Slot.id` → `{ lessonId, teacherId }`. A slot with no entry is free.
- **`src/data/plans/index.ts`** — merges commons and catalog into **every** year to build `plans`,
  and names the live one in `ACTIVE_YEAR`. Only the active year reaches the page; the rest are merged
  purely so `astro check` types them against `LessonsPlan` and a type change names every file it
  breaks. Publishing a new year is one line here — see
  [importing-a-plan.md](../importing-a-plan.md).
- **`src/data/types.ts`** — `PlanCommons`, `PlanCatalog`, `SchoolYear`, and the `LessonsPlan` they
  merge into; the checklist of what may be rendered, and where the lines between the files fall.

Past years are never edited: a published year is a snapshot of the week that hung on the wall. The
split is what makes that affordable — the year file holds only the facts that were true that
September, and the two shared files hold what a correction should reach back and fix everywhere.
That reach is the point for a misspelled name and the hazard for anything else, which is why catalog
rows are appended and never repurposed.

### Data modelling rules

The JSON is shaped as if it were tables that will move to a database one day. That is not a plan to
migrate; it is the discipline that keeps the files honest while they are hand-edited.

- **Every table has an `id`, and references use it.** `palette`, `teachers`, `lessonTypes`, `slots`
  and `days` all carry one; `colorId`, `lessonId`, `teacherId` and the two levels of `lessons` are
  foreign keys to them. **Nothing is referenced by array position** — order is presentation, and a
  row inserted mid-list must never re-point an existing reference.
- **An id is opaque and permanent, display text is not.** `Slot.id` is `s1` and `Teacher.id` is
  `t1`, never the start time or the name, because bell times move and people are renamed, and a key
  that is also displayed data starts lying the day it changes. `Day.id` (`mon`) and `LessonType.id`
  (`wf-ew`) are readable only because a day's or a subject's identity genuinely cannot change.
- **A retired id is never reused, and ids are unique across years.** One quietly pointing at a
  different subject, colour or hour repaints the plan and nothing fails. This is why `teachers` and
  `lessonTypes` are one shared table rather than a copy per year: while they were per-year, `t3`
  named a different person in each file and nothing could see it.
- **Absence is a fact, not a blank row.** A free slot has no entry; there is no empty-lesson shape.
- **Every foreign key is resolved, never trusted.** `src/utils/plan.ts` throws on any id that does
  not resolve and on any `lessons` key that names no day or slot. A school timetable with a blank
  tile is worse than a red build.

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
| Teachers, lesson types                          | `src/data/plans/catalog.json`                       |
| The schedule itself                             | `src/data/plans/<year>.json`                        |
| Derived render shape                            | `src/utils/plan.ts`                                 |
| Render logic and HTML structure                 | `src/components/`                                   |
| Theme — type scale, spacing, surfaces, text ink | `src/assets/tokens.css`                             |
| Page routing                                    | `src/pages/`                                        |
| Today, and the selected day (≤480px only)       | `data-day` on the page root, set by the page script |

## Design goals

Single source of truth · data separate from render · repeatable build output · no runtime fetching
or state mutation.
