/**
 * Every school year the site has ever published, and which one is live.
 *
 * A year is added, never edited in place: `2025.json` is exactly what hung on
 * the wall in 2025 and stays that way. Only `ACTIVE_YEAR` moves — that one line
 * is the whole "publish next year" change, and its diff says which year went up.
 *
 * Every year is imported, not just the active one, so `astro check` types them
 * all against `LessonsPlan`. That is deliberate: when the type changes, the
 * build names each file that needs fixing instead of leaving the archive to rot
 * unnoticed. An archive that has genuinely outlived the schema gets deleted on
 * purpose, not left behind to drift.
 *
 * Adding a year: docs/importing-a-plan.md.
 */

import type { LessonsPlan } from "../types";

import y2025 from "./2025.json";
import y2026 from "./2026.json";

/** Keyed by the September the plan starts. */
export const plans: Record<string, LessonsPlan> = {
  "2025": y2025,
  "2026": y2026,
};

/** The year the site renders. The only line that moves in September. */
export const ACTIVE_YEAR = "2026";
