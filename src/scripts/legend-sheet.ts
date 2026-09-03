/**
 * The legend sheet on bands A and B — the "?" button and what it opens. From
 * 1024px the legend is a fixed sidebar instead and this pair is hidden, so
 * these listeners are wired but never reachable.
 *
 * Open state lives in exactly one place, the sheet's `hidden` attribute. This
 * module sets it and knows nothing about animation: CSS drives the slide off
 * that attribute via `allow-discrete` and `@starting-style`, so where neither
 * is supported the sheet still opens, just in one frame.
 *
 * The two ids come from `src/components/LegendSheet.astro`. Nothing imports
 * them across that line — rename one there and the button stops working with
 * no error anywhere.
 */
export function initLegendSheet(): void {
  const button = document.getElementById("legendButton");
  const sheet = document.getElementById("legendSheet");
  if (!button || !sheet) return;

  /* An arrow declared after the guard, not a hoisted function: hoisting would
   * put it before the null check and TypeScript would widen both back. */
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
