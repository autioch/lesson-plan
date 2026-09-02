# QA & Testing Guide

The single source of truth for **how to test a change**. **Read it before verifying anything** — every
path in the [routing table](../../CLAUDE.md#what-to-do-when) says so.

It answers **what** to test, **how** for this stack, and **how much** for a given change.

## Deciding what to test

Most changes resolve in seconds. Ask, in order:

1. Touched a **data transformation** (JSON → component shape, a derived field, a computed timetable
   row)? → the **gate** (`npm run verify` type-checks it) plus a **rendered check** that the real
   data comes out right on the page. **This project has no test runner** — that is a deliberate
   call for one pure transform behind one page, not an omission to fix.
2. Changed **component rendering logic**? → a **visual check** — render the change in the dev server
   and confirm it looks right.
3. Changed **JSON data files**? → the **gate**, then confirm the changed values actually appear in
   the rendered output.
4. Changed anything **date-dependent**? → check it against a **stubbed clock**, not just today. The
   page script must be right on every weekday and at the weekend.
5. None of the above (docs, config, a comment)? → **the gate only**.

Rules keep the answer deterministic:

- **Union of touched areas.** A change runs checks for every layer it touches.
- **Effort scales with blast-radius × irreversibility** — don't gold-plate a reversible typo fix;
  always verify a data-shape change.

## Operational stages

| Stage                   | What                                            | Runs where                                   |
| ----------------------- | ----------------------------------------------- | --------------------------------------------- |
| **The gate** _(always)_ | Type-check, dead-code scan, build               | `npm run verify` — by hand, then PR CI + main |
| **Visual check**        | Rendered output on the dev server looks correct | `npm run dev` + browser                       |

**The gate** is `npm run verify` — `ci:ts` (`astro sync && tsc --noEmit`), `ci:knip`, then
`npm run build`. A green run means:

- TypeScript types check out **in `.ts` files** — `tsc` does not read `.astro`, so frontmatter is
  unchecked. Keep logic out of frontmatter.
- No unused file, export, type or dependency is left behind
- JSON parses correctly and all imports resolve
- The static output builds

No git hook runs this. Run it yourself before pushing.

## Always-on checks (every code change)

Independent of scope, every code change confirms:

- **Gate green** — `npm run verify`.
- **Data files parse** — if JSON changed, the build catches parse errors and type mismatches.
- **Rendered output looks right** — for UI changes, a visual check in the dev server on the primary
  surface (modern desktop browser).

## Test-by-scope

Match the change to the layer(s) it touches.

| Change                               | What to test                                                                                  |
| ------------------------------------ | --------------------------------------------------------------------------------------------- |
| **Data files (JSON)**                | Build succeeds; JSON parses and type-checks; rendered data appears in the output.             |
| **Component rendering**              | Visual check in dev server; confirm the layout, spacing, colors, and text match expectations. |
| **Data transformation / pure logic** | Gate green, then confirm input→output on the real data in the rendered page. No test runner.  |
| **Page structure / routing**         | Build succeeds; all pages render; internal links resolve.                                     |
| **Static assets**                    | Build includes them; they load in the dev server preview.                                     |

## Recording QA

Every full-pipeline record has a **`Verification`** section. Record there, plainly:

- Which stages ran and their result — the build outcome, what the visual check showed
- What is **pending or unverifiable** — never claim work that wasn't done

**Claims must trace to a commit or to observed app behavior. A green build alone is not "verified".**
