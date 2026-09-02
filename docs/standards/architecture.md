# Architecture

The authority on how the app is layered and where its code lives. [security.md](security.md) owns
the auth / rules / write-path posture; [development.md](development.md) owns coding conventions and
commands.

## Layering

This is a static site generated at build time. No runtime layers in the traditional sense; instead:

```text
Read:   JSON files → component rendering → static HTML
```

| Layer               | Does                                                                                            | Must not                                             |
| ------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **JSON files**      | Source of record for lesson data, teacher lists, time slots, lesson types                       | Hold HTML, rendering logic, or component state       |
| **Data processing** | Transform JSON into the shape components need; computed fields (derived times, timetable grids) | Be intermingled with component rendering             |
| **Components**      | Render tables, headers, cells, and document structure; read the processed data                  | Load or transform JSON directly; hold business logic |

Core rules:

- **Data is immutable.** JSON files are the source of record; all transformations are computed at
  build time or in pure functions.
- **Components are presentation-only.** They read prepared data and render HTML; no data fetching,
  no logic beyond layout and markup decisions.

## Source layout

```text
src/
├─ components/       # Astro components (tables, rows, cells, page structure)
├─ data/             # JSON source files and TypeScript type definitions
├─ layouts/          # Page wrapper (shared head, structure)
├─ pages/            # Astro pages (one per route)
├─ utils/            # Pure build-time transforms (no rendering, no I/O)
└─ assets/           # Static images, fonts, stylesheets
```

Two routes today: `/` is the original A4-style table, `/v2` the responsive plan built to
`designs/`. They share the data and nothing else.

The site is published to GitHub Pages under the project subpath `/lesson-plan/`. That subpath is
defined once in `src/site.mjs`: `astro.config.mjs` feeds it to the build as `base`, and layouts
prefix hand-written asset URLs with `asset()`. Anything referencing an absolute `/…` URL without it
404s in production while working fine locally.

Import aliases: none currently used.

## Data loading & composition

At build time, Astro imports JSON files from `src/data/` and passes them to components:

- **lessons.json** — the full timetable: teacher assignments, room numbers, times, lesson types
- **lessonTypes.ts** — the catalog of lesson types with icons and colors

All composition happens in the page layout or a top-level component that reads the data once and
passes it down. No per-component data loading.

For `/v2`, `src/utils/v2/plan.ts` is that single read: it turns the JSON into the render shape
(shared row set, breaks, cells, legend groups, ink colours) and the components lay it out without
computing anything. Choices about how the data is *shown* — name abbreviations, legend group
titles — sit beside it in `presentation.ts`, out of the data.

## State ownership

Static site; the only runtime state is which day a phone is showing.

| Data                                    | Owner                                              |
| --------------------------------------- | -------------------------------------------------- |
| Lesson schedule, teachers, lesson types | JSON files in src/data/                            |
| Derived render shape                    | src/utils/                                         |
| Render logic and HTML structure         | src/components/                                    |
| Page routing                            | src/pages/                                         |
| Selected day, today (≤480px only)       | `data-day` on the page root, set by the v2 page script |

## Design goals

Single source of truth · data separate from render · repeatable build output · no runtime fetching
or state mutation.
