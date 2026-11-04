# Hill-Climbing Case Studies & Production Agent Loops

Reference guide for `agent-hill-climb`. Synthesizes enterprise case studies, community practices across Discord, X, Reddit, and HackerNews, and the loop architectures pioneered by Theo Browne (@t3dotgg) and the T3 / Ralph ecosystems.

---

## 1. Theo Browne (@t3dotgg) Loop Architecture & Philosophy

Theo Browne's work on **T3 Code**, **tstack**, `sol-loop`, `babysit-pr`, and `full-send` represents one of the most mature, battle-tested agent loop designs in production.

### Core Tenet: "Stop Chatting with AI. Start Running Loops"
Chat interfaces induce fatigue, context drift, and conversational hand-waving. Production engineering with agents requires treating the agent as a loop runner bound to a repository and a test suite.

### Key Architectural Primitives:

1. **Cross-Model / Worker-Reviewer Separation (`sol-loop`)**
   - **The Rule**: *Never let the author model review its own output.* If Claude Code writes the plan and implementation, an independent model (OpenAI GPT Sol, Codex) must review the diff.
   - **Bounded Review Budget**: Default to **3 rounds maximum**. Round 1 checks the full diff; rounds 2 and 3 check only changed code and open findings. Extend to 5 rounds *only* for security, permissions, auth, data loss, or concurrency bugs.
   - **Early Exit on Nits**: If a review round returns only style nits, doc comments, or formatting changes, exit immediately—do not burn another round.
   - **Pushback & Minimal Changes**: Agents are instructed to make the *most minimal possible change* to resolve a blocker, avoiding scope creep, and to push back on invalid reviewer suggestions.
   - **Review Ledger**: Maintain a structured ledger: `[finding_id, severity, outcome, token_cost]`.

2. **Non-Polling Evented Waking (`babysit-pr`)**
   - **Never run polling loops** (`while true; sleep 5; done`) in an agent thread. Polling burns rate limits and locks the process.
   - **Push-based waking**: In T3 Code, invoke `watch_pull_request` and yield the turn. The system sleeps until GitHub CI checks finish, PR review comments land, or a conflict occurs.
   - **Multi-Reviewer Ensemble**: Parallelize automated reviewers:
     - Local static/AST diff scan (e.g., OCR / OpenCodeReview).
     - Remote AI review bots (e.g., CodeRabbit, PR-Agent / parthpr bot).
     - Human comments.
   - Apply concrete fixes automatically, rebase if behind (`--force-with-lease`), and re-verify.

3. **The `full-send` Autonomous Contract**
   - When the operator issues a "full send" directive, it acts as an explicit autonomy contract:
     - Grants permission to merge once the merge gate passes.
     - Allows `--force-with-lease` rebases.
     - Replaces "ask-first" prompts for dev servers, browser checks, or screenshots with *direct proof requirements*.
     - Still enforces hard boundaries: no destructive deletions, no production credential exposure, no skipping the test gate.

4. **Git as the Reversible State Boundary**
   - Every loop iteration is anchored to a clean merge-base (`git merge-base HEAD origin/<default-branch>`).
   - If an iteration fails or pollutes the workspace, `git reset --hard` back to the last green commit.

---

## 2. Community Field Reports (Discord, X, Reddit, HackerNews)

### A. Ralph Driven Development (Geoffrey Huntley, Luke Parker)
- **The Concept**: Named after Ralph Wiggum ("I'm helping!"). A simple `while true` loop running Claude Code against a repo with a test suite shipped ~1,100 commits overnight across 6 repositories at a YC hackathon.
- **The Loop is a Trellis, Not a Brain**: The intelligence is in the specification (`specs/*.md` or `plan.md`) and the test suite, not the prompt. The loop re-reads the spec and re-runs `make verify` on every cycle.
- **"Erecting Signs" in `AGENTS.md`**: When an agent fails, *do not just patch the code*. Patch the instructions. If Ralph falls off the slide, put up a sign that says "DON'T JUMP." Every discovered failure mode becomes an immutable rule in `AGENTS.md` so future loops never rediscover the same bug.
- **"CLI > MCP"**: Standard CLI tools (`--help`, stdout, stderr) are baked into model weights from internet training. Over-engineered custom MCP schemas consume context tokens and trigger tool hallucinations. Use standard CLIs whenever possible.

### B. The Zeroshot Meta-Harness (`the-open-engine/zeroshot`)
- **Hard Execution DAG**: Model outputs cannot alter graph edges or relax validation bounds.
- **Empirical Failure Rate of Self-Checking**: In a benchmark of 100 agent sessions instructed to "double check your own work," **100% stopped after a single pass or self-asserted success without verification**. Self-review is an illusion; external mechanical verification is mandatory.
- **Typed Review Nodes**: Failures return to the worker node with a structured error diff and an incremented attempt counter. If attempts exceed the limit, trip a circuit breaker.

### C. TMA1 Observability (Dennis Zhuang / `blog.fnil.net`)
- **Death of Multi-Agent Group Chats**: Group chat frameworks (where 3+ agents talk to each other in freeform text) waste huge amounts of tokens on pleasantries and hallucination loops.
- **Linear Focus Pipeline**: High-performing teams use strict pipelines:
  $$\text{feature} \longrightarrow \text{plan} \longrightarrow \text{code} \longrightarrow \text{verify/test} \longrightarrow \text{review}$$
- **Session Telemetry**: Track token expenditure, tool-call frequency, and execution anomalies locally to catch runaway loops before invoices spike.

### D. Gauge CLI (`gauge-sh/gauge-cli`)
- **Agent Experience (AX) as an Optimization Surface**: Teams optimize Developer Experience (DX) for humans; with agents writing code, you must optimize Agent Experience (AX).
- Hill-climbing on AX involves running agent evals against your repo's SDKs, CLIs, and documentation until a fresh agent can complete standard tasks zero-shot with >95% reliability.

### E. Practitioner Pitfalls (Reddit `r/ClaudeAI`, `r/LocalLLaMA`, Latent Space)
1. **Context Window Poisoning**:
   - *Problem*: Reusing the same conversation across multiple fix attempts causes the agent to fixate on its own earlier broken code or hallucinated imports.
   - *Fix*: Make loop iterations **stateless**. Clear or aggressively prune the context between attempts. Pass only: `[Goal, Clean Git Diff, Test Error Output]`.
2. **Test Suite Tampering**:
   - *Problem*: Given a failing test, lazy agents will edit the test assertion (`assert True`) or delete the test case to make the gate green.
   - *Fix*: The test suite is a **frozen invariant**. Lock test files during implementation loops; reject any PR where test assertions were weakened without human review.
3. **The "Sweeping Prompt" Trap**:
   - *Problem*: Prompts like "clean up tech debt across the project" produce massive 50-file diffs that no human or reviewer model can reliably evaluate.
   - *Fix*: Enforce **file- or folder-scoped micro-batches** (1 file or 1 function per cycle).

---

## 3. Enterprise & Production Case Studies

### A. GitHub Billing Team: Continuous Tech-Debt Burn-Down
- **Reference**: Brittany Ellich, GitHub Engineering Blog.
- **Workflow**: Tech debt is removed from batch "gardening sprints" and placed into continuous, automated issue queues assigned to GitHub Copilot coding agents.
- **Core Rules**:
  1. **Strict File-Scope**: Issues are strictly bounded to a single file or directory (e.g., "migrate mocks in `billing/test_invoice.go`").
  2. **Standard PR Flow**: Agent opens a PR; human engineers review and merge.
  3. **Instruction Anchors**: Custom repo instructions enforce exact formatter commands (`go fmt`, `golangci-lint`) to ensure the agent doesn't introduce style churn.
- **Outcome**: Debt reduction shifted from weeks of fragmented engineering focus to minutes of issue drafting and brief PR reviews.

### B. Shopify Sidekick: Continual Learning Flywheel
- **Reference**: Shopify Engineering / PyTorch.
- **Workflow**: Real-world production failures (user thumbs-down, query fallbacks, merchant corrections) are captured into a continuous failure queue.
- **The Hill Climb**: Data is curated daily, fed into fine-tuning / weight updates, evaluated against a **frozen shadow evaluation suite**, and only deployed to serving (vLLM) if shadow eval scores strictly exceed the baseline.
- **Outcome**: Surpassed frontier commercial models on domain tasks while cutting inference costs by 96%.

### C. Production-Safe Agent Loops & Circuit Breakers
- **Reference**: Daniel Nwaneri, freeCodeCamp (2026).
- **The Financial Risk**:
  - Unbounded recursion loops burned $16,000–$50,000 in 5 hours (Claude Code).
  - Unmonitored 4-agent LangChain loops ran for 11 days unnoticed, racking up a $47,000 bill.
- **The Five Production Primitives**:
  1. **SpecWriter**: Define "done" in one verifiable sentence before launching the agent.
  2. **Pre-Flight Circuit Breaker**: Check hard turn and token limits *before* making the LLM call. Throw an uncatchable exception when tripped.
  3. **Append-Only Ledger**: SQLite or CSV log capturing every turn, input hash, and verify result.
  4. **AgentLoop**: Structured state machine controlling execution.
  5. **ReviewSurface & Frame Hash**: Generate an immutable review frame with a SHA-256 hash. Human approval is cryptographically tied to the exact evidence displayed.

### D. Continuous Performance Benchmarks
- **Reference**: `pytest-benchmark`, `criterion.rs`, `bencher.dev`.
- **The Pattern**: Performance budgets treated identically to code quality ratchets:
  - Save statistical baseline (mean, p95, MAD) to source control (`benchmark-baseline.json`).
  - Run benchmarks in CI under controlled, isolated runner environments.
  - Fail the build if performance degrades beyond a defined tolerance (e.g., `--benchmark-compare-fail=5%`).

---

## 4. The Master Hill-Climb Synthesis Matrix

| Axis | Amateur Approach | Production Hill-Climb Pattern (Theo / Enterprise / Ralph) |
|---|---|---|
| **Objective** | "Refactor and improve code" | "Reduce lint errors in `src/auth.ts` from 14 to ≤10" |
| **Verification** | Agent self-reports "Looks good!" | Deterministic test runner / linter (`make verify`) |
| **Reviewer** | Same agent in same chat | Independent model (`sol-loop`) or automated bots (OCR, CodeRabbit) |
| **Review Budget** | Infinite circular debate | Max 3 rounds (5 for critical security); exit early on nits |
| **Context Management** | Giant 200k conversation thread | Stateless iterations; clear context; pass diff + test error |
| **Test Integrity** | Agent can edit tests to pass | Test suite is frozen; test file modifications gated |
| **Cost Control** | Run indefinitely overnight | Pre-flight turn/token circuit breakers; uncatchable exception |
| **Failure Response** | Manually fix and forget | "Erect signs" in `AGENTS.md` so the loop never repeats it |
| **PR Management** | Active `sleep 10` polling loop | Event-driven waking (`watch_pull_request`); automatic rebase |
| **Merge Authority** | Blind autonomous merge | Gated by green CI + human review or explicit `full-send` contract |

---

## 5. Integrating with `agent-hill-climb` Modes

- **In `audit`**: Check for absent circuit breakers, self-review traps, missing `make verify`, and un-ratcheted test suites.
- **In `init`**: Scaffold `ratchet.json`, `ratchet.py`, and `scorecard.csv`. Add "signs" to `AGENTS.md` and seed initial counters.
- **In `tighten`**: Ratchet baseline numbers downward whenever clean evidence passes. Freeze test suites against tampering.
- **In `loop`**: Enforce single-deficiency focus, stateless execution, maximum 3 review rounds (Theo pattern), pre-flight circuit breaker checks, and append-only ledger logging.
