# Archive

Finished units of work, newest first. One self-contained entry each.

## One plan, one source, no baked "today" — September 2026

The route swap the v2 rebuild left open, plus the two things it had deferred. v1 is deleted
(`Table2`, `A4Paper`, `Cell`, `DayHeader`, `RowHeader`, the old layout, seven subject SVGs and the
`iconId` nothing rendered); the responsive plan is `/`. With one plan left, the `v2/` namespace was
dissolved from `components/`, `utils/` and `assets/`.

`src/data/lessons.json` is now the single source for **everything displayed** — schedule, `palette`,
day names and shorts, and a `labels` block holding every fixed string (page title, DZIŚ, wolne, the
legend copy, the break templates). `presentation.ts` is gone. Colours are declared once in `palette`
and referenced by `colorId`, so the legend is a direct read instead of a hex-keyed lookup.

Headline decisions: **today is a runtime fact** — `buildPlan` no longer takes a clock, the build
emits no today marks, and the page script matches `new Date()` against the `data-weekday` each day
carries, so a page built in September is right in June. **Tile ink was dropped entirely** at the
owner's call: no `luminance()` switch, no light-ink variant, no per-cell ink props — every tile
takes `--text-primary` and `--text-on-tile-weak`, which moves the palette's 4.5:1 obligation from a
code branch to a stated entry condition in `styling.md`. **Unresolved references now throw** rather
than rendering a blank tile. Also dropped as dead: `teachers[].email` (fake) and `Lesson.paused`;
the "no single teacher" rule became `anonymous: true` on the record instead of a name blocklist.

Verified: the shipped page script run against all seven weekdays with a stubbed clock (Mon–Fri mark
and open their own day, Sat/Sun open Monday unmarked); all three bands and the legend sheet in the
browser. Owed: the real print/PDF export and the physical-phone check carry over, and the gate does
not typecheck — all three in [owner-tasks.md](owner-tasks.md).

PR: https://github.com/autioch/lesson-plan/pulls (branch `refactor/single-source-plan`)

## v2 rebuilt to the design spec — September 2026

`/v2` had been generated from `designs/` but did not implement them: the layout was chosen by a
build-time Astro prop, which a static site freezes at build time, so every viewport got the same
DOM. Rebuilt around one DOM whose three width bands (≤480 / 481–1023 / ≥1024) are decided in CSS,
plus a pure `src/utils/v2/plan.ts` transform and the A4-landscape print sheet.

Headline decisions: **width bands only, no orientation queries** — a rotated phone is 915px wide and
lands in the week band on its own, while orientation would misfire on tablets. **Band B keeps the
"?" legend button** although mockup 3b omits it, because the spec forbids showing a lesson colour
without its legend. **`paused` is not rendered** — the flag exists in the type but no record uses it.

`docs/standards/styling.md` was rewritten in the same work: the design's phone-first surfaces and
floors replace the old "desktop 1920+ is binding" text. v1 at `/` is untouched; the route swap was
deliberately left open.

Owed: a real print/PDF export and a check on a physical phone — both in
[owner-tasks.md](owner-tasks.md).

PR: https://github.com/autioch/lesson-plan/pulls (branch `feat/v2-rebuild`)
