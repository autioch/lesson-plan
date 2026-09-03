# Importing a new school year

The reference behind the **[Publish a new school year](../README.md#publish-a-new-school-year)**
checklist in the README: what only the human can answer, how the school's PDF is read, and how the
built page is checked. The README owns the ordered steps; this file owns the detail they defer to.
About half an hour of work, most of it checking rather than typing.

The rules the layout enforces: one file per school year in `src/data/`, named for the
September it starts (`2026.json`), holding **only that year's week** — a single `lessons` key.
Everything else lives once in the two shared files:
[`commons.json`](../src/data/commons.json) for the fixtures and
[`catalog.json`](../src/data/catalog.json) for the teachers and subjects. A published year is
**never edited again** — its page is a snapshot of the week that hung on the wall.

## Who does what

| Step                                             | Who       |
| ------------------------------------------------ | --------- |
| Get the PDF from the school, drop it in the repo | **Human** |
| Say which class                                  | **Human** |
| Read the PDF, build the JSON, publish the year   | Agent     |
| Answer the choices the PDF cannot settle         | **Human** |
| Confirm what the agent flagged as a guess        | **Human** |
| Verify, commit, open the PR                      | Agent     |
| Print check, phone check, merge                  | **Human** |

The split is not about skill. **Everything the PDF states, the agent reads; everything the PDF
leaves open, only the family knows.** An agent that guesses at an open question produces a
timetable that is plausible, wrong, and passes every check in this repo.

## What only the human can answer

Collect these up front — they are the whole reason this is not a one-command job:

- **Which class.** The PDF holds every class in the school.
- **Either/or subjects.** A subject printed as a pair (`niem/hisz`, `religia/etyka`) is a choice
  the family made at sign-up. The PDF prints both.
- **Group splits.** `1. Grupa` / `2. Grupa` in one cell means half the class is elsewhere. Which
  half we are in changes two cells and is written nowhere in the PDF.
- **After-school activities.** Not in the school PDF at all. If they should show, the human supplies
  the list, the day and the slot.
- **An unfamiliar subject code.** See the vocabulary below; when a code is not there, ask.

Anything still open at commit time goes in [owner-tasks.md](owner-tasks.md) with the exact edit that
resolves it — not in a commit message, where it dies.

## Reading the PDF

[`scripts/read-plan-pdf.mjs`](../scripts/read-plan-pdf.mjs) turns a class's page into a day × slot
grid. Node built-ins only; nothing to install.

```bash
node scripts/read-plan-pdf.mjs src/data/2026.pdf
```

That lists the classes and their page numbers. Then, for one class:

```bash
node scripts/read-plan-pdf.mjs src/data/2026.pdf 1b
```

It prints each day's slots with the teacher, subject and room exactly as drawn, and a paste-ready
`slots` array. `--raw` adds every text item with its coordinates, for when a cell looks wrong.

Do **not** reach for an OCR tool or a PDF library. The file is real text with its own ToUnicode
maps, so the extraction is exact, diacritics included.

### The vocabulary (2026 PDF)

| Code               | Means                                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `ew` / `ep`        | Edukacja wczesnoszkolna / przedszkolna — the homeroom lesson                                                              |
| `j ang`            | Angielski                                                                                                                 |
| `niem/hisz`        | Niemiecki **or** Hiszpański — a choice                                                                                    |
| `wfiz`             | W/F with the PE teacher                                                                                                   |
| `wf ew`            | W/F taken by the homeroom teacher                                                                                         |
| `g kom`            | Gimnastyka kompensacyjna                                                                                                  |
| `inf`              | Informatyka                                                                                                               |
| `basen` + `dojazd` | The pool block — two slots, the second is the trip back                                                                   |
| `religia/ety` `ka` | Religia **or** Etyka — a choice, and the text wraps                                                                       |
| `kółko`            | Kółko                                                                                                                     |
| `twórcze`          | Zajęcia twórcze — spans two slots                                                                                         |
| `szachy`           | Szachy                                                                                                                    |
| `eww`              | **Unresolved.** Grades 1–3 only, always opposite an `inf` group split. Read as Edukacja in 2026 — confirm before reusing. |

### Traps in the layout

- **Text wraps into separate items.** `religia/ety` + `ka`, `basen0b1` + `b`. Join them before
  reading.
- **A merged cell spans two slots.** Friday's `twórcze` prints subject and teacher over the first
  column and the room over the second — the lone room is not a lesson of its own.
- **Rooms are right-aligned, everything else centred.** A wide room name can land a column off.
  Anything that looks lonely in a cell is worth `--raw`.
- **A `X / Y` teacher pair means one of two things.** If the subject is also a pair, it is a choice
  and the order matches — first subject, first teacher. If the subject is single, it is a group
  split.
- **To resolve which teacher is which**, find a class where the subject appears alone. In 2026, `j
niem` in grade 8 is taught by KRadziłowska, so in 1b's `KRadziłowska / MWołejnio` the Spanish
  teacher is MWołejnio.

## Transcribing the data

The README checklist gives the order (write the year file → extend the catalog → register it →
duplicate the page → verify). What each of those steps must get right:

- **The year file is one `lessons` key.** `Day.id` → `Slot.id` → `{ lessonId, teacherId }`, the day
  and slot ids from `commons.json`, the lesson and teacher ids from `catalog.json`. A free slot gets
  no entry at all. A lesson that is scheduled but not attended is `ignored: true` — renders as free
  but records that the school put something there. All four keys are resolved at build time, so a
  typo is a red build, not a lost lesson. Nothing is copied from last year: the shape is one object,
  and everything shared lives in the shared files.
- **Extend `catalog.json` before writing a lesson that needs it**, and **append only** — a teacher
  or subject the PDF names that is not already there gets a new row. The full discipline (never
  repurpose or delete a row an archived year references; opaque teacher ids, readable subject ids)
  is in
  [architecture.md § Data modelling rules](standards/architecture.md#data-modelling-rules).
- **Touch `commons.json` only if the school moved something** — bell times, a colour, a copy fix.
  It is shared, so that edit re-renders **every** year: right for a corrected label, wrong for
  anything this year alone decided. Adding a bell is a new slot id, never a renumber.
- **Flag every guess** to the human, and file the unresolved ones in
  [owner-tasks.md](owner-tasks.md) with the exact edit that resolves it.

## Verifying

`npm run verify` is necessary and **not sufficient**.

What the build catches, by throwing in `src/utils/plan.ts`: an unknown `lessonId`, `colorId`,
`teacherId` or `slotId`, a day with no `lessons` key, and a `lessons` key naming no day. Typos are a
red build, never a blank tile.

What nothing catches, and so has to be checked cell by cell against the script's grid: a lesson
filed under the wrong slot id or the wrong day, the right subject with the wrong teacher, a lesson
left out entirely, bell times left in `commons.json` when the PDF moved them, and a catalog row
reused for a different person or subject instead of appended.

The cheap way to do that check: build, then read the cells out of `dist/index.html` and compare them
to the grid the script printed. Then confirm the legend shows every colour the week uses and no
colour it does not. Say what you compared — a green gate is not a verified timetable.

## Notes for agents

- This is a [**Bounded**](workflow.md#bounded) change: branch, build, verify, close out.
- Each year is its own page at its own URL (`index.astro` for the current one, `2025.astro` for a
  past one), reached directly — there is no picker, archive view or "past years" link on the page.
  That absence is a product constraint — [domain/overview.md](domain/overview.md#product-constraints).
- Every year is imported by `index.ts` and type-checked, not only the current one. If a `LessonsPlan`
  change breaks an old year, fix it or delete that year deliberately — never drop it from `years` to
  silence the error.
