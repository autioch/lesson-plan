# Owner tasks

Manual steps only the repo owner can do. Delete a line once it's done.

- **Print the plan for real.** The print sheet was verified by applying the print stylesheet in a
  browser at A4-landscape pixel size, not by an actual print or PDF export. Open `/`, print to
  PDF in Chrome with "Background graphics" on, and confirm one page, colours intact, legend at the
  bottom.
- **Check the plan on a real phone.** The three bands were verified with browser viewport emulation.
  A physical phone confirms the touch targets, the swipe, and that the day fits without scrolling
  under the browser's own chrome.
- **Decide on adding `@astrojs/check` to the gate.** `npm run build` does not typecheck, so a type
  error in `.astro` frontmatter ships. Adding `@astrojs/check` + `typescript` as devDependencies and
  running `astro check && astro build` closes it, at the cost of two dependencies and a slower CI.
