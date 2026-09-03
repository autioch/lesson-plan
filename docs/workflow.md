# Workflow — the paths

The paths the [routing table](../CLAUDE.md#what-to-do-when) sends you down. Nothing here is invoked;
it's what you do. Each path names its steps, its stopping points, and what it leaves behind.

**One rule spans all of them: when two paths fit, take the heavier one.** A change escalates
mid-flight; it doesn't balloon in place. Escalating is cheap — you keep the work and add the missing
steps. Discovering at close-out that a "small fix" reshaped a data model is not.

## Investigate

For an unproven idea, before any spec. **No app code.** The output is a **verdict**, delivered in
chat.

1. **Name the uncertainty** in one or two lines — the single question this answers. If you can't
   state it, the idea doesn't need investigating; it needs a spec.
2. **Check three axes, and stop as soon as one is decisive:**
   - **Product sense** — is this worth building? Comparable products, real user value, simpler
     alternatives that get most of the benefit.
   - **Experience** — how it must behave on the product's real surface and input modes.
   - **Technical viability** — does it work on this stack **and** the platform floor? Name specific
     support gaps; cite what you consulted.
3. **Lay out the options with trade-offs** and mark your recommendation.
4. **Give the verdict**: viable · viable with changes · not viable · needs more investigation.

**A recorded "no" is the point, not a failure.** Say why plainly and stop. Don't investigate your way
to a yes, and don't over-investigate — name what's still uncertain as an open question for the spec.

## Direct

A trivial durable-doc, rule, or config edit — a handful of lines carrying **no real judgment**.

1. Confirm it's genuinely trivial. **The moment it touches app code, adds behavior, or carries a
   judgment worth recording, switch to [Bounded](#bounded).** When in doubt, it's Bounded.
2. Make the edit, honoring the doc bar. If it changes a rule, sync any doc that restates it.
3. Gate green → commit straight to `main` → push.
4. One line back: what changed + the commit.

No branch, no record beyond the commit.

## Fix

A bug. **Test-first, and the red run is the point.**

1. **Reproduce it with a test and run it red.** Confirm it fails _for the right reason_ — this is the
   regression that would have caught the bug. A fix that lands with a test that never failed proves
   nothing.
2. Fix until green.
3. **Both land in the same commit** — the tree never lands red.
4. Then the [Bounded](#bounded) close-out, or the [Feature](#feature) one if the fix turned out to be
   structural.

## Bounded

One well-bounded change touching a layer or two. **Default small visual work here.**

1. **Ground narrowly** — only the docs and source this change touches. Don't re-explore the repo.
2. **Pin the edges.** Ask only the blocking questions: exact behavior, placement, scope edges.
   Propose defaults grounded in the docs; skip what the request already answers. **If the answers
   reveal a new data model, several modules, or open product questions, stop and switch to
   [Feature](#feature).**
3. **Branch, state the approach, build.** Cut a branch from `main`. Tell the user the approach + the
   files you'll touch in a couple of lines — no plan document. Then make the change exactly as
   scoped, to the coding conventions and the platform floor. Verify any uncertain stack API against
   its real docs rather than guessing. Commit freely with plain git.
4. **Verify** per [qa.md](standards/qa.md): the gate (+ build if compilation could be affected); the
   rendered-look drive **with proof** for anything user-visible; the dead-code pass last. Apply
   test-by-scope; flag anything the environment can't run.
5. **Close out** — see [Close-out](#close-out).

## Feature

A real feature: a new data model or contract, several modules, or open product questions.

### 1 · Agree the spec

The contract — _what_ and _why_, settled **before any code**. Elicit it: target user and problem,
exact behavior, in and out of scope, data-model changes, UI placement, platform constraints, i18n,
and **testable acceptance criteria**. Batch related questions; propose defaults grounded in the docs.

**Smallest coherent slice that delivers value** — enhancements go to "out of scope", explicitly.
**Converge before recording**: play the spec back and iterate until you agree, then write it down.
This is the one artifact worth a file — `docs/_active-plan.md` — because the build reads it back
across sessions.

### 2 · Plan it

Turn the agreed spec into **ordered, independently committable steps**, appended to the same file.
Default **bottom-up** so the tree is never broken: data/types → data layer → state → UI → wiring →
validation. Each step carries a **Goal**, a **Read** list (name files, not "the docs"), a **Change**
(paths + concrete edits), and a **Done-check** (the exact gate from [qa.md](standards/qa.md)).

If anything blocks an unambiguous step, ask now and **record the resolution back into the spec** —
never silently assume. When the spec introduces new auth or security guarantees, threat-model the
spec's _own_ guarantees here, before sequencing: a design flaw is a blocking gap, not something to
plan around.

### 3 · Build

Cut the branch and **record the base ref** — the review pass reads the whole feature diff from there.
Then per step: read → change exactly what the step names, nothing extra → satisfy its Done-check →
sync the docs it touches → commit (plain git, no push). **The commit is the step's done-record** — no
tick marks in the plan file; `git log` is the source of truth for what's done.

Stop and ask rather than invent a product decision. Record the resolution, then continue.

### 4 · Review, then reconcile

The [review pass](#the-review-pass) over the feature diff, then:

**Reconcile the diff against the spec, both ways.** Spec → code: every acceptance criterion is built;
name where each lives. Code → spec: nothing in the diff is outside scope — no silently-added
behavior, option, or file the contract doesn't call for. On any divergence, **do not close out**:
fix to match the spec, or if the spec is what's wrong, ask, record, reconcile again.

### 5 · Close out

See [Close-out](#close-out), plus: run a **repo-wide doc reconcile** (the backstop for whatever the
per-commit syncs missed), and **delete `docs/_active-plan.md`** — the durable record is the git
history.

## The review pass

Not a persona exercise — a set of **lenses you re-read the diff through**, one at a time, because a
single read finds one class of problem. Where the session has dedicated review tooling, use it here;
where it doesn't, do the passes by hand.

Run it over the whole diff since the base ref, as a bounded **review → fix → re-review loop**, capped
at **two loops** — file residual findings rather than chasing them.

| Lens               | Looks for                                                                                                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scope**          | What shipped vs. what was agreed; unmet acceptance criteria; user actions with a missing outcome (dead-end, stale selection, no-op)                                    |
| **Security**       | Authn/authz, secrets, input handling, what an unauthorized actor reaches — **mandatory, not skippable, when the diff touches auth, an API route, or the access rules** |
| **Correctness**    | Logic errors, edge cases, error paths, the round-trip actually round-tripping                                                                                          |
| **Simplification** | Duplication, an abstraction earlier than its second use, mechanism more elaborate than the contract needs                                                              |
| **Experience**     | The real surface and input modes; focus order; reachable targets; no dead ends                                                                                         |
| **Coverage**       | Tests for what can silently break; which checks are still owed                                                                                                         |
| **Operations**     | Cleanup, cascade deletes, anything unbounded; cost and quotas; production guards holding                                                                               |

Rules that make it useful: **problems only** — a clean lens gets one "none", never a credit note.
**Every finding traces to a `file:line`.** And when asked to review, **flag; don't fix** unless the
user asked for fixes.

## Sync

Docs drifted, or code just changed.

1. **The code is the authority.** Audit each durable doc in scope against the actual current code,
   using the [doc-sync map](standards/development.md#keeping-docs-in-sync) to pick which. List every
   contradiction.
2. **Fix the drift and enforce the doc bar** — pointer-first, current-state, short. Fix what's wrong
   or stale, not what's merely arrangeable. Check each doc against its context budget; compress or
   flag overruns.
3. **If the doc is right and the code is the bug, flag it** — don't rewrite the doc to match a bug,
   and don't invent a product change to "fix" a doc. That's a [Bounded](#bounded) change.
4. Commit. If nothing drifted, say so and commit nothing.

## Close-out

The same ending for Bounded and Feature:

1. **Gate green.** Stage the change **and every durable doc it affects**.
2. **The commit message is the record.** There is no archive file — `git log` and the PR are the
   history. So write the message to be read later: what and why, the headline decision (took X over
   Y) when one was made, and any owed check.
3. **Owner-owed manual steps** — a key or account to provide, an env var to set in a hosting UI, a
   live check only they can run — go in `docs/owner-tasks.md`. It's their queue, not yours.
4. **Push, open a lean PR, merge on green.** See [Committing](#committing).
5. **One line back**: the PR or commit, the gate result, and anything still owed. No summary.

## Committing

- **Branch per unit of work**, cut from `main` before the first commit of a Bounded or Feature path.
  Direct and Sync commit straight to `main`.
- **During work, plain git, no push.** Commit freely; never leave the tree broken. Nothing formats
  for you — run `npm run fix` (or the full `npm run verify`) yourself.
- **Close-out: push once**, open a **lean PR** (the diff-scoped review surface + audit trail, not a
  report), wait for **green CI**, merge, return to trunk.
- **Squash is the only merge method**, and the branch is deleted on merge — both enforced by repo
  settings, so there is no button to pick wrong. The squash commit takes the **PR title and body**
  verbatim: write them as the history entry you want, because that is what lands on `main`.
- **Green CI is the approval step** — nothing prompts on merge, so waiting is the whole check. Watch
  it with `gh pr checks <n> --watch`, then `gh pr merge <n> --squash --delete-branch`. **`--auto`
  does not gate you**: the ruleset bypass below leaves nothing blocking the PR, so auto-merge finds
  it already mergeable and lands it immediately rather than queuing behind CI.
- **Direct and Sync push with the explicit `git push origin main`**, never a bare `git push` — that
  push fires the Pages deploy on the school's live plan, and naming the ref is how you confirm you
  meant `main` and not whatever happens to be checked out.
- **Red CI → fix-forward on the same branch.** A flake → re-run it; a real failure → fix the cause
  and re-push. The work isn't closed until the green merge, so a CI failure never reopens anything.
- **You are the gate locally** — there are no git hooks. Run `npm run verify` yourself before you
  push; CI re-runs it on the PR and on `main` as the authority.
- **`main` carries a ruleset**: the CI check is required, deletion and force-push are blocked. The
  repo admin bypasses all three, which is what keeps the Direct and Sync paths able to push straight
  to `main` — CI only runs on pull requests, so a gated push would never clear.
- Conventional Commits subjects.

## Handing off

Long sessions fill the context window and degrade. At a **clean boundary** — a close-out, or between
steps — when context is saturating or the user asks, **stop there rather than pushing on degraded**.
Durable state is already persisted (git + `docs/_active-plan.md`), so a handoff loses nothing.

Emit a **ready-to-paste next-session prompt** — the prompt itself, not advice to restart. Three
pointer blocks: **Mandate** (the task + the rules it resumes under), **State** (branch, last commit
or open PR, the plan file, what's mid-flight), **Next** (1–3 candidates, each with a one-line why).
Pointers, not prose — and **don't save it to a file**; state changes every handoff, so a saved copy
only rots.
