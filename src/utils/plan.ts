/**
 * Build-time transform: the merged plan → the shape the components render. All
 * derivation lives here (time ranges, break text, per-day cells, the legend);
 * components lay the result out and compute nothing.
 *
 * `today` is deliberately absent: the site is built once a term, so the weekday
 * is a runtime fact the page script owns. Nothing here may read the clock.
 *
 * An unresolved reference (unknown lesson, colour or teacher id, or a day with
 * no lessons filed under its name) throws — the files are hand-edited, and a
 * blank tile on a school timetable is worse than a red build.
 *
 * One name per concept: a derived type is declared only for what this file
 * actually shapes; pass-through data keeps the JSON's own field names (a colour
 * is `hex`, a caption is `name`), because renaming on the way out only costs
 * the lookup.
 */

import type { Day, Labels, LessonsPlan, PaletteColor } from "../data/types";

/**
 * One slot on one day: a lesson, the pool of electives on offer there, or
 * nothing at all. An empty cell carries no other field — the component puts
 * `labels.freeSlot` in its place, so there is no blank name or colour to get
 * wrong. An elective cell has no teacher and no palette hex: the whole pool is
 * one merged tile in the fixed elective colour, hidden until the reader toggles
 * it on, so it reads as a free slot until then.
 */
export type PlanCell =
  | { empty: true }
  | {
      empty: false;
      elective: true;
      name: string;
      /** Shortened for narrow columns; equals `name` when nothing is shortened. */
      nameShort: string;
    }
  | {
      empty: false;
      elective?: false;
      name: string;
      /** Shortened for narrow columns; equals `name` when nothing is shortened. */
      nameShort: string;
      /** Teacher name, or "" when the record is a placeholder. */
      teacher: string;
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
  /** Palette rows worth showing, in palette order. Filtered, not reshaped. */
  legend: PaletteColor[];
  /** Whether any slot offers electives — the legend hides the toggle when not. */
  hasElectives: boolean;
};

/** Shared: every free slot renders the same, and none is mutated. */
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

  /* Both levels of `lessons` are foreign keys, checked up front: a key that
   * resolves to nothing would render as a blank column or a lost lesson — a
   * plausible-looking week hiding a typo. */
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

  /* Electives grouped by their slot, `dayId → slotId → names`. Keys are foreign
   * keys like a lesson's and checked the same way up front, so a mistyped slot
   * cannot silently drop an activity. The names keep their file order. */
  const electivesBySlot = new Map<string, Map<string, string[]>>();
  for (const elective of data.electives ?? []) {
    if (!data.days.some((day) => day.id === elective.dayId)) {
      throw new Error(`Elective filed under unknown day "${elective.dayId}"`);
    }
    if (!slotIds.has(elective.slotId)) {
      throw new Error(
        `Elective on day "${elective.dayId}": unknown slotId "${elective.slotId}"`,
      );
    }
    const byDay = electivesBySlot.get(elective.dayId) ?? new Map();
    electivesBySlot.set(elective.dayId, byDay);
    byDay.set(elective.slotId, [
      ...(byDay.get(elective.slotId) ?? []),
      elective.name,
    ]);
  }

  /** A slot with no row is free; so is one the family does not attend. */
  function lessonAt(dayId: string, slotId: string) {
    const lesson = data.lessons[dayId][slotId];
    return lesson && !lesson.ignored ? lesson : null;
  }

  /** The electives offered at a slot, or null — never an empty list. */
  function electivesAt(dayId: string, slotId: string): string[] | null {
    return electivesBySlot.get(dayId)?.get(slotId) ?? null;
  }

  function cellAt(dayId: string, slotId: string): PlanCell {
    const lesson = lessonAt(dayId, slotId);
    const electives = electivesAt(dayId, slotId);

    /* A slot is a fixed lesson or an elective pool, never both — a chosen
     * activity already sits in `lessons`, so an elective here as well would be a
     * data mistake, and a red build beats a tile that quietly picks one. */
    if (lesson && electives) {
      const type = types.get(lesson.lessonId);
      const name = [type?.name, ...electives].join(" / ");
      return { empty: false, elective: true, name, nameShort: name };
    }

    if (!lesson) {
      if (!electives) return EMPTY_CELL;
      const name = electives.join(" / ");
      return { empty: false, elective: true, name, nameShort: name };
    }

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

  /* Row set: the span from the first used slot to the last. An unused slot
   * *inside* the span keeps its row — an empty hour is the truth, and dropping
   * it would fold two free slots into one and overstate the break above. Unused
   * slots *outside* the span are trimmed: they are the school day running wider
   * than this class's week, not gaps in it. So the grid is a different height
   * each year, by design. */
  const slotUsed = data.slots.map((slot) =>
    data.days.some(
      (day) => lessonAt(day.id, slot.id) || electivesAt(day.id, slot.id),
    ),
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

  /* Legend: palette order, only colours a rendered lesson carries. The cells
   * are the source — palette hexes are unique, so a hex names one entry. */
  const usedColors = new Set(
    rows.flatMap((row) =>
      row.cells.flatMap((cell) =>
        !cell.empty && !cell.elective ? [cell.hex] : [],
      ),
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
    hasElectives: electivesBySlot.size > 0,
  };
}
