/**
 * The legend sheet on bands A and B — the "?" button and what it opens. From
 * 1024px the legend is a fixed sidebar and this pair is hidden.
 *
 * Open state lives in one place, the sheet's `hidden` attribute; this module
 * sets it and knows nothing about animation. CSS drives the slide off that
 * attribute, so without `allow-discrete`/`@starting-style` the sheet still
 * opens, just in one frame.
 *
 * Hooks `.js-legend-button` and `.js-legend-sheet` (from `LegendSheet.astro`)
 * are untyped links: drop one and the button silently stops working.
 */
export function initLegendSheet(): void {
  const button = document.querySelector<HTMLElement>(".js-legend-button");
  const sheet = document.querySelector<HTMLElement>(".js-legend-sheet");
  if (!button || !sheet) return;

  /* An arrow after the guard, not a hoisted function: hoisting would put it
   * before the null check and TypeScript would widen both back. */
  const setOpen = (open: boolean) => {
    sheet.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
  };

  button.addEventListener("click", () => setOpen(sheet.hidden));
  /* Anywhere on the sheet closes it, panel included — the hint says so. */
  sheet.addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
}
