# Importing a new school year

Once a year the school issues one PDF holding the timetable for **every** class. This turns the one
class we care about into that year's plan file and publishes it. About half an hour, most of it
checking rather than typing.

The rules the layout enforces: one file per school year in `src/data/plans/`, named for the
September it starts (`2026.json`), holding **only what that year decides** — `teachers`,
`lessonTypes`, `lessons`; everything else lives once in
[`commons.json`](../src/data/plans/commons.json). A published year is **never edited again**; only
`ACTIVE_YEAR` in [`src/data/plans/index.ts`](../src/data/plans/index.ts) says what the site renders.

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
node scripts/read-plan-pdf.mjs src/data/plans/2026.pdf
```

That lists the classes and their page numbers. Then, for one class:

```bash
node scripts/read-plan-pdf.mjs src/data/plans/2026.pdf 1b
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

## Building the file

1. **Put the PDF at `src/data/plans/<year>.pdf`** — committed beside the JSON it produced, so a
   year's data can always be traced to its source.
2. **Copy the newest year's JSON to `<year>.json`.** Start from last year, never from scratch — it
   is already the right shape, and its `teachers` and `lessonTypes` are mostly still true.
3. **Revise the reference tables first**, before any lesson: `teachers` and `lessonTypes`. Add and
   remove freely, but **never reuse an id whose meaning changed** — an id quietly pointing at a
   different subject or colour repaints the legend and nothing fails.
4. **Then transcribe `lessons`.** One key per day, spelled exactly as `commons.json` spells it — a
   key that doesn't match a day fails the build, in both directions. Under each key, one entry per
   slot in `slots` order; an unused slot is `{}`; trailing empty slots may be omitted. A lesson that
   is scheduled but not attended is `ignored: true`, which renders as free but records that the
   school put something there.
5. **Only if the school moved something**, edit `commons.json`: bell times in `slots`, a new colour
   in `palette`, a copy fix in `labels`. It is shared, so that edit re-renders **every** published
   year — which is right for a corrected label and wrong for anything this year alone decided.
6. **Register the year** in `src/data/plans/index.ts`: import it, add it to `years`, move
   `ACTIVE_YEAR`.
7. **Verify** — below. **Flag every guess** to the human, and file the unresolved ones in
   `owner-tasks.md`.
8. **Commit** on a branch, PR, merge on green.

## Verifying

`npm run verify` is necessary and **not sufficient**.

What the build catches, by throwing in `src/utils/plan.ts`: an unknown `lessonId`, `colorId` or
`teacherId`, a day with no `lessons` key, and a `lessons` key naming no day. Typos are a red build,
never a blank tile.

What nothing catches, and so has to be checked cell by cell against the script's grid: a lesson in
the wrong slot or on the wrong day, the right subject with the wrong teacher, a slot left `{}` that
should hold a lesson, bell times left in `commons.json` when the PDF moved them.

The cheap way to do that check: build, then read the cells out of `dist/index.html` and compare them
to the grid the script printed. Then confirm the legend shows every colour the week uses and no
colour it does not. Say what you compared — a green gate is not a verified timetable.

## Notes for agents

- This is a [**Bounded**](workflow.md#bounded) change: branch, build, verify, close out.
- Do not add a year picker, an archive view or a "past years" link. One published timetable is a
  product constraint — [domain/overview.md](domain/overview.md#product-constraints).
- Every archived year is imported by `index.ts` and type-checked. If a `LessonsPlan` change breaks
  an old year, fix it or delete that year deliberately — never drop it from `plans` to silence the
  error.
