# lesson-plan

A weekly school lesson plan: one page, readable on a phone, printable on one A4 landscape sheet.
Published to <https://autioch.github.io/lesson-plan/>.

Everything shown on the page — the schedule, the colours, the day names, every word of copy — lives
in one file per school year under [`src/data/plans/`](src/data/plans/), named for the September it
starts. Editing the current plan means editing the active year's file; publishing a new school year
is [docs/importing-a-plan.md](docs/importing-a-plan.md). Past years stay in the folder for
reference — they are never rendered, only type-checked.

```bash
npm run dev
```

`npm run verify` is the gate — format, lint, type-check, dead-code scan, build. Working rules:
[CLAUDE.md](CLAUDE.md) and [docs/](docs/).
