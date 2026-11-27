---
name: wayfinder-runner
description: "Auto-run wayfinder map tickets end-to-end. Phase 1: HITL tickets (prototype/grilling) are processed with the human present. Phase 2: AFK tickets run autonomously while human is free. Human leaves after Phase 1; agents finish the rest."
---
# Wayfinder Runner

A two-phase agentic loop that drives a wayfinder map to completion. **HITL work happens first** while you're present. **AFK work runs autonomously** after you leave.

## When to use

- A wayfinder map exists and you want to resolve all tickets in one session
- You want to handle all human-decision tickets up front, then let agents run unattended
- You want code-reviewed deliverables per ticket

## Ticket types recap (from wayfinder)


| Type              | Mode        | Strategy                                           |
| ----------------- | ----------- | -------------------------------------------------- |
| `research`        | AFK         | spawn research agent                               |
| `grilling`        | HITL        | Phase 1 with human                                 |
| `prototype`       | HITL        | Phase 1 with human; opt-in only                    |
| `blackbox-test`   | AFK         | spawn agent to generate black-box tests            |
| `task`            | AFK or HITL | AFK → spawn coder agent; HITL → Phase 1 with human |
| `implementation`  | AFK         | spawn coder agent to build the feature             |
| `verification`    | AFK         | spawn agent to find ways to verify the feature     |
| `council-review`  | AFK         | convene named council; loops internally all rounds |
| `proof`           | AFK         | spawn agent to produce HTML/image/video evidence   |
| `refactor`        | AFK         | spawn coder agent; no behaviour change             |

`prototype` is never created by default; it appears only when explicitly requested. Delivery tickets (`blackbox-test`, `verification`, `proof`, `implementation`, `council-review`, `refactor`) may produce artifacts under `docs/wayfinder/<map>/<ticket>/` and list them in their resolution.


## Two-phase workflow

```
WAYFINDER RUNNER — TWO PHASE
=============================

input: <map issue number or URL>

┌─────────────────────────────────────────────┐
│ 1. LOAD MAP                                 │
│    - gh issue view the map                  │
│    - extract: Destination, Notes,           │
│      Decisions-so-far, label wayfinder:map  │
│    - list child tickets                     │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ 2. COMPUTE FRONTIER                         │
│    - find open, unblocked, unclaimed        │
│    - topo-sort by dependency                │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ 3. PHASE 1 — HITL (human present)          │
│    for each HITL ticket in frontier:        │
│      claim → collaborate with human →       │
│      record resolution → close → recompute  │
│                                             │
│    HITL tickets: prototype, grilling,       │
│    task(HITL)                               │
│                                             │
│    Human resolves these interactively.      │
│    Agent assists (research, grilling,       │
│    prototype) but does NOT decide.          │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
          ┌───────────────┐
          │ Human leaves? │
          │ AFK tickets   │
          │ remain?       │
          └───────┬───────┘
           YES    │    NO (all done)
                  ▼
┌─────────────────────────────────────────────┐
│ 4. PHASE 2 — AFK (autonomous)               │
│    for each AFK ticket in frontier:         │
│      claim → dispatch agent →               │
│      review code (if changed) →             │
│      record resolution → close → recompute  │
│                                             │
│    AFK: research, task, + 6 delivery types  │
│    >=5 code-changing AFK → stacked PRs      │
│    (git/gh: 1 branch+PR per ticket,         │
│    babysit each sub-PR bottom-up)           │
│                                             │
│    No human needed. Runs to completion.     │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ 5. REPORT                                   │
│    - HITL resolved (Phase 1)                │
│    - AFK resolved (Phase 2)                 │
│    - remaining blocked tickets (if any)     │
└─────────────────────────────────────────────┘
```

## Detailed steps

### Step 1 — Load the map

```bash
gh issue view <MAP_NUMBER> --json number,title,body,labels
```

The map body contains:

- `## Destination` — orient every action against this
- `## Notes` — skills to consult
- `## Decisions so far` — closed tickets (context for new work)

List child tickets:

```bash
gh issue list --repo <owner>/<repo> --state open --search "parent:<MAP_NUMBER>" --json number,title,labels,assignees,body
```

If the tracker doesn't support parent queries, grep child issue links from the map body.

### Step 2 — Compute the frontier

For each open child ticket:

1. Read full body
2. Check blocking edges
3. A ticket is in the frontier if:
  - state = open
  - all tickets blocking it are closed
  - assignee is null (unclaimed)

Topo-sort: tickets with no unresolved blockers first.

### Step 3 — Phase 1: HITL (human present)

Classify each frontier ticket:

- `wayfinder:research` → AFK (skip, Phase 2)
- `wayfinder:blackbox-test` → AFK (skip, Phase 2)
- `wayfinder:implementation` → AFK (skip, Phase 2)
- `wayfinder:verification` → AFK (skip, Phase 2)
- `wayfinder:council-review` → AFK (skip, Phase 2)
- `wayfinder:proof` → AFK (skip, Phase 2)
- `wayfinder:refactor` → AFK (skip, Phase 2)
- `wayfinder:task` + AFK marker → AFK (skip, Phase 2)
- `wayfinder:prototype` → HITL (process now)
- `wayfinder:grilling` → HITL (process now)
- `wayfinder:task` + HITL marker → HITL (process now)

For each HITL ticket in order:

#### 3a. Claim

```bash
gh issue edit <N> --add-assignee @me
```

#### 3b. Collaborate with human

The agent assists — it does **not** replace the human's judgment.

**For grilling tickets** — run a `/grilling` session:

- Agent asks one question at a time
- Human responds freely
- Agent synthesizes the decision
- Resolution = the human's decision, recorded by agent

**For prototype tickets** — run a `/prototype` session:

- Agent builds a rough artifact to react to
- Human gives feedback
- Iterate until human approves
- Resolution = human-approved direction

**For HITL task tickets** — agent does the mechanical work, human judges the outcome:

- Agent executes (signs up, provisions, moves data)
- Agent reports facts to human
- Human confirms resolution

#### 3c. Record resolution

```bash
gh issue comment <N> --body "<## Answer with the full resolution — human's decision>"
```

Append the **full answer verbatim** to the map's `## Decisions so far`:

```
### [<ticket name>](link)

<full answer from the ## Answer comment>
```

Only after the write-back is in place, close the ticket:

```bash
gh issue close <N> --reason completed
```

Never write a one-line gist. The map is the durable record.

#### 3d. Recompute frontier

Closing a HITL ticket may unblocked new tickets. Re-run Step 2. If new HITL tickets appeared, process them too (loop within Phase 1).

**Phase 1 ends when no HITL tickets remain in the frontier.**

Notify human:

```
PHASE 1 COMPLETE — All HITL tickets resolved.
[[ORCA_RICH_MD:d7de0244b3d30ba326774f4e6de0f508:inline-html:%3CN%3E]] AFK tickets remain. Handing off to autonomous agents.
You're free to leave. Phase 2 will run to completion. and continue working  do not stop here.Just notify the user once.
```

### Step 4 — Phase 2: AFK (autonomous)

Now all remaining frontier tickets are AFK. No human needed.

**First, decide Single-PR vs Stacked-PR mode:**

```bash
gh issue list --search "parent:<MAP_NUMBER>" --state open --json number | jq length
```

- Count open AFK tickets. Exclude no-code types from the stack count: `research`, `verification`, `council-review`, and `proof` only record resolutions or produce artifacts under `docs/wayfinder/`. Code-changing AFK types are `implementation`, `refactor`, `blackbox-test`, and AFK `task`.
- **< 5 code-changing AFK tickets → Single-PR mode** (existing flow: implement, commit per ticket on one branch, one PR at the end via `file-pr`).
- **>= 5 code-changing AFK tickets → Stacked-PR mode** (Section 4g below: one branch + one PR per ticket, stacked with `git`/`gh`, babysit each sub-PR).

#### 4a. Claim

```bash
gh issue edit <N> --add-assignee @me
```

#### 4b. Dispatch agent

Build a task prompt from the ticket body. Include:

- The ticket's `## Question` section
- Relevant `## Decisions so-far` from the map
- The map's `## Notes` for skills to consult

**For research tickets:**

```
Task(
  description="Resolve wayfinder research ticket: [[ORCA_RICH_MD:d7de0244b3d30ba326774f4e6de0f508:inline-html:%3Cname%3E]]",
  subagent_type="general",
  prompt="You are resolving wayfinder ticket: [[ORCA_RICH_MD:d7de0244b3d30ba326774f4e6de0f508:inline-html:%3Cticket%20name%3E]]
Link: [[ORCA_RICH_MD:d7de0244b3d30ba326774f4e6de0f508:inline-html:%3Curl%3E]]

## Question
[[ORCA_RICH_MD:d7de0244b3d30ba326774f4e6de0f508:block-html:%3Cticket%20body%3E]]

## Context from map
[[ORCA_RICH_MD:d7de0244b3d30ba326774f4e6de0f508:block-html:%3Crelevant%20decisions%20%2B%20destination%3E]]

## Notes
[[ORCA_RICH_MD:d7de0244b3d30ba326774f4e6de0f508:block-html:%3Cmap%20notes%3E]]

Investigate and resolve this research question. Report findings
as a resolution comment on the issue. Do NOT close the ticket."
)
```

**For task tickets:**

```
Task(
  description="Resolve wayfinder task ticket: <name>",
  subagent_type="general",
  prompt="You are resolving wayfinder task ticket: <ticket name>
Link: <url>

## Question
<ticket body>

## Context from map
<relevant decisions + destination>

## Notes
<map notes>

Implement the work described. Make minimal, focused changes.
Report what you did as a resolution comment. Do NOT close the ticket."
)
```

**For the six delivery types**, use the same prompt shape with the ticket type named and this instruction swapped in:

- `blackbox-test` → "Generate black-box tests for the feature. Write them under `docs/wayfinder/<map>/<ticket>/` and link them in your `## Answer`."
- `verification` → "Find concrete ways to verify the required feature is implemented. Record the checks and their results in your `## Answer`."
- `proof` → "Produce HTML artifacts, images, or videos as evidence. Write them under `docs/wayfinder/<map>/<ticket>/` and link them in your `## Answer`."
- `implementation` → "Build the feature itself. Make minimal, focused changes. Do NOT close the ticket."
- `council-review` → "Convene the council members listed in the ticket's `council:` field (standing six if empty), all in parallel. Loop internally through as many rounds as needed and record every round's verdict in your `## Answer`."
- `refactor` → "Restructure the code with no behaviour change. Make minimal, focused changes. Do NOT close the ticket."

#### 4c. Review gate

After the agent returns, check if any source files were modified (`git status`). If yes:

```
Task(
  description="Review code from ticket: <name>",
  subagent_type="CodeReviewer",
  prompt="Review the changes made for wayfinder ticket: <ticket name>

Ticket: <url>
Map: <map url>

## Ticket question
<ticket body>

## Map destination
<destination>

Diff to review:
!`git diff HEAD`

Check for correctness, security, and project conventions.
Post findings as a comment on the ticket if issues found,
or report clean."
)
```

#### 4d. Record resolution

```bash
gh issue comment <N> --body "<## Answer with the full resolution from the agent>"
```

Append the **full answer verbatim** to the map's `## Decisions so far`:

```
### [<ticket name>](link)

<full answer from the ## Answer comment>
```

Only after the write-back is in place, close the ticket:

```bash
gh issue close <N> --reason completed
```

Never write a one-line gist. The map is the durable record.

#### 4e. Create commits for each AFK Ticket (Single-PR mode, < 5 tickets)

```
git add .
git commit -m "{message}"
```

Single branch accumulates all AFK commits. At the end of Phase 2, file one PR via `file-pr` (`/file-pr` skill: push branch, `gh pr create --base main --head <branch>`).


#### 4f. Recompute frontier

After closing, new tickets may be unblocked. Since Phase 2 only runs AFK tickets, and all frontier tickets at this point are AFK, loop back to Step 4a for each new AFK ticket.

> **Re-check the threshold on every recompute:** if newly unblocked tickets push the remaining AFK count to >= 5, switch to Stacked-PR mode (4g) for the rest of the run. Do not collapse an already-started stack back to single-PR.

#### 4g. Stacked-PR mode (AFK >= 5 code-changing tickets)

Use plain `git` + `gh` branch stacking — no external stacking tool. One branch + one PR per ticket, each child's base = its parent branch, in topo order.

**Setup:**

```bash
git fetch origin main
git checkout -b wf/<MAP_NUMBER>-<TICKET_N>-<slug> origin/main   # bottom of stack
```

Branch naming: `wf/<MAP_NUMBER>-<TICKET_N>-<short-slug>` (e.g. `wf/123-124-auth-middleware`).

**Per ticket (in topo-sorted frontier order):**

1. **Branch:** `git checkout -b wf/<MAP>-<N>-<slug> <parent-branch>` (first ticket's parent = `origin/main`, each next ticket's parent = previous ticket's branch). Implement only that ticket's scope. Minimal changes.
2. **Review gate:** run 4c (CodeReviewer) on that ticket's diff only (`git diff <parent-branch>...HEAD`).
3. **Commit + push:** `git add -A; git commit -m "<ticket name> (#<N>)"`; `git push -u origin <branch>`.
4. **File sub-PR:** follow the `file-pr` skill, but base = parent branch, not main:
   ```bash
   gh pr create --base <parent-branch> --head <branch> --title "<ticket name> (#<N>)" --body "Closes #<N>. Part of stack for map #<MAP_NUMBER> (<i>/<total>). Parent: #<parent-PR>. Child: <next or none>."
   ```
   Never open a duplicate PR for a branch that already has one — refresh via `gh pr edit` instead.
5. **Record resolution** (4d): write the full `## Answer` to the ticket, append it verbatim to the map's `## Decisions so far` under a `### [<ticket name>](link)` heading, include the sub-PR URL in both the ticket close comment and the map entry, then close the ticket.
6. **Next ticket:** `git checkout -b` next branch off the branch just pushed (stack grows). Repeat.

**Babysit each sub-PR (bottom-up):**

- After the full stack is filed (or incrementally per sub-PR), run the `babysit-pr` skill on **each** sub-PR starting from the **bottom** of the stack:
  ```
  /babysit-pr <sub-PR-number>
  ```
- Per sub-PR: poll `gh pr checks`, keep rebased on parent (`git rebase <parent-branch>`, push `--force-with-lease`, then `git rebase` descendants onto the updated branch), apply only concrete reviewer-provided fixes, never merge, never resolve/dismiss threads, never freelance red-CI fixes — per `babysit-pr` rules.
- Restack rule: whenever a parent branch moves (rebase/fix), immediately rebase each descendant (`git checkout <child>; git rebase <parent>; git push --force-with-lease`) before babysitting the next one up.
- On hard fail / complex conflict (> 3 files, test/lock/CI files, unclear intent): abort that rebase (`git rebase --abort`), STOP that leg, report files + both-side changes on the sub-PR and its ticket, continue babysitting independent legs if any.
- Do not merge mid-stack. Merging is bottom-up via `merge-pr` (or left to the human) only after the sub-PR below is merged and the child's base is retargeted to the merged parent's base.

**When NOT to stack:** < 5 code-changing AFK tickets, tickets with overlapping/conflicting scope (serialize instead), or no remote / `gh` unauthenticated (STOP and report per `file-pr` rules).

### Step 5 — Final report

```
WAYFINDER RUN — COMPLETE
========================

Phase 1 — HITL resolved ([[ORCA_RICH_MD:d7de0244b3d30ba326774f4e6de0f508:inline-html:%3CN%3E]]):
• [[[ORCA_RICH_MD:d7de0244b3d30ba326774f4e6de0f508:inline-html:%3Cticket-1%3E]]](link) — [[ORCA_RICH_MD:d7de0244b3d30ba326774f4e6de0f508:inline-html:%3Cone-line%20resolution%3E]]
• [[[ORCA_RICH_MD:d7de0244b3d30ba326774f4e6de0f508:inline-html:%3Cticket-2%3E]]](link) — [[ORCA_RICH_MD:d7de0244b3d30ba326774f4e6de0f508:inline-html:%3Cone-line%20resolution%3E]]

Phase 2 — AFK resolved ([[ORCA_RICH_MD:d7de0244b3d30ba326774f4e6de0f508:inline-html:%3CM%3E]]):
• [[[ORCA_RICH_MD:d7de0244b3d30ba326774f4e6de0f508:inline-html:%3Cticket-3%3E]]](link) — [[ORCA_RICH_MD:d7de0244b3d30ba326774f4e6de0f508:inline-html:%3Cone-line%20resolution%3E]]
• [[[ORCA_RICH_MD:d7de0244b3d30ba326774f4e6de0f508:inline-html:%3Cticket-4%3E]]](link) — [[ORCA_RICH_MD:d7de0244b3d30ba326774f4e6de0f508:inline-html:%3Cone-line%20resolution%3E]]

Code changes:
<files changed per ticket>

Stacked PRs (only if 4g used, >= 5 AFK tickets):
| # | Sub-PR | Ticket | Base → Head | Checks | Review fixes |
|---|--------|--------|-------------|--------|--------------|
| 1/<total> | #<pr> (link) | [<ticket>](link) | `<parent>` → `<branch>` | passed/failed/pending | <applied/parks> |

All clear — no remaining tickets.
```
- In stacked mode, report each sub-PR with its babysit outcome per `babysit-pr` report format, state explicitly nothing was merged unless `merge-pr` ran, and note restacks performed.

## Important rules

1. **HITL first, AFK second** — never start Phase 2 while HITL tickets remain in the frontier.
2. **Human decides in Phase 1** — agent assists but never replaces the human's judgment on HITL tickets.
3. **One ticket per agent dispatch** — never batch multiple tickets into one agent call.
4. **Claim before work** — always assign to self before dispatching.
5. **Recompute frontier after every close** — closing a ticket can unblock many others.
6. **Refer to tickets by name** — never bare `#42`; always `[<ticket name>](link)`.
7. **Minimal changes** — implement exactly what the ticket asks, nothing more.
8. **Review only if code changed** — pure research tickets skip the review gate.
9. **Human can leave after Phase 1** — Phase 2 is fully autonomous.
10. **AFK >= 5 code-changing tickets → stacked PRs with git/gh** — one branch + one PR per ticket (base = parent branch), filed per `file-pr`, each sub-PR babysat bottom-up per `babysit-pr`, merges bottom-up per `merge-pr` or left to human. Re-check the count on every frontier recompute.
11. **Never merge from babysit** — `babysit-pr` never merges; landing is only via `merge-pr` or manual human merge.

## Invocation

```
/wayfinder-runner <map-number-or-url>
```

With no argument, list open wayfinder maps:

```bash
gh issue list --label "wayfinder:map" --state open --json number,title
```

Then ask which to run.