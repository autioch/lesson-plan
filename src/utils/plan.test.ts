/**
 * The one automated test in the project: `buildPlan`'s validation contract (six
 * throws, the span rule, the legend filter) that the gate and the rendered-HTML
 * check never exercise, because both only see the happy path with real data.
 *
 * Runs on `node --test` against hand-built fixtures, never real `src/data`: the
 * transform is pure, so a crafted `LessonsPlan` is the whole input and a fixture
 * does not go red when next year's plan is published. Assertions are
 * behavioural, never a whole-output snapshot that every data edit would break. */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { LessonsPlan } from "../data/types";
/* The `.ts` extension is required here and nowhere else: `node --test`'s ESM
 * resolver does not guess extensions the way the Astro/Vite bundler does. */
import { buildPlan, type PlanCell } from "./plan.ts";

/**
 * A valid baseline that packs every awkward case into one plan: `s3` unused but
 * between two used slots, `s1`/`s5` unused at the ends, `cB` a legend colour no
 * lesson carries, `cC` a used colour kept out of the legend, `t2` anonymous.
 * Each test clones it and bends the one thing it is about.
 */
function makePlan(): LessonsPlan {
  return {
    locale: "pl",
    labels: {
      pageTitle: "Plan",
      today: "DZIŚ",
      todayAria: "dziś",
      freeSlot: "wolne",
      dayTabsLabel: "Dzień",
      legendTitle: "Legenda",
      legendHint: "hint",
      breakMinutes: "+{value}min przerwy",
    },
    palette: [
      { id: "cA", hex: "#aaaaaa", name: "Colour A", inLegend: true },
      { id: "cB", hex: "#bbbbbb", name: "Colour B", inLegend: true },
      { id: "cC", hex: "#cccccc", name: "Colour C", inLegend: false },
    ],
    slots: [
      { id: "s1", start: "08:00", duration: 45 },
      { id: "s2", start: "09:00", duration: 45 },
      { id: "s3", start: "10:00", duration: 45 },
      { id: "s4", start: "11:00", duration: 45 },
      { id: "s5", start: "12:00", duration: 45 },
    ],
    days: [
      { id: "mon", name: "Poniedziałek", nameShort: "Pn", weekday: 1 },
      { id: "tue", name: "Wtorek", nameShort: "Wt", weekday: 2 },
    ],
    teachers: [
      { id: "t1", name: "Teacher One" },
      { id: "t2", name: "multiple", anonymous: true },
    ],
    lessonTypes: [
      { id: "full", name: "Full Name", colorId: "cA" },
      { id: "abbr", name: "Abbreviated", nameShort: "Abbr", colorId: "cA" },
      { id: "plainC", name: "Plain C", colorId: "cC" },
    ],
    lessons: {
      mon: {
        s2: { lessonId: "abbr", teacherId: "t1" },
        s4: { lessonId: "plainC", teacherId: "t2" },
      },
      tue: {
        s2: { lessonId: "full", teacherId: "t1" },
      },
    },
  };
}

function assertFilled(
  cell: PlanCell,
): asserts cell is Extract<PlanCell, { empty: false }> {
  assert.equal(cell.empty, false, "expected a filled cell, got the free slot");
}

describe("buildPlan — cells", () => {
  it("resolves name, teacher and hex from the referenced rows", () => {
    const plan = buildPlan(makePlan());
    const cell = plan.rows[0].cells[0]; // mon / s2 → abbr / t1
    assertFilled(cell);
    assert.equal(cell.name, "Abbreviated");
    assert.equal(cell.nameShort, "Abbr");
    assert.equal(cell.teacher, "Teacher One");
    assert.equal(cell.hex, "#aaaaaa");
  });

  it("falls back to the full name when a lesson type has no nameShort", () => {
    const cell = buildPlan(makePlan()).rows[0].cells[1]; // tue / s2 → full
    assertFilled(cell);
    assert.equal(cell.nameShort, "Full Name");
  });

  it("blanks the teacher name for an anonymous record", () => {
    const cell = buildPlan(makePlan()).rows[2].cells[0]; // mon / s4 → t2
    assertFilled(cell);
    assert.equal(cell.teacher, "");
  });

  it("renders a slot with no lesson as an empty cell", () => {
    const cell = buildPlan(makePlan()).rows[2].cells[1]; // tue / s4 → none
    assert.equal(cell.empty, true);
  });

  it("renders an ignored lesson as an empty cell", () => {
    const data = makePlan();
    data.lessons.mon.s2.ignored = true;
    const cell = buildPlan(data).rows[0].cells[0];
    assert.equal(cell.empty, true);
  });
});

describe("buildPlan — rows and span", () => {
  it("spans first to last used slot, trimming the empty ends", () => {
    const rows = buildPlan(makePlan()).rows;
    // s1 and s5 are unused at the ends; the span is s2, s3, s4.
    assert.equal(rows.length, 3);
    assert.equal(rows[0].range, "09:00 - 09:45");
    assert.equal(rows[2].range, "11:00 - 11:45");
  });

  it("keeps an unused slot that falls inside the span as an empty row", () => {
    const rows = buildPlan(makePlan()).rows; // s3 is used by nobody
    assert.ok(
      rows[1].cells.every((cell) => cell.empty),
      "the interior unused slot should be a row of free cells",
    );
  });

  it("writes the break text from the gap, and none on the last row", () => {
    const rows = buildPlan(makePlan()).rows;
    assert.equal(rows[0].breakText, "+15min przerwy");
    assert.equal(rows[2].breakText, "");
  });

  it("returns no rows when no slot is used", () => {
    const data = makePlan();
    data.lessons = { mon: {}, tue: {} };
    const plan = buildPlan(data);
    assert.equal(plan.rows.length, 0);
    assert.equal(plan.legend.length, 0);
  });
});

describe("buildPlan — legend", () => {
  it("keeps palette order and only colours a lesson carries and the legend shows", () => {
    const legend = buildPlan(makePlan()).legend;
    // cA is shown and used; cB is shown but unused; cC is used but hidden.
    assert.deepEqual(
      legend.map((color) => color.id),
      ["cA"],
    );
  });
});

describe("buildPlan — validation throws on a broken reference", () => {
  const cases: [string, (data: LessonsPlan) => void, RegExp][] = [
    [
      "lessons filed under an unknown day",
      (data) => {
        data.lessons.sat = {};
      },
      /unknown day "sat"/,
    ],
    [
      "an unknown slot id under a day",
      (data) => {
        data.lessons.mon.s99 = { lessonId: "full", teacherId: "t1" };
      },
      /unknown slotId "s99"/,
    ],
    [
      "a day with no lessons entry at all",
      (data) => {
        delete (data.lessons as Record<string, unknown>).tue;
      },
      /No lessons filed for day "tue"/,
    ],
    [
      "an unknown lesson id",
      (data) => {
        data.lessons.mon.s2.lessonId = "ghost";
      },
      /unknown lessonId "ghost"/,
    ],
    [
      "an unknown teacher id",
      (data) => {
        data.lessons.mon.s2.teacherId = "t999";
      },
      /unknown teacherId "t999"/,
    ],
    [
      "an unknown colour id on a lesson type",
      (data) => {
        data.lessonTypes[0].colorId = "noColour";
      },
      /unknown colorId "noColour"/,
    ],
  ];

  for (const [name, breakIt, message] of cases) {
    it(name, () => {
      const data = makePlan();
      breakIt(data);
      assert.throws(() => buildPlan(data), message);
    });
  }
});
