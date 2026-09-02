# Owner tasks

Manual steps only the repo owner can do. Delete a line once it's done.

- **Confirm the informatics group for 1b.** The 2026 plan splits the class: group 1 has `inf` on
  Monday 14:05 and `ew` on Friday 08:15, group 2 has them the other way round. `2026.json` assumes
  **group 1**. If it is group 2, swap those two cells — Monday 14:05 becomes empty (`{}`) and Friday
  08:15 becomes `10_inf` with `t6`.
- **Print the plan for real.** The print sheet was verified by applying the print stylesheet in a
  browser at A4-landscape pixel size, not by an actual print or PDF export. Open `/`, print to
  PDF in Chrome with "Background graphics" on, and confirm one page, colours intact, legend at the
  bottom.
- **Check the plan on a real phone.** The three bands were verified with browser viewport emulation.
  A physical phone confirms the touch targets, the swipe, and that the day fits without scrolling
  under the browser's own chrome.
- **Provide `GITHUB_PAT` for the GitHub MCP server.** [.mcp.json](../.mcp.json) points at
  `https://api.githubcopilot.com/mcp/` and reads the token from that environment variable. Without
  it the server fails to connect and PR work falls back to the `gh` CLI. Scope it to this
  repository; it only needs to read and write pull requests.
- **Decide on the Astro upgrade.** `npm audit` reports 13 advisories against `astro@5.13.5`. Almost
  all are server-side (SSR, middleware, server islands, image endpoint) and cannot apply to a static
  GitHub Pages build with no server — but two hit the **dev server** on your own machine: arbitrary
  local file read and a reflected XSS on its error page. The fix is a major upgrade (5 → 7), which
  is its own unit of work, not an `npm audit fix`.
