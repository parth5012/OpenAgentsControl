# Improvement session prompt (agent-hill-climb loop)

Copy this verbatim as the task brief for each hill-climb session. Replace `<project>` and `<deficiency>` if known.

---
You are running one `agent-hill-climb` improvement session on `<project>`.

GROUND RULES (non-negotiable):
- One deficiency this session. Write it and the target metric down BEFORE any code change.
- Every claim of improvement requires a row in scorecard.csv backed by real `verify` output, never by your narration.
- `ratchet.json`, CI workflows, and test corpora are frozen during work cycles. No weakening of lint/type severity, no deleting/skipping/tautologizing tests.
- Deterministic gates decide; LLM judgement may only suggest. If a number cannot be computed, the deficiency is "instrument this metric" — score 0 and treat it as top priority.

CYCLE:
1. SETUP: branch `loop/<id>`; run verify on tip; read scorecard.csv tail + LEARNINGS.md (cold re-entry).
2. RED: make the deficiency observable in a failing deterministic check.
3. GREEN: implement the minimum change; full verify passes.
4. SCORE: append before/after row (metric, counts, verify-hash, files).
5. RATCHET: metric improved? — commit `loop(N): <deficiency> | <metric> a→b`. Else — revert code, keep the row marked `reverted`, log why in LEARNINGS.md.
6. SHIFT-LEFT: convert this cycle's expensive lesson into a cheap perpetual gate (lint rule, guard test, new ratchet count) in a follow-up commit.
7. WRAP-UP (unconditional): LOG.md entry with status + verification evidence + scorecard trajectory; end with the single recommended first action for the next session.

Do not touch anything outside the repo no matter what. If a fix requires external side effects, stop and surface for human approval.
---
