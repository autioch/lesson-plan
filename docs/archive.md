# Archive

Finished units of work, newest first. One self-contained entry each.

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
