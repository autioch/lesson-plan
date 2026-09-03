# Domain — Lesson Planning

The product's vision, glossary, and user scenarios. The data model and file split live in
[architecture.md](../standards/architecture.md#data-loading--composition); this doc is the _why_
behind them.

## Vision

**Lesson Plan renders one school class's weekly timetable** — currently class 1b, a Polish
early-primary class, for the 2026 school year. It is not a scheduling app for a whole school: there
is one class, one published week, no rooms, no accounts, no editing in the browser. The week is
transcribed from the school's PDF once a term, committed as JSON, and published as a static page.

Two readers, both binding. A **parent or child** opens it on a phone during the week to answer
"what does 1b have today, and do we need to pack anything for it". An **administrator** — in practice
the family maintaining the repo — prints it once a term for the wall. Everything below serves those
two, and the product says no to anything that doesn't.

## Glossary

The terms the data actually carries. Ids are opaque and permanent; display text is not — see
[architecture.md](../standards/architecture.md#data-modelling-rules).

| Term                 | Definition                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Lesson**           | One slot on one day for this class: a `{ lessonId, teacherId }` pair. A slot with no lesson is free ("wolne").     |
| **Lesson type**      | A subject (`ew`, `j ang`, `basen`, `twórcze`…). Carries a name, an optional short name, and a palette colour.      |
| **Teacher**          | A staff member who teaches the lesson. Some records are anonymous placeholders ("multiple") and render no name.    |
| **Slot**             | A bell-time block: an id, a start time, a duration. Shared across years; the week uses a contiguous span of them.  |
| **Day**              | A weekday, Monday–Friday. Carries its full name, a two-letter tab label, and its ISO weekday for the "today" mark. |
| **Palette**          | The fixed set of lesson colours. A colour is an instruction ("pack your kit", "pool"), never decoration.           |
| **Timetable / year** | One school year's week, named for the September it starts (`2026.json`). Exactly one is live at a time.            |

There is no _room_ and no second _class_: the site is that one class's week, so neither is modelled.

## Scenarios

### S1 · What's on today (phone, in the week)

**User:** a parent or child of 1b.
**Goal:** see today's lessons at a glance on a phone.
**Flow:** open the page → it opens on the current weekday, marked "DZIŚ" → read the day's lessons top
to bottom; swipe or tap a tab to check another day.
**Expected:** the whole day fits the screen without scrolling; each lesson shows its name and teacher;
free hours read "wolne". At the weekend it opens on Monday, unmarked.

### S2 · Do we need to pack anything (phone, the colours)

**User:** a parent the night before.
**Goal:** know whether tomorrow needs a kit, swimming things, or nothing.
**Flow:** read the coloured tiles → tap "?" for the legend to confirm what a colour means.
**Expected:** colour carries a real instruction (green = pack your kit, pool = swimming), always
paired with the lesson name and legend — never colour alone. See
[styling.md](../standards/styling.md#visual-conventions).

### S3 · Print the week for the wall

**User:** the maintainer, once a term.
**Goal:** a paper copy of the whole week for the fridge or the classroom wall.
**Flow:** print the page → one A4 landscape sheet, the full week with the legend across the bottom
and no "today" mark.
**Expected:** legible from across a room, one page, colours surviving the printer. Print behaviour is
owned by [styling.md](../standards/styling.md#surfaces); the paper check is an
[owner task](../owner-tasks.md).

### S4 · Publish a new school year

**User:** the maintainer, once a year.
**Goal:** turn the school's new PDF into the published plan.
**Flow:** the bounded procedure in [importing-a-plan.md](../importing-a-plan.md) — read the PDF, build
the year's JSON, move `ACTIVE_YEAR`, verify, PR.
**Expected:** the previous year is kept untouched as a snapshot; only the active year changes.

## Product constraints

- **One class, one week, static.** The site renders a single class's timetable, built and published
  once a term. No live editing, no server, no accounts — see
  [security.md](../standards/security.md).
- **One published timetable.** Exactly one school year is live — the active one. Past years stay in
  the repo as unpublished snapshots; there is no archive view, no year picker, and no way to reach a
  past year from the page. This is a constraint, not a missing feature —
  [importing-a-plan.md](../importing-a-plan.md#notes-for-agents).
- **Phone and paper are both binding.** The plan is read on a phone during the week and printed once
  a term. Both surfaces ship from one DOM; neither is secondary.
- **Polish copy, no feature creep.** Every visible string is Polish and comes from the data. Present
  this one week clearly; say no to filters, search, export formats, rooms, or multi-class views until
  asked by the people who actually use it.
