/**
 * Presentation decisions for the v2 plan — NOT data.
 *
 * Lesson names, colors, hours and teachers live in `src/data/lessons.json`.
 * What sits here is how that data is *shown*: which names get shortened when a
 * cell is too narrow, how colors are grouped into legend entries, and the
 * two-letter day labels. Source: `designs/Przekazanie deweloperom.dc.html`.
 */

/** Two-letter day labels for the phone tabs, keyed by the day name in the data. */
const DAY_SHORTS: Record<string, string> = {
  Poniedziałek: "Pn",
  Wtorek: "Wt",
  Środa: "Śr",
  Czwartek: "Cz",
  Piątek: "Pt",
};

export function dayShort(name: string): string {
  return DAY_SHORTS[name] ?? name.slice(0, 2);
}

/**
 * Shortened lesson names, used only in the week grid below 1024px where a
 * column fits one line. Every other surface shows the full name from the data.
 */
const SHORT_NAMES: Record<string, string> = {
  "Gimnastyka korekcyjna": "Gimn. kor.",
  "Trening Umiejętności Społecznych": "TUS",
  "Zajęcia Twórcze": "Twórcze",
  "Akademia Gier CUBE": "Gry CUBE",
  "Dance 4 Friends": "Dance 4 F.",
  "Religia/Etyka": "Religia",
};

export function shortName(name: string): string {
  return SHORT_NAMES[name] ?? name;
}

/**
 * Legend groups, keyed by the lesson color. Several lesson types share a color
 * and one legend entry, which says what the color means — not which lessons
 * carry it, since those are on screen beside it. A color with no title here
 * falls back to the lesson name itself.
 *
 * Six coded colors, plus plain white for a lesson that needs no preparation.
 * Lessons that ask nothing of the family — Kółko, Religia/Etyka — are plain.
 */
const LEGEND_TITLES: Record<string, string> = {
  "#ffffff": "Zwykła lekcja",
  "#4fb0f0": "Język obcy",
  "#b6ee7a": "Spakuj strój",
  "#7fe7d5": "Basen — kąpielówki i czepek",
  "#ff8fb1": "Zajęcia twórcze",
  "#dcc0ff": "Zajęcia indywidualne i rytmika",
  "#ffcf4d": "Dodatkowe",
};

export function legendTitle(color: string, fallback: string): string {
  return LEGEND_TITLES[color.toLowerCase()] ?? fallback;
}

/** The plain-lesson group carries no instruction, so it stays out of the legend. */
export const OMITTED_LEGEND_TITLE = "Zwykła lekcja";
