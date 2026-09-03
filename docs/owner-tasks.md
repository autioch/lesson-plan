# Owner tasks

Manual steps only the repo owner can do. Delete a line once it's done.

- **Confirm the informatics group for 1b.** The 2026 plan splits the class: group 1 has `inf` on
  Monday 14:05 and `ew` on Friday 08:15, group 2 has them the other way round. `2026.json` assumes
  **group 1**. If it is group 2, swap those two entries — delete `lessons.mon.s8`, and change
  `lessons.fri.s2` to `{ "lessonId": "it", "teacherId": "t13" }`.
- **Print the plan on paper, not to PDF.** The layout is confirmed: a print to PDF showed the
  unified sheet correct — one page, legend across the bottom, no "DZIŚ". What that PDF **cannot**
  show is the palette, which changed afterwards: the six lesson colours are now 50% white tints, and
  a wash that reads calm on a screen is the first thing a tired school printer loses. Print one on
  the machine the sheet will actually come off, with "Background graphics" on, and confirm the tiles
  are still visible as tiles from across a room. If they wash out, the fix is one number — the mix
  level in [styling.md](standards/styling.md#visual-conventions) — not six hand-picked hexes.
- **Check the plan on a real phone.** The three bands were verified with browser viewport emulation.
  A physical phone confirms the touch targets, the swipe, and that the day fits without scrolling
  under the browser's own chrome — now 11 rows at ~78px rather than 7 at ~120px.
- **Provide `GITHUB_PAT` for the GitHub MCP server.** [.mcp.json](../.mcp.json) points at
  `https://api.githubcopilot.com/mcp/` and reads the token from that environment variable. Without
  it the server fails to connect and PR work falls back to the `gh` CLI. Scope it to this
  repository; it only needs to read and write pull requests.
- **Normalize the main checkout's line endings once.** `D:\repos\lesson-plan` still holds files
  checked out as CRLF from before [.gitattributes](../.gitattributes) existed; only this worktree was
  refreshed. Nothing is broken — `git status` reads clean either way — but the working copy does not
  yet match the LF the file now promises. On a **clean** tree, run
  `git rm --cached -r . && git reset --hard`. It commits nothing; it only rewrites on-disk endings.
- **Decide on the Astro upgrade.** `npm audit` reports 13 advisories against `astro@5.13.5`. Almost
  all are server-side (SSR, middleware, server islands, image endpoint) and cannot apply to a static
  GitHub Pages build with no server — but two hit the **dev server** on your own machine: arbitrary
  local file read and a reflected XSS on its error page. The fix is a major upgrade (5 → 7), which
  is its own unit of work, not an `npm audit fix`.
