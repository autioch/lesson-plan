/**
 * Today, applied at runtime — the one module allowed to read the clock.
 *
 * The site is built once a term, so a weekday baked into the HTML would be
 * wrong the next morning: `src/utils/` may never call `new Date()`, and the
 * build emits an unmarked week on purpose. The marks are added here or not at
 * all, which is why a page with JavaScript off shows Monday unmarked — a
 * correct plan, not a broken one.
 *
 * Paper never gets here: `print.css` takes the mark back off, because a sheet
 * that hangs all term would be wrong by Tuesday.
 *
 * The `.tab` and `.dayhead` selectors belong to `DayTabs.astro` and
 * `GridHead.astro`. Nothing imports them across that line, so a class rename
 * there goes unnoticed until the mark stops appearing.
 */

/** The tabs, in week order — the same list both functions below count against. */
function dayTabs(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(".tab"));
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

  /* The suffix is copy, so it comes from the data via a data attribute on the
   * tablist rather than being written here. */
  const todayAria =
    document.querySelector<HTMLElement>(".tabs")?.dataset.todayAria;
  if (todayAria) {
    tab.setAttribute(
      "aria-label",
      `${tab.getAttribute("aria-label")} (${todayAria})`,
    );
  }

  const dayHeads = document.querySelectorAll<HTMLElement>(".dayhead");
  dayHeads[index]?.classList.add("dayhead--today");
}
