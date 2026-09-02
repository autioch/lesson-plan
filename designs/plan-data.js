/* Dane planu lekcji — kontrakt danych dla implementacji.
 *
 * Kształt 1:1 z repo autioch/lesson-plan (gałąź main, katalog src/data).
 * To jedyne źródło godzin, nazw zajęć, kolorów i nauczycieli w tym projekcie.
 * Warstwa prezentacji (skróty nazw, grupowanie legendy) NIE należy tutaj —
 * siedzi w komponencie, bo to decyzja projektowa, nie dane.
 *
 * Plan jest statyczny: publikowany raz na semestr, drukowany, potem tylko
 * oglądany. Żaden ekran nie edytuje tych danych.
 */

/* src/data/slots — indeks slotu = numer lekcji, liczony od 0.
 * start: "HH:MM" (czas lokalny szkoły), duration: minuty. */
export const SLOTS = [
  { start: "07:30", duration: 45 },
  { start: "08:15", duration: 45 },
  { start: "09:05", duration: 45 },
  { start: "10:00", duration: 45 },
  { start: "11:00", duration: 45 },
  { start: "11:55", duration: 45 },
  { start: "13:00", duration: 45 },
  { start: "14:05", duration: 45 },
  { start: "14:55", duration: 45 },
  { start: "15:45", duration: 45 },
  { start: "16:45", duration: 60 }
];

/* src/data/lessonTypes — klucz = id typu zajęć.
 * color to hex wprost z danych; w UI zawsze w pełnej sile, nigdy rozcieńczany. */
export const TYPES = {
  "1_ep": { name: "Edukacja", color: "#ffffff" },
  "2_eng": { name: "Angielski", color: "#80d7f1" },
  "3_wfew": { name: "W/F ew", color: "#9bf093" },
  "4_pool": { name: "Basen", color: "#57d14c" },
  "5_wf": { name: "W/F", color: "#9bf093" },
  "6_art": { name: "Zajęcia Twórcze", color: "#f7aec6" },
  "7_extra": { name: "Kółko", color: "#ffb8bd" },
  "8_gimkor": { name: "Gimnastyka korekcyjna", color: "#7cd874" },
  "9_ethics": { name: "Religia/Etyka", color: "#92cbe2" },
  "10_rhytm": { name: "Rytmika", color: "#fcb8e7" },
  "11_": { name: "Logopedia", color: "#fcb8e7" },
  "12_": { name: "Akrobatyka", color: "#08f" },
  "13_": { name: "Trening Umiejętności Społecznych", color: "#08f" },
  "17_": { name: "Robotyka", color: "#08f" },
  "19_": { name: "Dance 4 Friends", color: "#08f" },
  "20_": { name: "Akademia Gier CUBE", color: "#08f" },
  "21_": { name: "Szachy", color: "#08f" }
};

/* src/data/teachers — klucz = id nauczyciela.
 * "multiple" i "<extra>" to wartości z repo: brak jednego nazwiska.
 * UI nie pokazuje ich na wydruku ani w komórkach tygodnia. */
export const TEACHERS = {
  t1: "MSkrzypczak",
  t2: "APiskorska/IGłowacka",
  t3: "IGruszka",
  t4: "ESzymańska",
  t5: "AKozłowska",
  t6: "ABartkowski",
  t7: "multiple",
  t8: "Joanna Nikuła-Szymaniak",
  t9: "<extra>"
};

/* src/data/lessons.json — pięć dni roboczych w kolejności tygodnia.
 * lessons: { <indeks slotu>: [ <id typu>, <id nauczyciela> ] }.
 * Brak klucza = wolny slot. Sloty nie muszą być ciągłe (np. środa ma lukę
 * między 6 a 10) i nie każdy dzień kończy się tym samym slotem. */
export const DAYS = [
  { name: "Poniedziałek", short: "Pn", lessons: { 1: ["1_ep", "t1"], 2: ["1_ep", "t1"], 3: ["1_ep", "t1"], 4: ["1_ep", "t1"], 5: ["1_ep", "t1"], 6: ["2_eng", "t2"], 7: ["12_", "t9"] } },
  { name: "Wtorek", short: "Wt", lessons: { 1: ["1_ep", "t1"], 2: ["3_wfew", "t1"], 3: ["1_ep", "t1"], 4: ["1_ep", "t1"], 5: ["2_eng", "t2"], 6: ["8_gimkor", "t3"] } },
  { name: "Środa", short: "Śr", lessons: { 1: ["1_ep", "t1"], 2: ["2_eng", "t2"], 3: ["4_pool", "t7"], 4: ["4_pool", "t7"], 5: ["9_ethics", "t6"], 6: ["10_rhytm", "t4"], 10: ["11_", "t8"] } },
  { name: "Czwartek", short: "Cz", lessons: { 1: ["1_ep", "t1"], 2: ["5_wf", "t3"], 3: ["1_ep", "t1"], 4: ["1_ep", "t1"], 5: ["1_ep", "t1"], 6: ["1_ep", "t1"], 7: ["17_", "t9"], 8: ["19_", "t9"] } },
  { name: "Piątek", short: "Pt", lessons: { 1: ["1_ep", "t1"], 2: ["6_art", "t1"], 3: ["6_art", "t1"], 4: ["5_wf", "t3"], 5: ["7_extra", "t1"], 7: ["20_", "t1"] } }
];
