/**
 * The shape of the plan data — the single source for everything the plan
 * displays: the schedule, the palette, and every fixed string on screen.
 *
 * Nothing user-visible is allowed to live outside that data, so this type is
 * also the checklist for what a component may render.
 *
 * It is split in three files, along one line: **how often does it change?**
 * `commons.json` is the school's fixtures — copy, colours, bell times, the days
 * of the week — and effectively frozen. `catalog.json` is reference data, the
 * people and the subjects: it grows as new ones appear and is never rewritten.
 * `<year>.json` is one year's facts, its week, and is never edited once
 * published. `plans/index.ts` merges the three into one `LessonsPlan`, which is
 * what the transform and the components see.
 *
 * Two files are shared, so an edit to either reaches back into published years.
 * That is the point for a correction — a misspelled teacher lands in every year
 * at once — and it is why catalog rows are appended and never repurposed. A
 * teacher who leaves keeps their row; the lessons simply stop referencing it.
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
  /**
   * Opaque and permanent, for the same reason a slot's is: names change —
   * marriages, corrections, a co-teaching pair splitting up — and a key that is
   * also displayed data starts lying. Never reused once allocated.
   */
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
  /**
   * Readable, unlike a teacher's — a subject's identity does not change, so
   * there is nothing here to rot. Two subjects that merely read alike
   * ("Gimnastyka korekcyjna" and "kompensacyjna") are two rows, not one.
   */
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
  /**
   * The bell day, in order. A year renders the span from the first slot its
   * week uses to the last — unused slots inside it keep their row, unused ends
   * are trimmed — so the same bell day yields a different grid height per year.
   */
  slots: Slot[];
  /** The week, in order. */
  days: Day[];
};

/**
 * `catalog.json` — the people and subjects the years draw on. Append-only: a
 * row is added when a new teacher or subject appears and edited only to correct
 * it. Rows no year references any more are inert — `buildPlan` renders what the
 * lessons point at, so a retired subject costs nothing but a line.
 */
export type PlanCatalog = {
  teachers: Teacher[];
  lessonTypes: LessonType[];
};

/** `<year>.json` — one year's week. Never edited once published. */
export type SchoolYear = {
  /**
   * `Day.id` → `Slot.id` → the lesson. Every key on both levels must resolve
   * or `buildPlan` throws, so a retired slot or a mistyped day can never
   * silently blank a week. A slot with no entry is free.
   */
  lessons: Record<string, Record<string, Lesson>>;
};

export type LessonsPlan = PlanCommons & PlanCatalog & SchoolYear;
