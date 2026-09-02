/**
 * Build-time transform: `lessons.json` → the shape the components render.
 *
 * Everything derived lives here — the shared row set, time ranges, break text,
 * per-day cells and the legend. Components read the result and lay it out; they
 * compute nothing and they hold no copy of their own.
 *
 * What is deliberately *not* here: today. The site is built once a term, so the
 * weekday is a runtime fact — the page script decides it. Nothing in this file
 * may read the clock.
 *
 * A reference that does not resolve (an unknown lesson, colour or teacher id)
 * throws. `lessons.json` is hand-edited, and a blank tile on a school timetable
 * is worse than a red build.
 */

import type { Labels, LessonsPlan } from "../data/types";

export interface PlanCell {
  /** Full lesson name, as it is in the data. Empty slots carry "". */
  name: string;
  /** Name shortened for narrow columns; equals `name` when nothing is shortened. */
  short: string;
  /** Teacher name, or "" when the slot is empty or the record is a placeholder. */
  teacher: string;
  /** Exact hex from the palette. Empty slots carry "". */
  color: string;
  empty: boolean;
}

export interface PlanRow {
  /** Index into `slots` — kept so markup can be traced back to the data. */
  slotIndex: number;
  /** "HH:MM - HH:MM" */
  range: string;
  /** "+15min przerwy" / "+3h przerwy", or "" when the next row follows directly. */
  breakText: string;
  /** One cell per day, in week order. */
  cells: PlanCell[];
}

export interface PlanDay {
  name: string;
  short: string;
  /** ISO weekday, 1 = Monday — what the page script matches the clock against. */
  weekday: number;
}

export interface LegendGroup {
  color: string;
  /** What the color means. The lessons carrying it are on screen already. */
  title: string;
}

export interface Plan {
  locale: string;
  labels: Labels;
  days: PlanDay[];
  rows: PlanRow[];
  legend: LegendGroup[];
}

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
  const teachers = new Map(data.teachers.map((teacher) => [teacher.id, teacher]));

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

  /** A lesson counts only when it has a type and is not marked ignored. */
  const lessonAt = (dayIndex: number, slotIndex: number) => {
    const lesson = data.days[dayIndex]?.lessons?.[slotIndex];
    if (!lesson?.lessonId || lesson.ignored) return null;
    return lesson;
  };

  /* Row set: every slot used by any day, shared across days so rows don't jump
   * when the phone switches day. Slots nobody uses never render. */
  const usedSlots = data.slots
    .map((_, slotIndex) => slotIndex)
    .filter((slotIndex) =>
      data.days.some((_, dayIndex) => lessonAt(dayIndex, slotIndex)),
    );

  const usedColorIds = new Set<string>();

  const rows: PlanRow[] = usedSlots.map((slotIndex, position) => {
    const slot = data.slots[slotIndex];
    const start = toMinutes(slot.start);
    const end = start + slot.duration;
    const nextSlotIndex = usedSlots[position + 1];
    const gap =
      nextSlotIndex === undefined
        ? 0
        : toMinutes(data.slots[nextSlotIndex].start) - end;

    return {
      slotIndex,
      range: `${slot.start} - ${toTime(end)}`,
      breakText: formatBreak(gap),
      cells: data.days.map((day, dayIndex) => {
        const lesson = lessonAt(dayIndex, slotIndex);
        if (!lesson?.lessonId) return EMPTY_CELL;

        const type = types.get(lesson.lessonId);
        if (!type) {
          throw new Error(
            `${day.name}, slot ${slotIndex}: unknown lessonId "${lesson.lessonId}"`,
          );
        }

        const color = colors.get(type.colorId);
        if (!color) {
          throw new Error(
            `Lesson type "${type.id}": unknown colorId "${type.colorId}"`,
          );
        }

        const teacher = lesson.teacherId
          ? teachers.get(lesson.teacherId)
          : undefined;
        if (lesson.teacherId && !teacher) {
          throw new Error(
            `${day.name}, slot ${slotIndex}: unknown teacherId "${lesson.teacherId}"`,
          );
        }

        usedColorIds.add(color.id);

        return {
          name: type.name,
          short: type.short ?? type.name,
          teacher: teacher && !teacher.anonymous ? teacher.name : "",
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
