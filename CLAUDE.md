# CLAUDE.md — Agent Instructions for Lesson Plan

Always-loaded. It tells you **what to do when, and what to read first** — there is nothing to invoke;
match the request to a row in the routing table below and follow that path.

## What this is

**Lesson Plan** — a school lesson scheduling and planning tool for managing classes and teachers.
Stack: **Astro · TypeScript · JSON**.
**Status — in development; used by school staff.** Every change ships to a production standard.

## Working style

- Short, concise, direct. Cut filler; don't sugar-coat.
- **Vet every request against industry standards, security, and common sense; push back hard when it
  fails.** This is a school tool managing real schedules and staff assignments — it's the job, not a
  courtesy. When a request is wrong, unsafe, or has a clearly better option, **lead with the
  objection, the evidence, and the better option, then wait**. "Don't build this" is a valid outcome.
  Bluntness must be earned by evidence, not opinion. If it passes, proceed.
- **Decide vs. ask — by reversibility × blast radius.** Don't stop on every unknown. **Reversible,
  low-blast** (naming, layout, a local refactor): pick the sensible default, act, note it. **Always
  ask** when it's **irreversible or high-blast** — data/schema migration, auth or security, deleting
  or overwriting user data, anything that **publishes or can't be retracted** (a merge to `main`, a
  deploy, a release, a send), or money. Pushing a feature branch and opening a PR are recoverable and
  don't need asking. A recurring ask becomes a codified default or an automated check, not a standing
  prompt.
- **Trust these instructions.** When a detail is missing, search **narrowly** for that one thing —
  don't re-explore the repo. The "Read first" column is the whole reading list for a path.
- **Ask with options.** When you do stop, offer multiple choice with your recommendation first, and
  record the answer where the work lives — not only in chat.
- After git actions, report the result in **one line** — no summaries or next-step suggestions
  unless asked.
- **Durable rules live in the repo, not memory.** A convention that must hold across sessions belongs
  in tracked markdown, never only in agent memory.

## What to do when

Match the request to the **first row that fits**, then follow that path in
[workflow.md](docs/workflow.md). When two rows fit, **take the heavier one** — a change escalates
mid-flight, it doesn't balloon in place.

| The request is…                                                                                      | Path                                                                                                                        | Read first                                                                                                           |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **A question** — "how does X work", "where is Y"                                                     | Answer it. No branch, no commit.                                                                                            | only the files in question                                                                                           |
| **An unproven idea** — "can we…", "would it work if…", anything with a real feasibility doubt        | [**Investigate**](docs/workflow.md#investigate) — de-risk, give a verdict, **don't build**. "No" is a win.                  | whatever the question needs; `docs/domain/` for product sense                                                        |
| **A trivial edit** — wording, a config value, a pointer fix; no code, no judgment                    | [**Direct**](docs/workflow.md#direct) — edit → gate → commit to `main`                                                      | just the file                                                                                                        |
| **A bug**                                                                                            | [**Fix**](docs/workflow.md#fix) — reproduce with a failing test **run red**, then fix, same commit                          | [qa.md](docs/standards/qa.md#tests-are-part-of-the-change) + the code at fault                                       |
| **A new school year** — turning the school's PDF into the published plan                             | [**Bounded**](docs/workflow.md#bounded), following the written procedure step for step                                      | [importing-a-plan.md](docs/importing-a-plan.md)                                                                      |
| **A bounded change** — one behavior, a layer or two: a copy/style edit, a small fix, a config change | [**Bounded**](docs/workflow.md#bounded) — pin the edges → branch → build → verify → close out                               | [development.md](docs/standards/development.md) + the source it touches                                              |
| **A real feature** — new data model, several modules, or open product questions                      | [**Feature**](docs/workflow.md#feature) — agree a spec → ordered plan → build step by step → review → reconcile → close out | [architecture.md](docs/standards/architecture.md) + [development.md](docs/standards/development.md) + `docs/domain/` |
| **"Review this" / "is this safe"**                                                                   | [**Review pass**](docs/workflow.md#the-review-pass) — findings only; don't fix unless asked                                 | [security.md](docs/standards/security.md) + [qa.md](docs/standards/qa.md)                                            |
| **Docs drifted**, or you just changed code                                                           | [**Sync**](docs/workflow.md#sync) — the doc-sync map decides which docs                                                     | [development.md § keeping docs in sync](docs/standards/development.md#keeping-docs-in-sync)                          |

**Two reads are conditional, on every path:** touch anything visual →
[styling.md](docs/standards/styling.md); touch auth, an API route, or the access rules →
[security.md](docs/standards/security.md).

**Before you verify anything, read [qa.md](docs/standards/qa.md).** It is the testing source of
truth — the confidence tiers, the operational stages, test-by-scope, and the masking traps that make
a check pass without exercising anything.

## Always, whatever the path

- **The gate is green before every commit** — `npm run verify` (types, lint, knip, format, build).
  There are no git hooks: nothing runs it for you. Never leave the tree broken.
- **Docs ship with the change.** Code or config changes update the affected prose in the **same
  commit** — never a tree where docs contradict code. Which docs: the
  [doc-sync map](docs/standards/development.md#keeping-docs-in-sync).
- **Claims trace to evidence.** A green gate alone is not "verified". Say what you ran and what it
  showed; say plainly what is still owed. **Flag it owed, never fake it.**
- **Docs you author obey the doc bar** — short, blunt, **pointer-first**: state the **current**
  behavior (never a speculative future), and **link the doc that owns a rule instead of restating
  it**. A pointer names _where_, not _why_. Loaded docs are paid context: this file stays **≤ 175
  lines** and stays a router; each standards doc stays **≤ 350**.
- **Production quality is the floor**, not "good enough for now". Modern desktop browsers are the
  binding baseline for UI work.

## Commands

The gate is `npm run verify` — `fix` (eslint + prettier), then `ci` (`astro check`, eslint, knip,
prettier check), then `build`. No git hooks run it for you; CI runs `ci` + `build` on every PR and
again on `main`. Dev server: `npm run dev`. Full table:
[development.md](docs/standards/development.md#full-command-reference).

## Git

**One branch per unit of work**, cut from `main` before the first commit of a **Bounded** or
**Feature** path; **Direct** and **Sync** commit straight to `main`. Commit often with plain git,
push once at close-out, open a lean PR, merge on green CI. Mechanics:
[workflow.md § Committing](docs/workflow.md#committing).

**Nothing prompts.** `.claude/settings.json` allows `Bash`, `PowerShell`, the browser preview tools
and the GitHub MCP server wholesale, with an empty `ask` list — deploying, merging and releasing
included. This is a static frontend with no secrets, every commit is on GitHub, and the site rebuilds
from the tree, so anything shipped wrong is a revert away. **The gate, the PR and the commit message
are the whole safety story** — there is no dialog behind them. Run `npm run verify` before every
commit and wait for green CI before every merge; a prompt will not stop you.

## Environment

No secrets, no runtime config. The plan data is committed JSON under `src/data/plans/` — the
published output is a static build, so a bad data edit is caught by the gate and the visual check,
not by a runtime guard.

- **`GITHUB_PAT`** — the only environment variable, read by `.mcp.json` for the GitHub MCP server.
  Not needed to build or run the site.

## Gotchas

- **Shell: run git and npm through the Bash tool, not PowerShell.** PowerShell 5.1 wraps a native
  command's stderr as error records and reports false failures — `astro check`, `eslint`, and `git`
  all write to stderr on success. Use PowerShell only for genuinely Windows-specific needs
  (`$env:VAR`, `$null`).
- **Run a destructive git command as its own call.** `git reset --hard`, a force-push or a rebase
  chained behind `&&` scrolls past in a combined result — and nothing prompts, so a bad one is only
  caught by reading what it printed.
- **The gate is manual.** There are no git hooks in this repo — nothing runs `npm run verify` for
  you before a commit or a push. Run it yourself; CI is the backstop, not the first check.
