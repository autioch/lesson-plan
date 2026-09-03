/**
 * The shape of the plan data — the single source for everything the plan
 * displays, so this type is also the checklist for what a component may render.
 *
 * Split across three files by how often each changes, merged into one
 * `LessonsPlan` by `index.ts`: `commons.json` is the school's frozen fixtures
 * (copy, colours, bell times, days); `catalog.json` is append-only reference
 * data (people, subjects); `<year>.json` is one year's week, never edited once
 * published.
 *
 * The two shared files reach back into published years — the point for a
 * correction (a misspelled teacher fixed everywhere at once), and why catalog
 * rows are appended, never repurposed: a teacher who leaves keeps their row and
 * the lessons simply stop referencing it.
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
  /** `{value}` is replaced with the gap in minutes. */
  breakMinutes: string;
};

/**
 * One colour of the plan's palette — the only place a lesson colour is written.
 * `legendTitle` says what the colour means; a colour that asks nothing of the
 * family (plain white) sits out of the legend with `inLegend: false`.
 */
export type PaletteColor = {
  id: string;
  hex: string;
  /** The legend caption — what this colour tells the reader (e.g. "Basen"). */
  name: string;
  inLegend: boolean;
};

type Teacher = {
  /**
   * Opaque and permanent: names change (marriages, corrections), and a key that
   * doubles as displayed data starts lying. Never reused once allocated.
   */
  id: string;
  name: string;
  /** A placeholder record ("multiple", "<extra>") — never rendered as a name. */
  anonymous?: boolean;
};

type Slot = {
  /** Opaque and permanent — deliberately not the time, since bell times move. */
  id: string;
  /** "HH:MM" */
  start: string;
  /** Minutes. */
  duration: number;
};

type LessonType = {
  /**
   * Readable, unlike a teacher's — a subject's identity does not change. Two
   * subjects that read alike ("Gimnastyka korekcyjna" and "kompensacyjna") are
   * two rows, not one.
   */
  id: string;
  name: string;
  /** Abbreviation for the narrow band; the full name is used when absent. */
  nameShort?: string;
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

export type Day = {
  /** Readable, unlike a slot's — a day's identity cannot change. */
  id: string;
  /** Display only. */
  name: string;
  /** Two-letter label for the phone tabs. */
  nameShort: string;
  /** ISO weekday, 1 = Monday. Matched against the browser clock at runtime. */
  weekday: number;
};

/** `commons.json` — the school's fixtures, shared by every year. */
export type PlanCommons = {
  /** BCP 47 tag for `<html lang>`. */
  locale: string;
  labels: Labels;
  palette: PaletteColor[];
  /** The bell day, in order. `buildPlan` trims it to each year's used span. */
  slots: Slot[];
  /** The week, in order. */
  days: Day[];
};

/**
 * `catalog.json` — the people and subjects the years draw on. Append-only, and
 * unreferenced rows are inert: `buildPlan` renders only what lessons point at,
 * so a retired subject costs nothing but a line.
 */
export type PlanCatalog = {
  teachers: Teacher[];
  lessonTypes: LessonType[];
};

/** `<year>.json` — one year's week. Never edited once published. */
export type SchoolYear = {
  /**
   * `Day.id` → `Slot.id` → the lesson. Every key must resolve or `buildPlan`
   * throws, so a mistyped key can never silently blank a week. A slot with no
   * entry is free.
   */
  lessons: Record<string, Record<string, Lesson>>;
};

export type LessonsPlan = PlanCommons & PlanCatalog & SchoolYear;
