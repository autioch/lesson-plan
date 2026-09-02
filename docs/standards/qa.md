# QA & Testing Guide

The single source of truth for **how to test a change**. **Read it before verifying anything** — every
path in the [routing table](../../CLAUDE.md#what-to-do-when) says so.

It answers **what** to test, **how** for this stack, and **how much** for a given change.

## Deciding what to test

Most changes resolve in seconds. Ask, in order:

1. Touched a **data transformation** (JSON → component shape, a derived field, a computed timetable
   row)? → a co-located **unit test** in TypeScript, in the same commit.
2. Changed **component rendering logic**? → a **visual check** — render the change in the dev server
   and confirm it looks right.
3. Changed **JSON data files**? → a **build check** — run `npm run build` to confirm parsing and
   no type errors.
4. None of the above (docs, config, a comment)? → **the gate only** (`npm run build`).

Rules keep the answer deterministic:

- **Union of touched areas.** A change runs checks for every layer it touches.
- **Effort scales with blast-radius × irreversibility** — don't gold-plate a reversible typo fix;
  always verify a data-shape change.

## Operational stages

| Stage                   | What                                            | Runs where                              |
| ----------------------- | ----------------------------------------------- | --------------------------------------- |
| **The gate** _(always)_ | Astro build: type-check, parse, compile         | `npm run build` — pre-push hook + PR CI |
| **Visual check**        | Rendered output on the dev server looks correct | `npm run dev` + browser                 |
| **Unit test**           | Data transforms produce expected output         | co-located .test.ts files + CI          |

**The gate** is `npm run build` — runs Astro's full type-check and build. It validates the whole
tree. A successful build means:

- TypeScript types check out
- JSON parses correctly
- All imports resolve
- The static output builds

## Always-on checks (every code change)

Independent of scope, every code change confirms:

- **Gate green** — `npm run build`.
- **Data files parse** — if JSON changed, the build catches parse errors and type mismatches.
- **Rendered output looks right** — for UI changes, a visual check in the dev server on the primary
  surface (modern desktop browser).

## Test-by-scope

Match the change to the layer(s) it touches.

| Change                               | What to test                                                                                  |
| ------------------------------------ | --------------------------------------------------------------------------------------------- |
| **Data files (JSON)**                | Build succeeds; JSON parses and type-checks; rendered data appears in the output.             |
| **Component rendering**              | Visual check in dev server; confirm the layout, spacing, colors, and text match expectations. |
| **Data transformation / pure logic** | Unit test the transformation; confirm input→output for the real data and edge cases.          |
| **Page structure / routing**         | Build succeeds; all pages render; internal links resolve.                                     |
| **Static assets**                    | Build includes them; they load in the dev server preview.                                     |

## Recording QA

Every full-pipeline record has a **`Verification`** section. Record there, plainly:

- Which stages ran and their result — the build outcome, what the visual check showed
- What is **pending or unverifiable** — never claim work that wasn't done

**Claims must trace to a commit or to observed app behavior. A green build alone is not "verified".**
