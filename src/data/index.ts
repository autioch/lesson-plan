/**
 * Every school year the site has ever published, keyed by the September it
 * starts. A year is added, never edited in place; `commons.json` and
 * `catalog.json` are merged in here so a year file holds only its week — see
 * `./types.ts`. Each page picks its own year out of `plans`.
 *
 * Every year is merged and typed, not just the current one, so a schema change
 * makes `astro check` name each year file that needs fixing instead of letting
 * it rot unnoticed. An outlived year is deleted on purpose.
 *
 * Adding a year: README.md § Publish a new school year.
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
