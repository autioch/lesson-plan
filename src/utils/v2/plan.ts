/**
 * Build-time transform: `lessons.json` → the shape the v2 components render.
 *
 * Everything derived lives here — the shared row set, time ranges, break text,
 * per-day cells, ink colors and the grouped legend. Components read the result
 * and lay it out; they compute nothing.
 */

import type { LessonsPlan } from "../../data/lessonTypes";
import {
  OMITTED_LEGEND_TITLE,
  dayShort,
  legendTitle,
  shortName,
} from "./presentation.ts";

/** Teacher values that mean "no single name" — never rendered, on any surface. */
const NO_TEACHER = new Set(["multiple", "<extra>"]);

const INK_DARK = "#17170F";
const INK_LIGHT = "#FFFFFF";
const SUB_ON_LIGHT = "#5A5648";
const SUB_ON_DARK = "rgba(255,255,255,0.85)";

export interface PlanCell {
  /** Full lesson name, as it is in the data. Empty slots carry "". */
  name: string;
  /** Name shortened for narrow columns; equals `name` when nothing is shortened. */
  short: string;
  /** Teacher name, or "" when the slot is empty or the data has no single name. */
  teacher: string;
  /** Exact hex from the data. Empty slots carry "". */
  color: string;
  /** Text color for this background. */
  ink: string;
  /** Secondary text color (teacher line) for this background. */
  sub: string;
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
  isToday: boolean;
}

export interface LegendGroup {
  color: string;
  /** What the color means. The lessons carrying it are on screen already. */
  title: string;
}

export interface Plan {
  days: PlanDay[];
  rows: PlanRow[];
  legend: LegendGroup[];
  /** 0–4 for Mon–Fri, or -1 at the weekend. */
  todayIndex: number;
  /** The day the page opens on: today, or Monday at the weekend. */
  initialDayIndex: number;
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

/**
 * Relative luminance, the design's formula: channels straight off the hex, no
 * gamma step. Below 0.55 the tile takes white text. Do not swap this for the
 * WCAG-linearized version — it flips the greens to white text, against the
 * design's stated outcome that `#08f` is the only tile with white text.
 */
function luminance(hex: string): number {
  let h = hex.replace("#", "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function formatBreak(gapMinutes: number): string {
  if (gapMinutes <= 0) return "";
  if (gapMinutes > 60) return `+${Math.floor(gapMinutes / 60)}h przerwy`;
  return `+${gapMinutes}min przerwy`;
}

const EMPTY_CELL: PlanCell = {
  name: "",
  short: "",
  teacher: "",
  color: "",
  ink: INK_DARK,
  sub: SUB_ON_LIGHT,
  empty: true,
};

export function buildPlan(data: LessonsPlan, now = new Date()): Plan {
  const types = new Map(data.lessonTypes.map((t) => [t.id, t]));
  const teachers = new Map(data.teachers.map((t) => [t.id, t.name]));

  /** A lesson counts only when it has a type and is not marked ignored. */
  const lessonAt = (dayIndex: number, slotIndex: number) => {
    const lesson = data.days[dayIndex]?.lessons?.[slotIndex];
    if (!lesson || !lesson.lessonId || lesson.ignored) return null;
    return lesson;
  };

  /* Row set: every slot used by any day, shared across days so rows don't jump
   * when the phone switches day. Slots nobody uses never render. */
  const usedSlots = data.slots
    .map((_, slotIndex) => slotIndex)
    .filter((slotIndex) =>
      data.days.some((_, dayIndex) => lessonAt(dayIndex, slotIndex)),
    );

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
      cells: data.days.map((_, dayIndex) => {
        const lesson = lessonAt(dayIndex, slotIndex);
        if (!lesson) return EMPTY_CELL;

        const type = types.get(lesson.lessonId);
        if (!type) return EMPTY_CELL;

        const teacher = teachers.get(lesson.teacherId) ?? "";
        const dark = luminance(type.color) < 0.55;

        return {
          name: type.name,
          short: shortName(type.name),
          teacher: NO_TEACHER.has(teacher) ? "" : teacher,
          color: type.color,
          ink: dark ? INK_LIGHT : INK_DARK,
          sub: dark ? SUB_ON_DARK : SUB_ON_LIGHT,
          empty: false,
        };
      }),
    };
  });

  /* Legend: only types that actually appear in the plan, grouped by color. */
  const usedTypeIds = new Set<string>();
  data.days.forEach((_, dayIndex) =>
    data.slots.forEach((_slot, slotIndex) => {
      const lesson = lessonAt(dayIndex, slotIndex);
      if (lesson) usedTypeIds.add(lesson.lessonId);
    }),
  );

  const legend: LegendGroup[] = [];
  data.lessonTypes
    .filter((type) => usedTypeIds.has(type.id))
    .forEach((type) => {
      const title = legendTitle(type.color, type.name);
      if (title === OMITTED_LEGEND_TITLE) return;
      if (legend.some((group) => group.title === title)) return;

      legend.push({ color: type.color, title });
    });

  const weekday = now.getDay();
  const todayIndex = weekday >= 1 && weekday <= 5 ? weekday - 1 : -1;

  return {
    days: data.days.map((day, index) => ({
      name: day.name,
      short: dayShort(day.name),
      isToday: index === todayIndex,
    })),
    rows,
    legend,
    todayIndex,
    initialDayIndex: todayIndex < 0 ? 0 : todayIndex,
  };
}
