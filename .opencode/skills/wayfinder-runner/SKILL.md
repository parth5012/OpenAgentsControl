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


| Type        | Mode        | Strategy                                           |
| ----------- | ----------- | -------------------------------------------------- |
| `research`  | AFK         | spawn research agent                               |
| `task`      | AFK or HITL | AFK → spawn coder agent; HITL → Phase 1 with human |
| `prototype` | HITL        | Phase 1 with human                                 |
| `grilling`  | HITL        | Phase 1 with human                                 |


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
│    AFK tickets: research, task(AFK)         │
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
gh issue comment <N> --body "<resolution — human's decision>"
gh issue close <N> --reason completed
```

Append to map's `## Decisions so far`:

```
- [<ticket name>](link) — <one-line resolution>
```

#### 3d. Recompute frontier

Closing a HITL ticket may unblocked new tickets. Re-run Step 2. If new HITL tickets appeared, process them too (loop within Phase 1).

**Phase 1 ends when no HITL tickets remain in the frontier.**

Notify human:

```
PHASE 1 COMPLETE — All HITL tickets resolved.
[[ORCA_RICH_MD:d7de0244b3d30ba326774f4e6de0f508:inline-html:%3CN%3E]] AFK tickets remain. Handing off to autonomous agents.
You're free to leave. Phase 2 will run to completion.
```

### Step 4 — Phase 2: AFK (autonomous)

Now all remaining frontier tickets are AFK. No human needed.

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
gh issue comment <N> --body "<resolution summary from agent>"
gh issue close <N> --reason completed
```

Append to map's `## Decisions so far`:

```
- [<ticket name>](link) — <one-line resolution summary>
```

#### 4e. Create commits

```
git add .
git commit -m "{message}"
```


#### 4f. Recompute frontier

After closing, new tickets may be unblocked. Since Phase 2 only runs AFK tickets, and all frontier tickets at this point are AFK, loop back to Step 4a for each new AFK ticket.

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
[[ORCA_RICH_MD:d7de0244b3d30ba326774f4e6de0f508:block-html:%3Cfiles%20changed%20per%20ticket%3E]]

All clear — no remaining tickets.
```

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

## Invocation

```
/wayfinder-runner <map-number-or-url>
```

With no argument, list open wayfinder maps:

```bash
gh issue list --label "wayfinder:map" --state open --json number,title
```

Then ask which to run.