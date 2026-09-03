/**
 * Picking a day — the only interaction the design allows, and it exists only
 * on a phone in portrait (≤480px). Every wider band shows the whole week and
 * has nothing to switch, which is why the tabs are hidden there rather than
 * disabled here: this module stays width-agnostic apart from the swipe.
 *
 * The selected day lives in exactly one place, `data-day` on the page root.
 * CSS does the rest — all five days stay laid out and each is offset by
 * `(its day − the current day) × 100%` — so nothing here knows that changing
 * the day animates anything at all.
 */

/** Horizontal travel, in px, before a pointer gesture counts as a swipe. */
const SWIPE_MIN = 36;

/**
 * Applies the starting day and wires the two ways it can change. Called before
 * motion is armed, so the starting day lands rather than sliding in.
 */
export function initDaySelect(initialIndex: number): void {
  const plan = document.querySelector<HTMLElement>(".plan");
  const grid = document.querySelector<HTMLElement>(".grid");
  const tabs = Array.from(document.querySelectorAll<HTMLElement>(".tab"));
  const lastDayIndex = tabs.length - 1;

  /** Out-of-range is ignored, which is what stops swipe wrapping Friday to Monday. */
  function selectDay(index: number) {
    if (!plan || index < 0 || index > lastDayIndex) return;
    plan.dataset.day = String(index);
    tabs.forEach((tab, i) =>
      tab.setAttribute("aria-selected", String(i === index)),
    );
  }

  function currentDay(): number {
    return Number(plan?.dataset.day ?? 0);
  }

  selectDay(initialIndex);

  tabs.forEach((tab, index) =>
    tab.addEventListener("click", () => selectDay(index)),
  );

  /* Swipe exists only where a day is selectable at all. The media query is
   * checked at gesture time, not here, so a rotation needs no re-wiring. */
  const phonePortrait = window.matchMedia("(max-width: 480px)");
  let swipeStartX: number | null = null;

  grid?.addEventListener("pointerdown", (event) => {
    swipeStartX = phonePortrait.matches ? event.clientX : null;
  });
  grid?.addEventListener("pointerup", (event) => {
    if (swipeStartX === null || !phonePortrait.matches) return;
    const dx = event.clientX - swipeStartX;
    swipeStartX = null;
    if (Math.abs(dx) < SWIPE_MIN) return;
    selectDay(currentDay() + (dx < 0 ? 1 : -1));
  });
}
