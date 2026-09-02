# Development Guide

Coding conventions, commands, and dev tooling. [CLAUDE.md](../../CLAUDE.md) holds the high-level
rules; [architecture.md](architecture.md) owns the layering, data flow, and source layout;
[security.md](security.md) owns the security posture. Read those for **where code lives and how the
system is built**; read this before writing code for **how to write it here**.

## Conventions

- **Components are Astro files** — use `.astro` for page structure and `.astro` for UI components.
  Keep files small and focused on one element or feature.
- **Type safety:** use TypeScript where possible. Define types in `src/data/` for data shapes and
  pass them to components.
- **One folder per component**, holding its implementation and any component-local styles.
- **Styling:** use scoped styles inside `.astro` files with `<style>` tags, or shared stylesheets
  in `src/assets/`. Rules that cross component boundaries — the responsive bands — belong in the
  shared stylesheet; scoped styles cannot express them.
- **No copy in components.** Every user-visible string is a label from `lessons.json`, passed in as
  a prop. A hardcoded word in an `.astro` file is a bug, not a shortcut.
- **No dates at build time.** Frontmatter and `src/utils/` must never call `new Date()`: the site is
  generated once a term. Anything that depends on the day belongs in the page script.
- **Layout is never a build-time prop.** This is a static site: frontmatter cannot know the
  viewport, so anything that varies by width is decided in CSS. See
  [styling.md](styling.md#surfaces).
- **Data is read-only:** JSON files in `src/data/` are the source of record. Transformations are
  pure functions in TypeScript modules, never mutations.
- **Props are closed:** variant / option props are enums or string literals; content is free-form.
- **Reuse shared components** from `src/components/` instead of duplicating HTML.
- **Docs and code travel together.** A change to data shape, a new component, or a layout change
  updates this doc in the same commit — never a tree where docs contradict code.

## Adding a feature

1. **Data layer** — extend `src/data/lessons.json` and its type in `src/data/types.ts`. New copy,
   colours or day labels go there, never into a component.
2. **Components** — add or extend components in `src/components/`.
3. **Page** — mount the component in `src/pages/` where it belongs, or create a new page.
4. **Build and verify** — run `npm run build` and check the output.
5. **Commit** — with a clear message describing what data or UI changed.

**Copy from** — canonical examples for building blocks:

| Building…                  | Copy the pattern from                                        |
| -------------------------- | ------------------------------------------------------------ |
| Page structure / layout    | [src/pages/index.astro](../../src/pages/index.astro)         |
| Data type definitions      | [src/data/types.ts](../../src/data/types.ts)                 |
| A component reading labels | [src/components/WeekGrid.astro](../../src/components/WeekGrid.astro) |
| Build-time transform       | [src/utils/plan.ts](../../src/utils/plan.ts)                 |
| Band-aware layout CSS      | [src/assets/plan.css](../../src/assets/plan.css)             |
| Runtime (clock, day pick)  | the `<script>` in [src/pages/index.astro](../../src/pages/index.astro) |

## Keeping docs in sync

Two doc classes, two rules:

- **Durable docs** — CLAUDE.md, README.md, and every doc under `docs/` — describe the **current**
  state. They must never contradict the code.
- **Working notes** — a plan file for an in-flight multi-session feature — are scratch. They are
  deleted at close-out; the durable record is the commit history plus the archive entry.

Durable docs stay current two ways:

- **Per commit (scoped, primary):** a commit that changes code or config updates the durable docs
  that change affects, in the _same commit_ — use the map below to find which. Local and cheap:
  touch only what the change touches.
- **Per iteration (full, backstop):** the close-out of a feature-sized change runs one repo-wide
  **reconcile** auditing all durable docs against the code, fixing whatever the per-commit passes
  missed.

**Doc-sync map** — when you change… update these.

| Change                             | Sync these durable docs                                             |
| ---------------------------------- | ------------------------------------------------------------------- |
| Data shape (JSON / types)          | `architecture.md`; this guide (Copy-from)                           |
| User-visible copy or a colour      | `lessons.json` only — no doc change, but never a component          |
| New component or changed structure | this guide (Copy-from); `architecture.md` (layout)                  |
| New page or route                  | this guide (Copy-from); README.md if user-facing                    |
| Build config or command            | this guide (command reference); CLAUDE.md if the gate story changes |
| Styling / UI convention            | this guide (Conventions); [styling.md](styling.md)                  |
| Product behavior / content         | README.md; any user-facing docs                                     |
| Working method / process change    | CLAUDE.md (the routing table); `docs/workflow.md`                   |

The map is the single lookup both the per-commit sync and the retro reconcile use — keep it current
when you add a new doc or code area.

## Full command reference

| Command           | Purpose                                    |
| ----------------- | ------------------------------------------ |
| `npm run dev`     | Dev server with hot reload                 |
| `npm run build`   | Production static build. Confirms compile. |
| `npm run preview` | Preview the production build locally       |

**The gate** is `npm run build`. It runs at pre-push and in CI.

**What the gate does not do:** it does not typecheck. `astro build` transpiles; `@astrojs/check` is
not installed, so a type error in `.astro` frontmatter compiles and ships. Until that is fixed
(`docs/owner-tasks.md`), typecheck a changed `.ts` module by hand:

```bash
npx tsc --noEmit --strict --resolveJsonModule --module esnext --moduleResolution bundler --target es2022 --skipLibCheck src/utils/plan.ts
```
