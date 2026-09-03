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
 */

import type { Labels, LessonsPlan } from "../data/types";

type PlanCell = {
  /** Full lesson name, as it is in the data. Empty slots carry "". */
  name: string;
  /** Name shortened for narrow columns; equals `name` when nothing is shortened. */
  short: string;
  /** Teacher name, or "" when the slot is empty or the record is a placeholder. */
  teacher: string;
  /** Exact hex from the palette. Empty slots carry "". */
  color: string;
  empty: boolean;
};

export type PlanRow = {
  /** Index into `slots` — kept so markup can be traced back to the data. */
  slotIndex: number;
  /** "HH:MM - HH:MM" */
  range: string;
  /** "+15min przerwy" / "+3h przerwy", or "" when the next row follows directly. */
  breakText: string;
  /** One cell per day, in week order. */
  cells: PlanCell[];
};

export type PlanDay = {
  name: string;
  short: string;
  /** ISO weekday, 1 = Monday — what the page script matches the clock against. */
  weekday: number;
};

export type LegendGroup = {
  color: string;
  /** What the color means. The lessons carrying it are on screen already. */
  title: string;
};

export type Plan = {
  locale: string;
  labels: Labels;
  days: PlanDay[];
  rows: PlanRow[];
  legend: LegendGroup[];
};

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function toTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const EMPTY_CELL: PlanCell = {
  name: "",
  short: "",
  teacher: "",
  color: "",
  empty: true,
};

export function buildPlan(data: LessonsPlan): Plan {
  const colors = new Map(data.palette.map((color) => [color.id, color]));
  const types = new Map(data.lessonTypes.map((type) => [type.id, type]));
  const teachers = new Map(
    data.teachers.map((teacher) => [teacher.id, teacher]),
  );

  function formatBreak(gapMinutes: number): string {
    if (gapMinutes <= 0) return "";
    if (gapMinutes > 60) {
      return data.labels.breakHours.replace(
        "{value}",
        String(Math.floor(gapMinutes / 60)),
      );
    }
    return data.labels.breakMinutes.replace("{value}", String(gapMinutes));
  }

  /* Both levels of `lessons` are foreign keys, so both are checked here rather
   * than trusted. A key that resolves to nothing would render as a blank column
   * or a lost lesson — a plausible-looking week hiding a typo. */
  const slotIds = new Set(data.slots.map((slot) => slot.id));

  const week = data.days.map((day) => {
    const rows = data.lessons[day.id];
    if (!rows) {
      throw new Error(`No lessons filed for day "${day.id}"`);
    }
    for (const slotId of Object.keys(rows)) {
      if (!slotIds.has(slotId)) {
        throw new Error(`Day "${day.id}": unknown slotId "${slotId}"`);
      }
    }
    return rows;
  });

  for (const dayId of Object.keys(data.lessons)) {
    if (!data.days.some((day) => day.id === dayId)) {
      throw new Error(`Lessons filed under unknown day "${dayId}"`);
    }
  }

  /** A slot with no row is free; so is one the family does not attend. */
  const lessonAt = (dayIndex: number, slotId: string) => {
    const lesson = week[dayIndex][slotId];
    return lesson && !lesson.ignored ? lesson : null;
  };

  const usedColorIds = new Set<string>();

  /* Row set: the span from the first slot this week uses to the last. A slot
   * nobody uses *inside* that span still gets its own row — an empty hour is
   * the truth, and dropping it would fold two free slots into one and overstate
   * the break on the row above. Unused slots outside the span are trimmed: they
   * are the school day running wider than this class's week, not gaps in it,
   * and an empty band above and below the plan is noise on every surface. The
   * grid is therefore a different height each year, by design. */
  const usedSlots = data.slots.flatMap((slot, slotIndex) =>
    data.days.some((_, dayIndex) => lessonAt(dayIndex, slot.id))
      ? [slotIndex]
      : [],
  );

  const firstSlot = usedSlots[0] ?? -1;
  const lastSlot = usedSlots[usedSlots.length - 1] ?? -1;

  const spanSlots =
    firstSlot < 0 ? [] : data.slots.slice(firstSlot, lastSlot + 1);

  const rows: PlanRow[] = spanSlots.map((slot, offset) => {
    const slotIndex = firstSlot + offset;
    const start = toMinutes(slot.start);
    const end = start + slot.duration;
    const gap =
      slotIndex === lastSlot
        ? 0
        : toMinutes(data.slots[slotIndex + 1].start) - end;

    return {
      slotIndex,
      range: `${slot.start} - ${toTime(end)}`,
      breakText: formatBreak(gap),
      cells: data.days.map((day, dayIndex) => {
        const lesson = lessonAt(dayIndex, slot.id);
        if (!lesson) return EMPTY_CELL;

        const type = types.get(lesson.lessonId);
        if (!type) {
          throw new Error(
            `${day.id}/${slot.id}: unknown lessonId "${lesson.lessonId}"`,
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
            `${day.id}/${slot.id}: unknown teacherId "${lesson.teacherId}"`,
          );
        }

        usedColorIds.add(color.id);

        return {
          name: type.name,
          short: type.short ?? type.name,
          teacher: teacher.anonymous ? "" : teacher.name,
          color: color.hex,
          empty: false,
        };
      }),
    };
  });

  /* Legend: palette order, only colours a rendered lesson actually carries, and
   * only those that carry an instruction. */
  const legend: LegendGroup[] = data.palette
    .filter((color) => color.inLegend && usedColorIds.has(color.id))
    .map((color) => ({ color: color.hex, title: color.legendTitle }));

  return {
    locale: data.locale,
    labels: data.labels,
    days: data.days.map((day) => ({
      name: day.name,
      short: day.short,
      weekday: day.weekday,
    })),
    rows,
    legend,
  };
}
