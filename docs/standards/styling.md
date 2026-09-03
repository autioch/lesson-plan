# Styling & UI

The rules for visual consistency and the surfaces the site targets. The plan (`src/pages/index.astro`)
is built to `designs/Przekazanie deweloperom.dc.html`; that spec is the authority where this doc is
silent.

## Surfaces

The plan is read on a phone during the week and printed once a term. Both are binding.

| Band      | Width        | Shows                                                                 |
| --------- | ------------ | --------------------------------------------------------------------- |
| **A**     | ≤ 480px      | One day: tabs, time gutter, lesson name and teacher, "?" legend sheet |
| **B**     | 481–1023px   | Whole week, shortened names, no teacher, "?" legend sheet             |
| **C**     | ≥ 1024px     | Whole week, full names and teachers, fixed legend column              |
| **Print** | A4 landscape | Band C's layout on one page: legend at the bottom, no "today"         |

Bands are chosen by **width only**. A phone in landscape is 915px wide and lands in band B, so
orientation queries are never needed and must not be added — they misfire on tablets. Reference
canvas for band A is 412 × 915.

**All four surfaces render one DOM.** Paper is not a second markup tree — it takes band C's layout
and adds only its own deltas, so a change to the week grid reaches the printed sheet by
construction. Three rules keep that true, and breaking any one of them breaks the sheet silently:

- **Paper is band C, never band B.** The two blocks band C needs also list `print`
  (`@media (min-width: 1024px), print`); the bands paper must never take are scoped to `screen`. A
  width query left unscoped lets the **print dialog's margin setting** pick the band — a non-zero
  margin narrows the page box under 1024px and strips the teacher names off the sheet.
- **Paper has its own scale**, last block in `tokens.css`: one size, 16px = 12pt, the school's floor,
  with the teacher line the single exception. The desk scale's 20/17 does not fit a full row set and
  a legend on 210mm.
- **`print.css` holds deltas only** — the page box, the legend moving under the grid, the "today"
  mark coming off, and the ink. Anything it restates from `plan.css` is drift waiting to happen.

**Unsupported:** old browsers (no polyfills, no IE).

## Floors — non-negotiable

- **px, not rem.** These are floors, not preferences.
- **Text ≥ 17px.** 14px only for meta: end time, break text, teacher name. Nothing smaller — the
  teacher line already sits on that floor at every width, so "make it smaller" has nowhere left to
  go on a phone.
- **Touch targets ≥ 44 × 44px** — day tabs and the legend button.
- **Line height ≥ 1.3** for anything that can wrap.
- **WCAG AA**: 4.5:1 body text, 3:1 large text and UI.
- **`prefers-reduced-motion` is honoured** — see [Motion](#motion).
- **No state carried by colour alone.** The viewed day has a bar and its full name, today has the
  word DZIŚ and a wider tab, an empty slot says "wolne".
- **A full day fits the screen without scrolling.** Rows divide the viewport height.

## Visual conventions

- **Lesson colours are data, not decoration.** Exact hex from the `palette` in
  `src/data/commons.json`, full strength, never tokenized, tinted or made transparent, and
  never shown without the legend. A lesson type names a colour by `colorId`; a hex written anywhere
  else is a bug.
- **Tile ink is fixed, not computed.** Every tile takes `--text-primary`, and the teacher line
  `--text-on-tile-weak`. There is no luminance switch and no light-ink variant — which makes the
  palette's contrast a **hard entry condition** rather than something code compensates for.
- **The teacher line is the quiet one** — `--fs-2xs` and `--text-on-tile-weak`, because it answers
  "who", looked up once a term, not "what", read every morning. `--fs-2xs` is the one step that does
  **not** scale with the surface — a flat 14px everywhere, paper included. It is the one line allowed
  under the sheet's 12pt floor: at 12pt it comes out the size of the lesson name above it, and paper
  has no other step left to tell the two apart. How pale the ink can go is set by the **blue**, the
  darkest tint —
  5.4:1 today, and it stays above 4.5:1 across the whole usable mix range, which is the point of not
  reaching for `--text-secondary` here.
- **The palette is six colours plus plain white**, and adding a seventh is a decision, not an edit.
  Each one must clear 4.5:1 at 14px against **both** ink tokens — check the new colour by hand,
  nothing enforces it — and stay separable from the other five under red-green colour blindness. A
  lesson that asks nothing of the family (Kółko, Religia/Etyka) is plain white.
- **The six are tints, not colours** — each is its saturated base mixed 50% with white, so a tile
  reads as tinted paper and the lesson name keeps the emphasis. Measured at that mix: worst ink
  contrast **7.5:1**, tightest pair **ΔE 6.1** (pool/creative under deuteranopia), and every tile at
  least **ΔE 19** from the white page. To make them quieter or stronger, **move the mix and re-check
  those three numbers** — hand-picking a hex per colour is what breaks the set. Pale costs
  separability fastest: at a 70% mix the tightest pair falls to ΔE 3.6 and the palest tiles are only
  ΔE 12 from the page, which is where a tile stops reading as a tile.
- **Everything else is a token** from `src/styles/tokens.css` — type scale, spacing ramp, radii,
  lines, surfaces, text ink, accent. No values from outside the ramp, and the only inline style on a
  cell is `--cell-bg`.
- **Type scale** switches once, at 1024px: phone `17/20/24`, desk `20/24/30`. Meta is `14/17` under
  those, and the teacher step below it is a flat `14` at both.
- **Weight is a signal, not a default.** Bold is reserved for the hours, the day being viewed and
  today; lesson names in the week grid are medium, so the colour does the work.
- **Headers sit on `--surface-base`** (day tabs, day names) — a band, not a first row of content.
  The day-name band **bleeds to the edges** of the area it heads and carries the rows' own gap and
  side inset, so each name sits over its column. Rules that let you track a row or column are
  `--overlay-tint`, drawn in the gaps so a lesson colour is never overprinted.
- **Band B carries no frame.** A phone on its side has ~412px of height minus the browser's bar, so
  the grid takes the top edge and keeps only a side inset and a gap under the last row. Bands A and
  C have the room and keep theirs.
- **The legend names the colour, not its lessons.** Those are on screen beside it.
- **Layout lives in `src/styles/plan.css`**, not in scoped component styles — the band rules cross
  component boundaries.
- **Copy is never in CSS or markup.** Visible words come from `labels` in `commons.json`; CSS may
  show and hide them, never supply them (no `content:` strings).
- **Semantic HTML**: heading levels, real buttons, `aria-selected` on the day tabs.

## Motion

Three things move, all of them on the phone, and each is feedback on something the reader just did:
the day tab widening into the full day name, the day itself sliding in when it changes, and the
legend sheet coming up from the bottom edge. Nothing else animates. **Paper never does** — the print
block sets no transition and none of the rules below reach it.

- **Durations and easing are tokens** — `--dur-quick` for a control settling into its new state,
  `--dur-slide` for a day arriving, `--ease-out` for both. A hand-written `ms` anywhere else is a
  bug, and the durations are also the whole reduced-motion switch, so nothing may opt out of them.
- **`prefers-reduced-motion: reduce` zeroes the two durations** in `tokens.css` and that is the
  entire implementation — every transition reads them, and a 0s transition still lands on the same
  end state, so no rule needs a reduced-motion twin.
- **All five days stay laid out** in band A. They stack in the row's single content column, each
  offset by `(its day − the current day) × 100%`, and the four you are not on are
  `visibility: hidden`, which still keeps them out of the accessibility tree — the job that
  `display: none` did here before — while leaving them somewhere to slide from. Hiding is **delayed
  by the slide duration**, so the day you are leaving is on screen while it leaves. The hours column
  is opaque and sits above them: it is what a day disappears behind on the left, and `.row`'s
  `overflow: hidden` is what clips the right.
- **The sheet animates off the `hidden` attribute**, which stays the only place its open state
  lives — the script sets it and knows nothing about animation. That needs `allow-discrete` on
  `display` (so it stays displayed while it fades) and `@starting-style` (so it has a state to
  arrive from). **Nest the `@starting-style`**: as a top-level block it reaches the sheet, whose own
  `display` changes, but not the panel inside it, which is only newly rendered because its parent
  is. Both are progressive enhancement — without them `hidden` still hides the sheet, in one frame.
- **Motion is off until the page script has set the day.** `plan--ready` is added after a forced
  layout read, so the clock being applied on load lands rather than sliding in from Monday. The
  forced read is deliberate: waiting a frame would not happen at all in a background tab.

## Building new UI

1. Read the design spec and the token file before writing CSS. Extend the scale, never hand-roll a
   size.
2. Decide layout in CSS. This is a static site: a build-time prop cannot know the viewport, so a
   layout that depends on width must never be chosen in `.astro` frontmatter.
3. Verify on all three bands plus print. Resizing the dev server in a browser is the check.
   Anything that moves is verified with reduced motion on as well — see [Motion](#motion).
4. Keep the CSS small; no runtime layout work.

## Commands

No separate style build — CSS is bundled by Astro. Verify with `npm run dev` at 412 × 915, 915 × 412
and 1440 × 900.

**Motion is checked on the timeline, not by eye.** `document.getAnimations()` returns the running
transitions; setting each one's `currentTime` steps them frame by frame, so the geometry mid-slide
can be measured rather than watched — which is also the only way to check it in a browser pane that
is not on screen, since a hidden page freezes every transition at time 0. Reduced motion is checked
by injecting `:root { --dur-quick: 0s; --dur-slide: 0s }`: the pass is **no animation created at
all** and every state landing directly.

**Print is checked at 1122 × 794** — A4 landscape in CSS pixels — with the `@media print` rules
forced on: collect every `document.styleSheets` rule whose `media.mediaText` is exactly `print` and
append their bodies as a plain `<style>`. That reproduces the print cascade in the same order the
bundle emits it, so `.plan` can be measured against 297 × 210mm and cells checked for clipping
(`scrollHeight > clientHeight`). It does **not** reproduce `@page`, paper colour management, or the
print dialog's own margins — **the browser's print preview is still the authority**, and a real
print to PDF with "Background graphics" on is what closes a print change out.
