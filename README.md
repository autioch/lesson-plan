# lesson-plan

A weekly school lesson plan: one page, readable on a phone, printable on one A4 landscape sheet.
Published to <https://autioch.github.io/lesson-plan/>.

Everything shown on the page — the schedule, the colours, the day names, every word of copy — lives
in [`src/data/lessons.json`](src/data/lessons.json). Editing the plan means editing that file.

```bash
npm run dev
```

`npm run verify` is the gate — type-check, dead-code scan, build. Working rules:
[CLAUDE.md](CLAUDE.md) and [docs/](docs/).
