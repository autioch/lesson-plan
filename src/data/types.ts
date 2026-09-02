/**
 * The shape of `lessons.json` — the single source for everything the plan
 * displays: the schedule, the palette, and every fixed string on screen.
 *
 * Nothing user-visible is allowed to live outside that file, so this type is
 * also the checklist for what a component may render.
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

/** An empty slot is `{}` — a lesson without an id is one. */
type Lesson = {
  lessonId?: string;
  teacherId?: string;
  /** Scheduled but not attended; rendered as an empty slot. */
  ignored?: boolean;
};

type Day = {
  name: string;
  /** Two-letter label for the phone tabs. */
  short: string;
  /** ISO weekday, 1 = Monday. Matched against the browser clock at runtime. */
  weekday: number;
  /** One entry per slot, in `slots` order; trailing slots may be omitted. */
  lessons: Lesson[];
};

export type LessonsPlan = {
  /** BCP 47 tag for `<html lang>`. */
  locale: string;
  labels: Labels;
  palette: PaletteColor[];
  teachers: Teacher[];
  slots: Slot[];
  lessonTypes: LessonType[];
  days: Day[];
};
