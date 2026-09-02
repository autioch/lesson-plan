/**
 * Every school year the site has ever published, and which one is live.
 *
 * A year is added, never edited in place: `2025.json` is exactly the week that
 * hung on the wall in 2025 and stays that way. Only `ACTIVE_YEAR` moves — that
 * one line is the whole "publish next year" change, and its diff says which
 * year went up.
 *
 * What the years share — copy, palette, bell times, the days of the week —
 * lives once in `commons.json` and is merged in here, so a year file holds
 * only what that year decided. See `../types.ts` for where the line falls.
 *
 * Every year is merged and typed, not just the active one, so `astro check`
 * types them all against `LessonsPlan`. That is deliberate: when the type
 * changes, the build names each file that needs fixing instead of leaving the
 * archive to rot unnoticed. An archive that has genuinely outlived the schema
 * gets deleted on purpose, not left behind to drift.
 *
 * Adding a year: docs/importing-a-plan.md.
 */

import type { LessonsPlan, PlanCommons, SchoolYear } from "../types";

import commonsData from "./commons.json";
import y2025 from "./2025.json";
import y2026 from "./2026.json";

const commons: PlanCommons = commonsData;

const years: Record<string, SchoolYear> = {
  "2025": y2025,
  "2026": y2026,
};

/** Keyed by the September the plan starts. */
export const plans: Record<string, LessonsPlan> = Object.fromEntries(
  Object.entries(years).map(([year, data]) => [year, { ...commons, ...data }]),
);

/** The year the site renders. The only line that moves in September. */
export const ACTIVE_YEAR = "2026";
