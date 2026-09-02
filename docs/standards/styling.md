# Styling & UI

The rules for visual consistency and the surfaces the site targets. The v2 plan
(`src/pages/v2.astro`) is built to `designs/Przekazanie deweloperom.dc.html`; that spec is the
authority where this doc is silent.

## Surfaces

The plan is read on a phone during the week and printed once a term. Both are binding.

| Band       | Width       | Shows                                                                    |
| ---------- | ----------- | ------------------------------------------------------------------------ |
| **A**      | ≤ 480px     | One day: tabs, time gutter, lesson name and teacher, "?" legend sheet    |
| **B**      | 481–1023px  | Whole week, shortened names, no teacher, "?" legend sheet                |
| **C**      | ≥ 1024px    | Whole week, full names and teachers, fixed legend column                 |
| **Print**  | A4 landscape | One page, legend at the bottom, no "today"                              |

Bands are chosen by **width only**. A phone in landscape is 915px wide and lands in band B, so
orientation queries are never needed and must not be added — they misfire on tablets. Reference
canvas for band A is 412 × 915.

**Unsupported:** old browsers (no polyfills, no IE).

## Floors — non-negotiable

- **px, not rem.** These are floors, not preferences.
- **Text ≥ 17px.** 14px only for meta: end time, break text, teacher name. Nothing smaller.
- **Touch targets ≥ 44 × 44px** — day tabs and the legend button.
- **Line height ≥ 1.3** for anything that can wrap.
- **WCAG AA**: 4.5:1 body text, 3:1 large text and UI.
- **No state carried by colour alone.** The viewed day has a bar and its full name, today has the
  word DZIŚ and a wider tab, an empty slot says "wolne".
- **A full day fits the screen without scrolling.** Rows divide the viewport height.

## Visual conventions

- **Lesson colours are data, not decoration.** Exact hex from `src/data/lessons.json`, full strength,
  never tokenized, tinted or made transparent, and never shown without the legend. Tile ink comes
  from luminance (see `src/utils/v2/plan.ts`); the teacher line is the weaker variant of it.
- **Everything else is a token** from `src/assets/v2/tokens.css` — type scale, spacing ramp, radii,
  lines, surfaces, accent. No values from outside the ramp, no inline styles beyond the per-cell
  colour custom properties.
- **Type scale** switches once, at 1024px: phone `17/20/24`, desk `20/24/30`.
- **Weight is a signal, not a default.** Bold is reserved for the hours, the day being viewed and
  today; lesson names in the week grid are medium, so the colour does the work.
- **Headers sit on `--surface-base`** (day tabs, day names) — a band, not a first row of content.
  Rules that let you track a row or column are `--overlay-tint`, drawn in the gaps so a lesson
  colour is never overprinted.
- **The legend names the colour, not its lessons.** Those are on screen beside it.
- **Layout lives in `src/assets/v2/v2.css`**, not in scoped component styles — the band rules cross
  component boundaries.
- **Semantic HTML**: heading levels, real buttons, `aria-selected` on the day tabs.

## Building new UI

1. Read the design spec and the token file before writing CSS. Extend the scale, never hand-roll a
   size.
2. Decide layout in CSS. This is a static site: a build-time prop cannot know the viewport, so a
   layout that depends on width must never be chosen in `.astro` frontmatter.
3. Verify on all three bands plus print. Resizing the dev server in a browser is the check.
4. Keep the CSS small; no runtime layout work.

## Commands

No separate style build — CSS is bundled by Astro. Verify with `npm run dev` at 412 × 915, 915 × 412
and 1440 × 900, and in the browser's print preview.
