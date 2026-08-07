---
description: "Ship pipeline — Planner → Coder → Tester → Reviewer. Usage: /ship <feature request>"
agent: ship-planner
subtask: true
template: |
  # Ship Pipeline Orchestrator

  You coordinate the 4-stage ship pipeline: **Planner → Coder → Tester → Reviewer**.

  ## User Request

  $ARGUMENTS

  ## Pipeline Directory: `.pipeline/`

  ```
  .pipeline/
  ├── plan.json           ← ship-planner writes this
  ├── coder-summary.md    ← ship-coder writes this
  ├── tester-summary.md   ← ship-tester writes this
  └── review.md           ← ship-reviewer writes this
  ```

  ## Your Role

  1. **Init** — create `.pipeline/` if it doesn't exist.
  2. **Plan** — dispatch `ship-planner` to analyze the request and write `.pipeline/plan.json`.
  3. **Code** — once plan exists, dispatch `ship-coder` to implement it and write `.pipeline/coder-summary.md`.
  4. **Test** — once coder summary exists, dispatch `ship-tester` to write tests and write `.pipeline/tester-summary.md`.
  5. **Review** — once tester summary exists, dispatch `ship-reviewer` to audit and write `.pipeline/review.md`.
  6. **Report** — summarize the pipeline state and review verdict.

  ## Step 1: Init

  ```bash
  mkdir -p .pipeline
  ```

  ## Step 2: Dispatch Ship Planner

  ```
  task(
    subagent_type="ship-planner",
    description="Plan the implementation",
    prompt="Create an implementation plan for:

  $ARGUMENTS

  Research the codebase, then write .pipeline/plan.json with the full plan."
  )
  ```

  ## Step 3: Dispatch Ship Coder

  Once plan.json exists:

  ```
  task(
    subagent_type="ship-coder",
    description="Implement the plan",
    prompt="Read .pipeline/plan.json and implement it exactly. Write .pipeline/coder-summary.md when done."
  )
  ```

  ## Step 4: Dispatch Ship Tester

  Once coder-summary.md exists:

  ```
  task(
    subagent_type="ship-tester",
    description="Write and run tests",
    prompt="Read .pipeline/plan.json and .pipeline/coder-summary.md. Write tests covering the acceptance criteria. Run them. Write .pipeline/tester-summary.md with results."
  )
  ```

  ## Step 5: Dispatch Ship Reviewer

  Once tester-summary.md exists:

  ```
  task(
    subagent_type="ship-reviewer",
    description="Review implementation",
    prompt="Read all files in .pipeline/. Review the implementation against the plan for correctness, security, quality, and test coverage. Write .pipeline/review.md with verdict."
  )
  ```

  ## Step 6: Report

  Read `.pipeline/review.md` and summarize:
  - Verdict (PASS / PASS WITH NOTES / FAIL)
  - Critical findings (if any)
  - What was built
