# Owner tasks

Manual steps only the repo owner can do. Delete a line once it's done.

- **Print the plan for real.** The print sheet was verified by applying the print stylesheet in a
  browser at A4-landscape pixel size, not by an actual print or PDF export. Open `/`, print to
  PDF in Chrome with "Background graphics" on, and confirm one page, colours intact, legend at the
  bottom.
- **Check the plan on a real phone.** The three bands were verified with browser viewport emulation.
  A physical phone confirms the touch targets, the swipe, and that the day fits without scrolling
  under the browser's own chrome.
- **Decide on the Astro upgrade.** `npm audit` reports 13 advisories against `astro@5.13.5`. Almost
  all are server-side (SSR, middleware, server islands, image endpoint) and cannot apply to a static
  GitHub Pages build with no server — but two hit the **dev server** on your own machine: arbitrary
  local file read and a reflected XSS on its error page. The fix is a major upgrade (5 → 7), which
  is its own unit of work, not an `npm audit fix`.
