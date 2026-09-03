/**
 * Build-time transform: the merged plan → the shape the components render.
 *
 * Everything derived lives here — time ranges, break text, per-day cells and
 * the legend. Components read the result and lay it out; they compute nothing
 * and they hold no copy of their own.
 *
 * What is deliberately *not* here: today. The site is built once a term, so the
 * weekday is a runtime fact — the page script decides it. Nothing in this file
 * may read the clock.
 *
 * A reference that does not resolve (an unknown lesson, colour or teacher id,
 * or a day with no lessons filed under its name) throws. The plan files are
 * hand-edited, and a blank tile on a school timetable is worse than a red
 * build.
 *
 * Nothing here is built for a shape the data does not have. Every field below
 * is read by a component; every branch is one the current plan reaches.
 *
 * **One name per concept, all the way through.** This file declares a type only
 * for what it actually derives — a row, a cell, the plan itself. Anything it
 * passes through keeps the data's own type and the data's own field names, so a
 * colour is `hex` and a legend caption is `name` in the JSON, here, and in the
 * component. Renaming a field on the way out buys nothing and costs everyone
 * the lookup.
 */

import type { Day, Labels, LessonsPlan, PaletteColor } from "../data/types";

/**
 * One slot on one day: a lesson, or nothing at all. An empty cell carries no
 * other field — the component puts `labels.freeSlot` in its place and reads
 * nothing else, so there is no blank name or colour to get wrong.
 */
export type PlanCell =
  | { empty: true }
  | {
      empty: false;
      /** Full lesson name, as it is in the data. */
      name: string;
      /** Name shortened for narrow columns; equals `name` when nothing is shortened. */
      nameShort: string;
      /**
       * Teacher name, or "" when the record is a placeholder. The one field
       * here that is renamed on the way in: a cell flattens a lesson type and
       * a teacher, and `name` is already the lesson's.
       */
      teacher: string;
      /** Exact hex from the palette — same field name as `PaletteColor.hex`. */
      hex: string;
    };

export type PlanRow = {
  /** "HH:MM - HH:MM" */
  range: string;
  /** "+15min przerwy", or "" when the next row follows directly. */
  breakText: string;
  /** One cell per day, in week order. */
  cells: PlanCell[];
};

export type Plan = {
  locale: string;
  labels: Labels;
  /** The week, straight from the data — nothing here is derived. */
  days: Day[];
  rows: PlanRow[];
  /** The palette rows worth showing, in palette order. Filtered, not reshaped. */
  legend: PaletteColor[];
};

/** Shared: every free slot renders the same way, and none of them is mutated. */
const EMPTY_CELL: PlanCell = { empty: true };

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function toTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function buildPlan(data: LessonsPlan): Plan {
  const colors = new Map(data.palette.map((color) => [color.id, color]));
  const types = new Map(data.lessonTypes.map((type) => [type.id, type]));
  const teachers = new Map(
    data.teachers.map((teacher) => [teacher.id, teacher]),
  );
  const slotIds = new Set(data.slots.map((slot) => slot.id));

  /* Both levels of `lessons` are foreign keys, so both are checked up front
   * rather than trusted. A key that resolves to nothing would render as a blank
   * column or a lost lesson — a plausible-looking week hiding a typo. */
  for (const [dayId, daySlots] of Object.entries(data.lessons)) {
    if (!data.days.some((day) => day.id === dayId)) {
      throw new Error(`Lessons filed under unknown day "${dayId}"`);
    }
    for (const slotId of Object.keys(daySlots)) {
      if (!slotIds.has(slotId)) {
        throw new Error(`Day "${dayId}": unknown slotId "${slotId}"`);
      }
    }
  }

  for (const day of data.days) {
    if (!data.lessons[day.id]) {
      throw new Error(`No lessons filed for day "${day.id}"`);
    }
  }

  /** A slot with no row is free; so is one the family does not attend. */
  function lessonAt(dayId: string, slotId: string) {
    const lesson = data.lessons[dayId][slotId];
    return lesson && !lesson.ignored ? lesson : null;
  }

  function cellAt(dayId: string, slotId: string): PlanCell {
    const lesson = lessonAt(dayId, slotId);
    if (!lesson) return EMPTY_CELL;

    const type = types.get(lesson.lessonId);
    if (!type) {
      throw new Error(
        `${dayId}/${slotId}: unknown lessonId "${lesson.lessonId}"`,
      );
    }

    const color = colors.get(type.colorId);
    if (!color) {
      throw new Error(
        `Lesson type "${type.id}": unknown colorId "${type.colorId}"`,
      );
    }

    const teacher = teachers.get(lesson.teacherId);
    if (!teacher) {
      throw new Error(
        `${dayId}/${slotId}: unknown teacherId "${lesson.teacherId}"`,
      );
    }

    return {
      empty: false,
      name: type.name,
      nameShort: type.nameShort ?? type.name,
      teacher: teacher.anonymous ? "" : teacher.name,
      hex: color.hex,
    };
  }

  /* Row set: the span from the first slot this week uses to the last. A slot
   * nobody uses *inside* that span still gets its own row — an empty hour is
   * the truth, and dropping it would fold two free slots into one and overstate
   * the break on the row above. Unused slots outside the span are trimmed: they
   * are the school day running wider than this class's week, not gaps in it,
   * and an empty band above and below the plan is noise on every surface. The
   * grid is therefore a different height each year, by design. */
  const slotUsed = data.slots.map((slot) =>
    data.days.some((day) => lessonAt(day.id, slot.id)),
  );
  const firstSlot = slotUsed.indexOf(true);
  const spanSlots =
    firstSlot < 0
      ? []
      : data.slots.slice(firstSlot, slotUsed.lastIndexOf(true) + 1);

  const rows: PlanRow[] = spanSlots.map((slot, offset) => {
    const end = toMinutes(slot.start) + slot.duration;
    /* The last row of the span has nothing to wait for, so it shows no break. */
    const next = spanSlots[offset + 1];
    const gap = next ? toMinutes(next.start) - end : 0;

    return {
      range: `${slot.start} - ${toTime(end)}`,
      breakText:
        gap > 0 ? data.labels.breakMinutes.replace("{value}", String(gap)) : "",
      cells: data.days.map((day) => cellAt(day.id, slot.id)),
    };
  });

  /* Legend: palette order, only colours a rendered lesson actually carries, and
   * only those that carry an instruction. The rendered cells are the source —
   * palette hexes are unique, so a hex names exactly one palette entry. */
  const usedColors = new Set(
    rows.flatMap((row) =>
      row.cells.flatMap((cell) => (cell.empty ? [] : [cell.hex])),
    ),
  );

  return {
    locale: data.locale,
    labels: data.labels,
    days: data.days,
    rows,
    legend: data.palette.filter(
      (color) => color.inLegend && usedColors.has(color.hex),
    ),
  };
}
