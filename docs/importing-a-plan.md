# Importing a new school year

Once a year the school issues a PDF holding the timetable for **every** class. This turns the one
class we care about into the year's plan file and publishes it. Roughly an hour, most of it
transcription and checking.

The rules the layout enforces: one file per school year in `src/data/plans/`, named for the
September it starts (`2026.json`); a published year is **never edited again**; only `ACTIVE_YEAR`
in [`src/data/plans/index.ts`](../src/data/plans/index.ts) says what the site renders.

## What you need before starting

- The school's PDF.
- **The class name** — the PDF holds every class in the school and nothing in the repo knows which
  row is ours. Ask; do not infer it. Getting this wrong produces a plausible, completely wrong
  timetable that passes every check in this repo.

## Steps

1. **Put the PDF in `src/data/plans/<year>.pdf`.** It is committed next to the JSON it produced, so
   a year's data can always be traced back to its source.
2. **Copy the newest year's JSON to `<year>.json`.** Start from last year, never from scratch — the
   labels, the palette and most lesson types carry over, and retyping them invents drift.
3. **Revise the reference tables first**, before any lesson: `slots` (bell times move), `teachers`,
   `lessonTypes`, `palette`. Add and remove freely, but **never reuse an id whose meaning changed** —
   an id silently pointing at a different subject or colour repaints the legend and nothing fails.
4. **Then transcribe `days`.** One entry per slot in `slots` order; an unused slot is `{}`; trailing
   empty slots may be omitted. A lesson that is scheduled but not attended is `ignored: true`, which
   renders as free but documents that the school put something there.
5. **Register the year** in `src/data/plans/index.ts`: import it, add it to `plans`, and move
   `ACTIVE_YEAR` to it.
6. **Verify** — below.
7. **Commit** on a branch, PR, merge on green.

## Verifying

`npm run verify` is necessary and **not sufficient**.

What the build does catch, by throwing in `src/utils/plan.ts`: an unknown `lessonId`, `colorId` or
`teacherId` anywhere in the file. Typos are a red build, never a blank tile.

What nothing catches — and what you therefore have to check by eye, against the PDF, day by day:

- a lesson in the wrong slot, or on the wrong day;
- the right subject with the wrong teacher;
- a slot left `{}` that should hold a lesson, or the reverse;
- bell times copied from last year when the PDF moved them.

Open the page, put the PDF next to it, and read the five days across. Then check the legend shows
every colour the week uses and no colour it does not, and print to PDF once to confirm the sheet is
still one page. Say what you compared; a green gate is not a verified timetable.

## Notes for agents

- This is a [**Bounded**](workflow.md#bounded) change: branch, build, verify, close out.
- Do not add a year picker, an archive view or a "past years" link. One published timetable is a
  product constraint — [domain/overview.md](domain/overview.md#product-constraints).
- Every archived year is imported by `index.ts` and type-checked. If a `LessonsPlan` change breaks
  an old year, fix it or delete that year deliberately — do not drop it from `plans` to silence the
  error.
