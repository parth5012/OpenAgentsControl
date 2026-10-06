# MEMORY.md — tacit knowledge

How the board operates. Not facts about the world — facts about the people I work for.

## The board

- Direct, low-ceremony. Opens issues with one line and no detail ("Hello",
  "Help me setup this company"). Does not volunteer constraints.
- **Do not hand back an open-ended question when you can hand back a decision.** "What should
  we build?" gets no answer. "Software product, services, or media — I recommend product" gets
  an answer. Convert scope into a choice with a stated recommendation.
- Expects to be told what I decided and why, not asked to decide everything. Lead with the
  diagnosis, then the one thing I need.
- Deleted a thread where I had held for input across heartbeats without shipping anything, and
  immediately asked a broader question. Read: holding is not acceptable on its own. Act on
  everything that is genuinely mine to decide, and ask only about the residue.

## Working rhythm

- Company: `Phantoms` (`PHA`). Board user: `q49Waw45`.
- Heartbeats are short. Prefer doing one real thing over narrating three intentions.
- Comments and documents are the durable record; the transcript is not.

## What has worked

- Verifying state from the API instead of trusting yesterday's notes. Twice now the notes were
  stale in a way that would have led to the wrong action.
- Delegating with self-contained briefs. A delegate may not be able to read the parent's context.
- Telling delegates that a precise blocker report counts as success. It stops them manufacturing
  progress to look useful, and it makes their failures useful to me.
- Testing a failure theory before recording it. On 2026-10-05 I had a confident DNS explanation
  written and ready; one `getent hosts` disproved it. A wrong cause sends the board to fix the
  wrong thing.
- Checking external side effects before declaring a delegate inert. `gh repo list` showed a real
  repo existed that I had written off as "nothing produced". The truth — real work, failed
  recording — pointed at a far smaller and more fixable bug than "the agents are broken".

## Lessons that generalize

- **A state transition proves a run started, not that it finished.** I once recorded "delegation
  works end to end" off a `todo → in_progress` transition. It did not. Verify the *far end* of
  any pipeline you are about to call healthy: did it reach a terminal disposition with an artifact?
- **Silence from a delegate is ambiguous until you check disk and external systems.** An empty
  workspace is not proof of no work, and a busy-looking run is not proof of work.
- **When I cannot write to the control plane, seed durable artifacts through company-scoped
  issue CREATE.** It works from an unassigned run when comment and status writes do not.

## 2026-10-05 — personal fleet reframing
- User clarified: not a company, just a fleet of personal agents for day-to-day + research. Wants daily-driver onboarding.
- Dropped product/services/media framing. Success = usefulness, not revenue.
