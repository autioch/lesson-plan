/**
 * The shape of the plan data — the single source for everything the plan
 * displays: the schedule, the palette, and every fixed string on screen.
 *
 * Nothing user-visible is allowed to live outside that data, so this type is
 * also the checklist for what a component may render.
 *
 * It is split in two files, along one line: **does a school year decide it?**
 * `commons.json` holds what the school fixes — copy, colours, bell times, the
 * days of the week; `<year>.json` holds what a year decides — its teachers,
 * its subjects, its week. `plans/index.ts` merges them back into one
 * `LessonsPlan`, which is what the transform and the components see.
 *
 * The split means an edit to commons reaches back into published years. That
 * is accepted for chrome and bell times and nothing else: a year's teachers,
 * lesson types and lessons stay in the year file, where they are never edited
 * again.
 */

/** Every fixed string on screen, so no component hardcodes copy. */
export type Labels = {
  pageTitle: string;
  /** The mark on today's tab and day header. */
  today: string;
  /** Appended to today's tab aria-label. */
  todayAria: string;
  freeSlot: string;
  dayTabsLabel: string;
  legendTitle: string;
  legendHint: string;
  /** `{value}` is replaced with the gap length. */
  breakMinutes: string;
  breakHours: string;
};

/**
 * One colour of the plan's palette — the only place a lesson colour is written.
 * `legendTitle` says what the colour means; a colour that asks nothing of the
 * family (plain white) sits out of the legend with `inLegend: false`.
 */
type PaletteColor = {
  id: string;
  hex: string;
  legendTitle: string;
  inLegend: boolean;
};

type Teacher = {
  id: string;
  name: string;
  /** A placeholder record ("multiple", "<extra>") — never rendered as a name. */
  anonymous?: boolean;
};

type Slot = {
  /**
   * Opaque and permanent. Deliberately not the time: bell times move, and a
   * key that is also displayed data either has to be rewritten everywhere or
   * starts lying. A retired slot's id is never reused.
   */
  id: string;
  /** "HH:MM" */
  start: string;
  /** Minutes. */
  duration: number;
};

type LessonType = {
  id: string;
  name: string;
  /** Abbreviation for the narrow band; the full name is used when absent. */
  short?: string;
  colorId: string;
};

/**
 * One lesson. A free slot has no row at all — absence is what "wolne" means,
 * so there is no empty-lesson shape to get wrong. Both references are required:
 * a lesson nobody teaches uses one of the anonymous teacher records.
 */
type Lesson = {
  lessonId: string;
  teacherId: string;
  /** Scheduled but not attended; rendered as a free slot. */
  ignored?: boolean;
};

type Day = {
  /**
   * Readable, unlike a slot's — a day's identity cannot change, so there is
   * nothing here to rot.
   */
  id: string;
  /** Display only. */
  name: string;
  /** Two-letter label for the phone tabs. */
  short: string;
  /** ISO weekday, 1 = Monday. Matched against the browser clock at runtime. */
  weekday: number;
};

/** `commons.json` — the school's fixtures, shared by every year. */
export type PlanCommons = {
  /** BCP 47 tag for `<html lang>`. */
  locale: string;
  labels: Labels;
  palette: PaletteColor[];
  /** The bell day, in order. Every slot renders, used or not. */
  slots: Slot[];
  /** The week, in order. */
  days: Day[];
};

/** `<year>.json` — what one school year decides. Never edited once published. */
export type SchoolYear = {
  teachers: Teacher[];
  lessonTypes: LessonType[];
  /**
   * `Day.id` → `Slot.id` → the lesson. Every key on both levels must resolve
   * or `buildPlan` throws, so a retired slot or a mistyped day can never
   * silently blank a week. A slot with no entry is free.
   */
  lessons: Record<string, Record<string, Lesson>>;
};

export type LessonsPlan = PlanCommons & SchoolYear;
