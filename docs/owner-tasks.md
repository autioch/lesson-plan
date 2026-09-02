# Owner tasks

Manual steps only the repo owner can do. Delete a line once it's done.

- **Confirm the informatics group for 1b.** The 2026 plan splits the class: group 1 has `inf` on
  Monday 14:05 and `ew` on Friday 08:15, group 2 has them the other way round. `2026.json` assumes
  **group 1**. If it is group 2, swap those two entries — delete `lessons.mon.s8`, and change
  `lessons.fri.s2` to `{ "lessonId": "it", "teacherId": "t13" }`.
- **Re-print the plan.** The sheet is no longer a separate markup tree — it is the screen's own DOM
  with paper overrides, so every printed pixel moved even though the design did not. Verified by
  forcing the `@media print` rules on in a browser at A4-landscape pixel size (the method is in
  [styling.md](standards/styling.md#commands)): 297 × 210mm exactly, one page, eleven rows, no
  clipped cell, legend on one line, no "DZIŚ" on any weekday. **Not verified by an actual print** —
  that check has never been run on this plan, and it is the only one that covers `@page` margins and
  how the printer renders the six lesson colours. Open `/`, print to PDF in Chrome with "Background
  graphics" on, and confirm. If Chrome's margin setting is anything but zero, say so — the sheet is
  built for `@page { margin: 0 }` and reserves 24pt of its own for the printer's dead strip.
- **Check the plan on a real phone.** The three bands were verified with browser viewport emulation.
  A physical phone confirms the touch targets, the swipe, and that the day fits without scrolling
  under the browser's own chrome — now 11 rows at ~78px rather than 7 at ~120px.
- **Provide `GITHUB_PAT` for the GitHub MCP server.** [.mcp.json](../.mcp.json) points at
  `https://api.githubcopilot.com/mcp/` and reads the token from that environment variable. Without
  it the server fails to connect and PR work falls back to the `gh` CLI. Scope it to this
  repository; it only needs to read and write pull requests.
- **Decide on the Astro upgrade.** `npm audit` reports 13 advisories against `astro@5.13.5`. Almost
  all are server-side (SSR, middleware, server islands, image endpoint) and cannot apply to a static
  GitHub Pages build with no server — but two hit the **dev server** on your own machine: arbitrary
  local file read and a reflected XSS on its error page. The fix is a major upgrade (5 → 7), which
  is its own unit of work, not an `npm audit fix`.
