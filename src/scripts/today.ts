/**
 * Today, applied at runtime — the one module allowed to read the clock. The
 * site is built once a term, so a baked-in weekday would be wrong by morning:
 * the build emits an unmarked week on purpose, and with JavaScript off the page
 * shows Monday unmarked — a correct plan, not a broken one. Paper never gets
 * here; `print.css` takes the mark back off.
 *
 * Hooks (`.js-day-tab`, `.js-day-tabs` from `DayTabs.astro`, `.js-day-head`
 * from `GridHead.astro`) are untyped links: drop one and the mark silently
 * stops appearing. The marks it *writes* (`tab--today`, `dayhead--today`) go
 * the other way — CSS reads them, so they stay BEM modifiers.
 */

/** The tabs, in week order — the index both functions below count against. */
function dayTabs(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(".js-day-tab"));
}

/**
 * Which column is today, or -1 when none is: Saturday and Sunday have no
 * column, and the plan stays on Monday, unmarked.
 */
export function findTodayIndex(): number {
  /* getDay() is 0 for Sunday; the data uses ISO weekdays, 1 = Monday. */
  const isoWeekday = new Date().getDay() || 7;
  return dayTabs().findIndex(
    (tab) => Number(tab.dataset.weekday) === isoWeekday,
  );
}

/**
 * Marks today's tab and day header. A no-op on a weekend, so the caller can
 * pass `findTodayIndex()` straight through without testing it first.
 */
export function markToday(index: number): void {
  if (index < 0) return;

  const tab = dayTabs()[index];
  if (!tab) return;

  tab.classList.add("tab--today");

  /* The suffix is copy, so it rides a data attribute rather than being written here. */
  const todayAria =
    document.querySelector<HTMLElement>(".js-day-tabs")?.dataset.todayAria;
  if (todayAria) {
    tab.setAttribute(
      "aria-label",
      `${tab.getAttribute("aria-label")} (${todayAria})`,
    );
  }

  const dayHeads = document.querySelectorAll<HTMLElement>(".js-day-head");
  dayHeads[index]?.classList.add("dayhead--today");
}
