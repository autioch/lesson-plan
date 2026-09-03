# lesson-plan

A weekly school lesson plan: one page, readable on a phone, printable on one A4 landscape sheet.
Published to <https://autioch.github.io/lesson-plan/>.

Each school year is one data file under [`src/data/`](src/data/) (named for the September it starts,
e.g. `2026.json`) and one page under [`src/pages/`](src/pages/). `index.astro` renders the current
year; every past year keeps its own page (`2025.astro`) at its own URL, for comparison. The teachers,
subjects, colours, bells and copy shared across years live once in `catalog.json` and `commons.json`.

```bash
npm run dev
```

## Publish a new school year

Once a year the school issues a PDF with every class's timetable. Turning our class into next year's
published page is the only recurring job here. Steps 3–7 are the agent's; hand it the PDF and answer
its questions.

1. **Drop the PDF** at `src/data/<year>.pdf` (e.g. `2027.pdf`) — kept beside the JSON it produces.
2. **Tell the agent which class**, and answer what the PDF can't settle — either/or subjects, group
   splits, after-school activities. These, and how the PDF is read, are in
   [docs/importing-a-plan.md](docs/importing-a-plan.md).
3. **Write `src/data/<year>.json`** — one `lessons` key, transcribed from the PDF. Append any new
   teacher or subject to `catalog.json`; never edit an existing row to mean someone else.
4. **Register the year** in [`src/data/index.ts`](src/data/index.ts) — import the file and add it to
   `years`.
5. **Give last year its own page, point home at the new one:** copy `src/pages/index.astro` to
   `src/pages/<last-year>.astro` (it keeps rendering last year), then change the year key in
   `index.astro` to the new year.
6. **Verify** — `npm run verify`, then read the built page cell by cell against the PDF. A green gate
   is not a checked timetable; see [docs/importing-a-plan.md](docs/importing-a-plan.md#verifying).
7. **Commit** on a branch, open a PR, merge on green CI. Then the human print- and phone-checks.

## For agents

Working rules and the map of what to read when: [CLAUDE.md](CLAUDE.md) and [docs/](docs/). The gate
before every commit is `npm run verify` — format, lint, type-check, transform tests, dead-code scan,
build.
