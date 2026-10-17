---
name: deep-performance-engineering
description: "Deep performance engineering & regression ratchets for any software (Web, Mobile/React Native, Backend/AI agents). Implements the 'Count to Climb' methodology: milestone decomposition, 3-tier metrics pyramid, zero-flake deterministic testing, in-app telemetry, OS-level profiling, and automated ratchet gates."
argument-hint: "[init | audit | benchmark | ratchet | optimize] [--platform web|mobile|backend|ai] [--baseline <file>]"
metadata:
  version: 1.0.0
  author: OpenCode Deep Performance Engineering
---

# Deep Performance Engineering & Regression Ratchets

A cross-platform methodology and toolchain for instrumenting, benchmarking, and ratcheting performance across **any software application** (Web, Mobile/React Native, Backend, Streaming AI & Agentic Loops).

Based on the core principles of high-performance engineering sprints:
- **"Anything we could count, we could climb."** — *Anthropic Engineering & Theo (t3.gg)*
- **"Give your agent a goal, and let it be creative."** — *Matt Pocock (Agentic Optimization Loops)*
- **"Never optimize without a metric; never merge code that regresses the ratchet."**

---

## When to Use This Skill

- **Designing Performance Metrics**: Defining the right milestones and KPIs for a new or existing app.
- **Deep Performance Audits**: Diagnosing why an app "feels sluggish," stutters during streaming, or drops frames.
- **Setting up Regression Ratchets**: Creating automated benchmark runners that block CI/PRs if performance drops by more than a defined threshold (e.g., 5–10%).
- **Autonomous Optimization Loops**: Directing an AI coding agent to iteratively optimize bottlenecks, verifying every single code change against empirical data.

---

## 1. The Core Philosophy: "Count to Climb"

Performance optimization fails when teams optimize based on intuition. Deep performance engineering treats speed as a deterministic engineering problem:

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ 1. Decompose    │  ───> │ 2. Zero-Flake   │  ───> │ 3. Instrument   │  ───> │ 4. Lock Ratchet │
│ Critical User   │       │ Synthetic       │       │ 3-Tier Metrics  │       │ & Climb Loops   │
│ Journeys (CUJs) │       │ Harness         │       │ (User/App/OS)   │       │ (Verify Deltas) │
└─────────────────┘       └─────────────────┘       └─────────────────┘       └─────────────────┘
```

1. **Deconstruct user journeys into explicit milestones**: Don't say "chat is slow." Measure `tap_to_bubble_ms`, `stream_token_render_hz`, `markdown_ast_parse_ms`, and `os_jank_frame_pct`.
2. **Eliminate synthetic noise**: If testing an AI interface, test against a local mock emitting at a fixed 50 tokens/sec. Never let cloud network fluctuations contaminate client benchmarks.
3. **Ratchet, never slip**: Once a metric reaches 25ms, lock it in `perf-baseline.json`. A new PR taking 35ms fails the gate.

---

## 2. The 3-Tier Metric Pyramid

Every modern software system—regardless of whether it is a chat app, dashboard, compiler, or AI agent—must measure across three distinct abstraction tiers:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       Tier 1: User-Perceived Latency                    │
│  The human experience: Time-to-Interactive, Time-to-Feedback, Throughput│
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────┴────────────────────────────────────┐
│                    Tier 2: Framework & Runtime Budget                   │
│  The engine: React renders, AST parsing, GC pauses, event-loop lag      │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────┴────────────────────────────────────┐
│                     Tier 3: Platform OS & Hardware Health               │
│  The machine: Jank frames (>16.6ms), CPU cycles, PSS memory, battery    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Tier 1: User-Perceived Latency (Wall-Clock)
- **Time-to-Action (TTA) / Time-to-Typeable (TTT)**: Process launch until the user can interact (input focused, ready for keystrokes).
- **Optimistic Action Latency**: Milliseconds from user event (`onPress`, `onClick`, `onKeyDown`) until the resulting UI feedback paints on screen. (Target: `< 16.6ms` / 1 frame).
- **Time-to-First-Feedback (TTFT)**: Start of operation to the first byte/chunk/token visually rendered.
- **Total Duration to Settle**: End-to-end wall-clock time for an asynchronous or streaming task.

### Tier 2: Framework & Runtime Budget (Engine Overhead)
- **Render Commit Frequency**: How many times did the UI framework (React, Vue, SwiftUI) commit to the layout engine during an operation?
- **Redundant Re-renders**: Number of sibling or ancestor components that re-rendered without visual change.
- **Parsing & AST Overhead**: Total CPU time spent parsing unstructured data (Markdown, JSON, syntax highlighting, LaTeX).
- **JS Event Loop Lag**: Delay between scheduling an immediate callback and its execution.

### Tier 3: Platform OS & Hardware Health (System Resources)
- **Frame Jank Rate (%)**: Percentage of frames taking longer than 16.6ms (60 Hz) or 8.3ms (120 Hz).
- **P95 / P99 Frame Time**: Worst-case frame durations during intense interaction.
- **Memory Growth (PSS/RSS)**: Retained heap delta before and after an operation to catch memory leaks early.
- **CPU / Thread Saturation**: Main/UI thread vs background/worker thread utilization.

---

## 3. Platform-Specific Extraction Blueprints

### Blueprint A: Mobile (React Native / Expo / Native Android & iOS)
- **The Core Challenge**: Split threads (Hermes/JS thread vs Native UI thread). Smooth animations do not mean the app is responsive if the JS thread is blocked.
- **Measurement Strategy**:
  1. **High-Res In-App Telemetry**: Inject `performance.now()` in user action handlers and component `onLayout` hooks. Emit structured tags to Logcat:
     `console.log('[PERF]', JSON.stringify({ metric, durationMs }));`
  2. **Android Native Frame Stats**: Use `dumpsys gfxinfo <package> framestats` to get hardware-level jank count and frame durations without debugging overhead.
  3. **Process Cold Start**: Use `adb shell am start-W -n <package>/<activity>` to measure `ThisTime` and `TotalTime`.
  4. **Always Test in Release/Profile Mode**: Never benchmark Metro debug builds.

### Blueprint B: Web & Next.js
- **The Core Challenge**: Browser main thread contention, hydration waterfalls, and large JavaScript bundles.
- **Measurement Strategy**:
  1. **User Timing API**: `performance.mark()` and `performance.measure()`.
  2. **React 19 `<Profiler>`**: Wrap target components to measure `actualDuration` and commit counts.
  3. **Long Tasks & INP**: Observe tasks exceeding 50ms via `PerformanceObserver({ entryTypes: ['longtask', 'event'] })`.
  4. **Headless Automation**: Use Playwright/Puppeteer with CPU throttling (4x slowdown) to simulate mid-tier devices.

### Blueprint C: Backend, Streaming APIs & AI Agents
- **The Core Challenge**: LLM provider latency masking internal pipeline inefficiencies.
- **Measurement Strategy**:
  1. **Milestone Spans**: Trace `request_received` → `prompt_compiled` → `retrieval_done` → `first_token_emitted` → `stream_complete`.
  2. **Token Generation Speed**: Measure internal client-side token consumption rate (Tokens/sec).
  3. **Serialization & Memory**: Measure JSON/Pickle serialization overhead on large conversation contexts using Python's `time.perf_counter_ns()` and `tracemalloc`.

---

## 4. The 5-Step Deep Performance Workflow

When applying this skill to any codebase, follow these five steps in sequence:

### Step 1: Audit & Identify the 3 Most Critical User Journeys (CUJs)
Ask: *What does the user do repeatedly that must feel instantaneous?*
- Example in Chat: (1) App Cold Start, (2) Tap Send → Message Bubble, (3) Streaming 100 Tokens.
- Example in Dashboard: (1) Initial Load, (2) Filter Apply → Table Render, (3) Chart Re-draw.
- Example in Developer Tool: (1) Project Scan, (2) Command Execution, (3) File Diff Generation.

### Step 2: Build a Zero-Flake Synthetic Harness
Create a local mock or fixture that feeds deterministic data:
- Eliminate variable network conditions (use local loopback / mock server).
- Fix data size (e.g. exactly 100 items, exactly 50 tokens/sec at 20ms intervals).
- Run each test 5 times; drop highest and lowest; average the remaining 3.

### Step 3: Add High-Res Telemetry
Copy the relevant telemetry template from `templates/` into the project:
- For React Native: `templates/telemetry-react-native.ts`
- For Web: `templates/telemetry-web.ts`
- For Backend / AI: `templates/telemetry-backend.py`

Attach markers to the start of the action and the end of the visual render.

### Step 4: Capture Baseline (`perf-baseline.json`)
Run the test runner and save initial metrics:
```bash
python scripts/ratchet.py --record results/perf-baseline.json --data results/current.json
```
Commit `perf-baseline.json` into source control.

### Step 5: The Agentic Optimization Loop (The Climb)
Use the Matt Pocock goal-directed pattern:
1. **Target**: "Reduce `send_to_bubble_ms` from 28ms to < 16ms."
2. **Profile**: Identify which function holds the thread (e.g., synchronous SQLite call, unmemoized list).
3. **Minimal Fix**: Implement atomic refactor (e.g., optimistic local state before DB persist).
4. **Ratchet Check**:
   ```bash
   python scripts/ratchet.py --baseline results/perf-baseline.json --current results/current.json --max-regression 10
   ```
5. **Outcome**:
   - If ✅ Faster: Advance baseline ratchet!
   - If ❌ Regressed: Revert code change immediately.

---

## 5. Bundled Scripts & Templates

This skill includes battle-tested tools located in this directory:

| Path | Purpose |
|---|---|
| `scripts/ratchet.py` | Standalone CLI to compare `baseline.json` vs `current.json`, calculate deltas, generate Markdown comparison tables, and exit non-zero on regression. |
| `templates/perf-baseline.schema.json` | JSON schema for deterministic metric baseline files. |
| `templates/telemetry-react-native.ts` | Zero-dependency high-resolution telemetry helper for Expo & React Native. |
| `templates/telemetry-web.ts` | High-resolution User Timing & React Profiler helper for Web / Next.js. |
| `templates/telemetry-backend.py` | High-resolution span timer and memory tracker for Python & AI backends. |
| `templates/ci-performance-gate.yml` | GitHub Actions workflow to run performance ratchets on PRs. |

---

## 6. CLI Usage & Commands

Run the comparator script directly:

```bash
# Compare current run against baseline (5% max regression allowed by default)
python .opencode/skills/deep-performance-engineering/scripts/ratchet.py \
  --baseline perf-baseline.json \
  --current perf-current.json

# Custom tolerance and Markdown export
python .opencode/skills/deep-performance-engineering/scripts/ratchet.py \
  --baseline perf-baseline.json \
  --current perf-current.json \
  --max-regression 10 \
  --markdown-output perf-report.md

# Update baseline with current metrics (ratchet forward after win)
python .opencode/skills/deep-performance-engineering/scripts/ratchet.py \
  --update-baseline \
  --baseline perf-baseline.json \
  --current perf-current.json
```
