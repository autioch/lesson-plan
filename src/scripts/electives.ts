/**
 * The electives toggle in the legend — the one control that reveals the extra
 * activities. Off by default: they are shown on demand, so the page loads
 * reading like any other week and lights the pools up only when asked.
 *
 * The whole state is one class on `.js-plan` (`plan--electives`); CSS owns the
 * reveal off it, this module only flips it and keeps every toggle's
 * `aria-pressed` in step — there are two, the sidebar legend and the sheet, and
 * either drives the same class.
 *
 * Hooks `.js-plan` and `.js-electives-toggle` are untyped links: the toggle is
 * absent for a year with no electives, so a missing button is a valid no-op,
 * not a broken wire.
 */
export function initElectives(): void {
  const plan = document.querySelector<HTMLElement>(".js-plan");
  const toggles = document.querySelectorAll<HTMLElement>(
    ".js-electives-toggle",
  );
  if (!plan || toggles.length === 0) return;

  const setShown = (shown: boolean) => {
    plan.classList.toggle("plan--electives", shown);
    for (const toggle of toggles) {
      toggle.setAttribute("aria-pressed", String(shown));
    }
  };

  for (const toggle of toggles) {
    toggle.addEventListener("click", () =>
      setShown(!plan.classList.contains("plan--electives")),
    );
  }
}
