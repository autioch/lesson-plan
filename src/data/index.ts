/**
 * Every school year the site has ever published, and which one is live. A year
 * is added, never edited in place; only `ACTIVE_YEAR` moves, and that one line
 * is the whole "publish next year" change. `commons.json` and `catalog.json`
 * are merged in here so a year file holds only its week — see `./types.ts`.
 *
 * Every year is merged and typed, not just the active one, so a schema change
 * makes `astro check` name each archive file that needs fixing instead of
 * letting it rot unnoticed. An outlived archive is deleted on purpose.
 *
 * Adding a year: docs/importing-a-plan.md.
 */

import type {
  LessonsPlan,
  PlanCatalog,
  PlanCommons,
  SchoolYear,
} from "./types";

import commonsData from "./commons.json";
import catalogData from "./catalog.json";
import y2025 from "./2025.json";
import y2026 from "./2026.json";

const commons: PlanCommons = commonsData;
const catalog: PlanCatalog = catalogData;

const years: Record<string, SchoolYear> = {
  "2025": y2025,
  "2026": y2026,
};

/** Keyed by the September the plan starts. */
export const plans: Record<string, LessonsPlan> = Object.fromEntries(
  Object.entries(years).map(([year, data]) => [
    year,
    { ...commons, ...catalog, ...data },
  ]),
);

/** The year the site renders. The only line that moves in September. */
export const ACTIVE_YEAR = "2026";
