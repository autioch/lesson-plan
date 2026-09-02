# Active plan — v2 rebuild to the design spec

Working note. Deleted at close-out; the durable record is the git history and the PR.

## 1 · Spec

### Problem

`/v2` was generated from the designs by another agent and does not implement them. The root fault:
the layout is chosen by a build-time Astro prop (`layout: "portrait" | "landscape" | "desktop"` in
`TimeSlotRow`), which a static site freezes at build time — every viewport gets the same DOM. On top
of that the CSS keys off `orientation` instead of the spec's three width bands, rows scroll instead
of filling the viewport, the token scale is rem-based and off-spec, and the data rules (unused slot
0, `ignored` lessons, unused lesson types, `multiple` / `<extra>` teacher placeholders, legend
grouping, name abbreviations) are unimplemented.

### Authority

`designs/Przekazanie deweloperom.dc.html` is the contract; `designs/Plan lekcji - mobile.dc.html` is
its 1:1 reference implementation. Where the two disagree, the spec doc wins. Data comes from
`src/data/lessons.json` (not `designs/plan-data.js`, which is a shape copy).

### Scope

**In:** `/v2` — three screen layouts + the A4-landscape print sheet, v2 tokens, the data and
presentation layers behind them.
**Out:** v1 (`/` keeps working, untouched); route swap; editing, filtering, "happening now", multiple
students, `paused` lessons (the flag exists in the type but no record uses it — not rendered).

### Layouts — width bands only

Rotation is covered by width: a 412×915 phone in landscape is 915px wide and lands in band B. No
`orientation` queries; height is handled by rows flexing inside a viewport-height column.

| Band | Width | Shows |
| --- | --- | --- |
| A · phone portrait | ≤ 480px | One day. Tabs on top, 152px time gutter + lesson (name + teacher). "?" FAB → bottom-sheet legend. |
| B · phone landscape / tablet | 481–1023px | Whole week. 244px gutter, 5 equal columns, no tabs, no swipe. Cell = abbreviated lesson name only. "?" FAB kept (deviation, see below). |
| C · laptop | ≥ 1024px | Whole week + fixed 252px legend column. 156px gutter. Full names + teacher, nothing abbreviated. |
| Print | A4 landscape | One page: grid as C with a 112pt gutter, legend in 5 columns at the bottom, no "today". |

**Deviation from mockup 3b:** the mockup drops the legend entirely in band B. That breaks the spec's
own rule that a lesson color never appears without its legend, so band B keeps the "?" FAB and the
bottom sheet. Recorded here as a deliberate choice.

### Behavior

- One DOM for all bands. All five days render server-side; band A hides four columns via a
  `data-day` attribute on the root plus a media query. No layout props anywhere.
- Day selection exists only in band A. Tab tap, or swipe ≥ 36px on the plan; no wrap from Friday to
  Monday. Opens on today; Sat/Sun → Monday. Not persisted between visits.
- Viewed day: full name, wider tab, 3px bar under it. Others: two-letter short (`Pn Wt Śr Cz Pt`),
  narrower, no bar.
- Today: the word **DZIŚ** in caps and a tab half again as wide, even when another day is viewed.
  Band B/C: the today column header reads **DZIŚ** with a 3px bar. Print: no today marker.
- Legend: "?" FAB bottom-right in bands A and B, bottom sheet, tap anywhere closes. Band C: fixed
  sidebar, no button.
- Lesson tiles are not interactive — there is no detail view.

### Data rules

- **Row set** = slot indices used by any day, `ignored` lessons excluded → slots 1–8 and 10 (9 rows).
  Slot 0 and slot 9 never render. The row set is shared across days so rows don't jump on day change.
- **Break** = next rendered slot's start − this slot's end. `+{n}min przerwy`, or `+{n}h przerwy`
  above 60 minutes. Lives in the time gutter only, never in a lesson cell.
- **Empty slot**: band A and C show "wolne"; band B leaves it blank (no room).
- **Teachers**: `multiple` and `<extra>` are "no single name" — never rendered, on any surface.
- **Legend**: only lesson types actually used, grouped by color under the design's group titles; the
  plain-lesson group (`#ffffff`) is omitted. Six unused types in `lessons.json` must not appear.
- **Colors** are data: exact hex, full strength, never tokenized or tinted. Text ink from luminance
  (< 0.55 → `#FFFFFF`, else `#17170F`); teacher line `rgba(255,255,255,.85)` / `#5A5648`.
- **Abbreviations** (band B only) are presentation, not data — they live beside the components.

### Floors — checked at acceptance

px not rem · text ≥ 17px, 14px for meta only (end time, break, teacher) · touch targets ≥ 44×44 ·
line-height ≥ 1.3 · WCAG AA (4.5:1 text, 3:1 large text and UI) · no state carried by color alone ·
a full day fits the screen without scrolling · print keeps its colors (`print-color-adjust: exact`).

### Acceptance criteria

1. At 412×915 exactly one day is visible, no scrollbar, tabs and FAB present, today selected.
2. Tapping a tab and swiping ≥ 36px both change the day; swipe does not wrap at either end.
3. At 915×412 all five days are visible, no tabs, no scrollbar, cells show abbreviated names only.
4. At 1440×900 all five days plus the fixed legend are visible with full names and teachers.
5. Nine rows, slots 1–8 and 10; no row for slot 0 or 9; Tuesday's ignored TUS never appears.
6. The legend lists 8 grouped entries, none of them an unused type, and no `multiple` / `<extra>`
   string appears anywhere in the rendered HTML.
7. Print preview is one A4 landscape page, colors intact, legend at the bottom, no DZIŚ.
8. `npm run build` green; the three widths verified by screenshot.

## 2 · Steps

Bottom-up, each independently committable; the gate is `npm run build` plus, from step 4 on, a
screenshot at the affected width.

1. **Data layer** — `src/utils/v2/plan.ts`: pure transform of `lessons.json` into the render shape
   (row set, ranges, breaks, per-day cells, legend groups, today index, ink colors). Replaces
   `breaks.ts` / `layout.ts`; `color.ts` folds in. Done-check: build green, a node script prints the
   9 rows, the gap strings and the 9 legend groups.
2. **Presentation layer** — `src/utils/v2/presentation.ts`: name abbreviations, legend group titles,
   day shorts. Done-check: build green.
3. **Tokens** — rewrite `src/assets/v2/tokens.css` to the spec's px scale, with the phone/desk switch
   driven by the three width bands. Done-check: build green.
4. **Grid components** — rewrite `WeekGrid` / `TimeSlotRow` / `LessonCell` to one DOM, all five days,
   CSS-driven visibility. Done-check: bands B and C correct at 915×412 and 1440×900.
5. **Day selection** — `DayTabs` + the page script (today on load, tab click, 36px swipe). Done-check:
   band A correct at 412×915; criteria 1–2.
6. **Legend** — sidebar (C) and bottom sheet (A, B) off one grouped source. Done-check: criterion 6.
7. **Print sheet** — A4 landscape view. Done-check: criterion 7.
8. **Docs + cleanup** — rewrite `docs/standards/styling.md` to the design's surfaces and floors;
   delete the untracked `test-page.html` / `test-v1.html`. Done-check: doc bar, gate green.
