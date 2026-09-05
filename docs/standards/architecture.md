# Architecture

The authority on how the app is layered and where its code lives. [security.md](security.md) owns
the auth / rules / write-path posture; [development.md](development.md) owns coding conventions and
commands.

## Layering

This is a static site generated at build time. No runtime layers in the traditional sense; instead:

```text
Read:   JSON files → component rendering → static HTML
```

A service worker caches that static output for offline use — see
[Offline caching](#offline-caching). It changes nothing above: the build is still the source of the
pages it serves.

| Layer               | Does                                                                                                                                                          | Must not                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **JSON files**      | Source of record for everything displayed: schedule, palette, day names, and every fixed string                                                               | Hold HTML, rendering logic, or component state           |
| **Data processing** | Transform JSON into the shape components need; computed fields (derived times, timetable grids)                                                               | Be intermingled with component rendering; read the clock |
| **Components**      | Render headers, cells, and document structure; read the processed data                                                                                        | Load or transform JSON directly; hold logic or copy      |
| **Runtime scripts** | The two runtime facts — which weekday it is, which day the phone shows — plus the legend sheet. The page sequences them and arms motion once they are applied | Hold data, copy, or layout decisions                     |

Core rules:

- **Data is immutable.** The JSON file is the source of record; all transformations are computed at
  build time or in pure functions.
- **Components are presentation-only.** They read prepared data and render HTML; no data fetching,
  no logic beyond layout and markup decisions, and no copy of their own — every visible string is a
  label from the data.
- **Nothing user-visible lives outside the plan data.** Colours, day names and abbreviations, page
  title, "DZIŚ", "wolne", the legend titles and the break template are all data. Code holds
  structure; CSS holds theme.
- **The build never reads the clock.** The site is generated once a term, so "today" is a runtime
  fact — see [Today](#today).

## Source layout

```text
src/
├─ components/       # Astro components, split by reason to change (see below)
├─ data/             # the plan JSON (two shared files + one per school year), its types, the merge
├─ layouts/          # Page wrapper (shared head, structure)
├─ pages/            # Astro pages (one per route); the page owns the load sequence
├─ scripts/          # Runtime browser modules — the only code allowed to read the clock
├─ utils/            # Pure build-time transforms (no rendering, no I/O, no clock)
└─ styles/           # tokens.css, plan.css (screen + the bands paper shares), print.css (deltas)
```

`public/` holds the files copied verbatim into the build root: the `favicon.svg`, the web app
manifest, and `sw.js`, the offline service worker (see [Offline caching](#offline-caching)).

One route: `/`, the responsive plan built to `designs/`. It renders three screen bands and an
A4-landscape print sheet **from one DOM** — there is no second markup tree for paper, and adding one
is a regression, not a shortcut. The sheet is band C's layout at a scale of its own; `print.css`
holds only what paper alone changes. See [styling.md](styling.md#surfaces).

The site is published to GitHub Pages under the project subpath `/lesson-plan/`. That subpath is
defined once in `src/site.mjs`: `astro.config.mjs` feeds it to the build as `base`, and layouts
prefix hand-written asset URLs with `asset()`. Anything referencing an absolute `/…` URL without it
404s in production while working fine locally.

Import aliases: none currently used.

### The component tree

```text
index.astro          the current-year page: reads its year, composes, sequences the runtime scripts
├─ DayTabs           day selection — band A only
├─ WeekGrid          the grid frame
│  ├─ GridHead       the day-name band
│  └─ WeekRow        one hour: the time gutter, then the days
│     └─ LessonCell  one slot — a lesson tile, or the free slot in its place
├─ Legend            the colour list (sidebar, band C and paper)
└─ LegendSheet       the "?" button and its sheet (bands A and B) — wraps Legend
```

**Split by reason to change**, not by size. `LessonCell` changes when a tile does — colour, the
name/nameShort pair, the teacher line; `WeekGrid` changes when the grid does. `Legend` is its own file
because it renders twice. Components with one reason to change and one use stay whole: a `.map()` is
a shape, not a responsibility.

Astro components emit no wrapper element, so this tree produces the same flat DOM the CSS targets —
every rule in `plan.css` is a plain class selector and none of them depends on the component
boundaries above.

### The runtime scripts

`src/scripts/` holds the browser modules, split the same way: `today.ts` (the clock and its marks),
`day-select.ts` (tabs, swipe, `data-day`), `legend-sheet.ts` (the "?" sheet). Each queries its own
elements and exports one entry point.

**The page owns the order, not the modules.** `index.astro`'s `<script>` calls them in sequence and
then arms motion — the starting day must land before `plan--ready`, or every load slides in from
Monday. A module that wired itself up on import would lose that guarantee, which is why none of
them do.

**Scripts find elements by `js-` hooks, never by a styling class.** The full set, and nothing else
crosses the line:

| Hook                                   | On                 | Read by                        |
| -------------------------------------- | ------------------ | ------------------------------ |
| `js-plan`                              | the page root      | `day-select.ts`, `index.astro` |
| `js-day-tabs`                          | the tablist        | `today.ts` (the today label)   |
| `js-day-tab`                           | each day tab       | `today.ts`, `day-select.ts`    |
| `js-day-head`                          | each day-name cell | `today.ts`                     |
| `js-swipe-area`                        | the grid           | `day-select.ts`                |
| `js-legend-button` / `js-legend-sheet` | the "?" pair       | `legend-sheet.ts`              |

A hook is named for the **job**, not the element — `js-swipe-area` sits on `.grid` and says why.
Traffic the other way is not a hook: `tab--today`, `dayhead--today`, `plan--ready`, `data-day` and
`aria-selected` are written by a script and read by CSS or assistive tech, so they keep the reader's
naming. See [development.md](development.md#conventions) for the rule.

### Offline caching

`public/sw.js` is a service worker registered from `Layout.astro`. It exists so a schedule people
check on phones in a low-signal building stays readable offline. It caches at runtime — nothing is
precached — so the cache fills from what a visitor loads while online. Its strategy is fixed by what
the request is: a **page navigation** is network-first with a short timeout, its fetch bypassing the
HTTP cache so any online load — reload or re-open — gets the freshly published plan while offline
falls back to the last page seen; a hashed
`/_astro/` asset is cache-first (the content hash means a cached copy is never stale), and everything
else same-origin is stale-while-revalidate. The `CACHE` constant is bumped only when the worker's own
logic changes; the rest of the file's rationale lives in its header. The web manifest beside it makes
the site installable.

**Nothing enforces the hooks.** Drop one in a component and the matching script goes quiet — no
error, no failed build, and the gate stays green. The prefix makes the dependency greppable, which
is the only guarantee on offer; each component exposing a hook names it in its header.

## Data loading & composition

At build time, Astro imports two shared files plus one JSON file per school year, merges and renders
one of them, and passes it through one transform. **The three files are split by how often they
change**, not by who uses them:

- **`src/data/commons.json`** — the school's fixtures, effectively frozen: `locale`, `labels`
  (every fixed string), `palette` (`{ id, hex, name, inLegend }` — the only place a colour is
  written), `slots` (the bell day: `id`, `start`, `duration`), `days` (`id`, `name`, `nameShort`,
  `weekday`).
- **`src/data/catalog.json`** — the people and subjects the years draw on, append-only:
  `teachers` (`id`, `name`, optional `anonymous`) and `lessonTypes` (`id`, `name`, optional `nameShort`,
  `colorId`). A row is added when a new one appears and edited only to correct it; a teacher who
  leaves keeps their row and the lessons simply stop referencing it. Rows no year references are
  inert — `buildPlan` renders what the lessons point at, so nothing flags a retired row and nothing
  needs to.
- **`src/data/<year>.json`** — one year's week, named for the September it starts. One root
  key, `lessons`: `Day.id` → `Slot.id` → `{ lessonId, teacherId }`. A slot with no entry is free.
- **`src/data/index.ts`** — merges commons and catalog into **every** year to build `plans`, keyed
  by the September the year starts. Each page picks its own year out of `plans`; every year is merged
  and typed, not just the current one, so a `LessonsPlan` change names every file it breaks via
  `astro check`. Registering a year is one import and one line here — see
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

Each page reads its own year once and `src/utils/plan.ts` turns it into the render shape
(shared row set, breaks, cells, legend). Components lay that out and compute nothing. A reference
that does not resolve — an unknown `lessonId`, `colorId` or `teacherId` — throws and fails the
build rather than rendering a blank tile.

**The transform derives; it does not rename.** `PlanRow` and `PlanCell` exist because a time range,
a break and a flattened tile are genuinely computed. Days and legend colours are not: `Plan.days` is
`Day[]` and `Plan.legend` is `PaletteColor[]`, both straight from `src/data/types.ts`, so the legend
is a `filter` with no `map` behind it and a component reads `hex` and `name` — the names the
JSON uses. A pass-through row carries its `id` unread, which is the deliberate trade: `Plan` is a
build-time value that never reaches the browser, so the cost is nil, and a projection whose only job
is to strip fields nobody looks at is itself code with no reason to exist. See
[development.md](development.md#conventions).

## Today

The site is built once a term, so a weekday baked into the HTML would be wrong the next morning.
Nothing in `src/utils/` may read the clock: the build emits no today marks and opens on Monday.
`src/scripts/today.ts` is the one module that calls `new Date()`. It matches the clock against the
`data-weekday` each day carries from the data and applies the marks; `index.astro` passes the same
index to `initDaySelect` as the opening day. A page with JavaScript off shows Monday, unmarked.

## State ownership

Static site; the only in-page runtime state is which day a phone is showing. The service worker also
keeps a runtime cache of the built output for offline use — see [Offline caching](#offline-caching).

| Data                                               | Owner                                              |
| -------------------------------------------------- | -------------------------------------------------- |
| Palette, copy, bell times, day names               | `src/data/commons.json`                            |
| Teachers, lesson types                             | `src/data/catalog.json`                            |
| The schedule itself                                | `src/data/<year>.json`                             |
| Derived render shape                               | `src/utils/plan.ts`                                |
| Render logic and HTML structure                    | `src/components/`                                  |
| Theme — type scale, spacing, surfaces, ink, motion | `src/styles/tokens.css`                            |
| Page routing                                       | `src/pages/`                                       |
| Today, and the selected day (≤480px only)          | `data-day` on the page root, set by `src/scripts/` |

## Design goals

Single source of truth · data separate from render · repeatable build output · no runtime fetching
or state mutation.
