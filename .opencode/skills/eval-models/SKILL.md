---
name: eval-models
description: "Benchmark and evaluate LLM coding models in isolated OpenCode git worktrees on ground-truth tasks. Measures test pass rates, tokens, costs, durations, first-shot edit accuracy, and trajectory precision. Supports T3 Code thread orchestration and CLI runner modes."
argument-hint: "[--models <m1,m2...>] [--tasks <t1,t2...>] [--tier 1|2]"
---

# Model Evaluation Benchmark Skill (`eval-models`)

Use this skill whenever Parth asks to evaluate, benchmark, or compare coding models on real tasks.
Supported models: Free tier models in OpenCode (`muse-spark-1.3`, `mimo-v2.6`, `glm-5.3`, `beam`, `deepseek-v4.1`, `space-bunny`, `cat-jam-free`, `dots-3`), OmniRoute local routes (`omniroute/gemini-flash`, `omniroute/free`), and OpenRouter free models.

Base benchmark suite: `D:/work/projects/opencode-evals`

## Model ID Aliases & Shorthands

| User Input Shorthand | Provider | Full Model ID |
|---|---|---|
| `muse`, `muse spark`, `muse 1.3` | `opencode` | `opencode/muse-spark-1.3` |
| `mimo`, `mimo flash`, `mimo 2.6` | `opencode` | `opencode/mimo-v2.6-flash-free` |
| `glm`, `glm 5.3` | `opencode` | `opencode/glm-5.3-flash-free` |
| `beam` | `opencode` | `opencode/beam-free` |
| `deepseek`, `deepseek v4.1` | `opencode` | `opencode/deepseek-v4.1-flash-free` |
| `space bunny` | `opencode` | `opencode/space-bunny-free` |
| `cat jam` | `opencode` | `opencode/cat-jam-free` |
| `dots3`, `dots` | `openrouter` | `openrouter/dots-studio/dots-3-note-preview:free` |
| `gemini-flash`, `gemini` | `omniroute` | `omniroute/gemini-flash` |
| `omniroute free`, `free` | `omniroute` | `omniroute/free` |

## Task Registry

- **`py-warden-grants`** (Tier 2, Hard): Warden Policy Engine lease/grant cascade & timezone sync (Python, `pytest`).
- **`py-subset-sum`** (Tier 1, Medium): DAA Subset Sum Backtracking edge-case bug fix (Python, `pytest`).
- **`py-chat-ack`** (Tier 1, Medium): FastAPI WebSocket reconnect buffer sequencing bug (Python, `pytest`).
- **`ts-mermaid-cleaner`** (Tier 1, Hard): Obsidian Mermaid regex label quoting sanitizer (TypeScript, `bun test`).

---

## Execution Modes

### Mode 1: T3 Code Worktree Delegation (When inside T3 Code)

When running inside a T3 Code thread with access to `t3-code` tools:

1. For each requested model and task, call `delegate_task`:
   ```javascript
   await tools["t3-code-9c5f894c-18ed-4741-978f-c1993a5c00be"].delegate_task({
     task: taskPrompt,
     target: {
       providerInstanceId: "opencode",
       model: targetModelId
     },
     isolation: "worktree",
     mode: "wait"
   });
   ```
2. Once the delegated task returns:
   - Identify the child worktree directory.
   - Run the task's `verify_cmd` (e.g. `pytest tests/test_grants_leases.py -v`).
   - Run the evaluation scoring helper:
     ```bash
     python -c "from runner.t3_orchestrator import record_t3_run; print(record_t3_run('<model>', '<task_id>', '<worktree_path>', '<childThreadId>'))"
     ```
   - This automatically extracts telemetry from `opencode.db` (exact tokens, cost, duration, first-shot edit accuracy) and syncs `LEADERBOARD.md` and `dashboard/index.html`.

3. Post the scorecard with a clickable link to inspect the model's thoughts and tool trajectory:
   ```markdown
   | Model | Task | Status | Score | Duration | In / Out Tokens | Cost | Inspect |
   | `opencode/muse-spark-1.3` | `py-warden-grants` | ✅ PASS | 92.5/100 | 45.2s | 14,200 / 1,120 | Free | [Inspect Run](t3-thread://v1/<childThreadId>) |
   ```

### Mode 2: Fast CLI Runner (Headless or Bulk Batch)

When executing via command line or when T3 delegation is not available:

```bash
cd D:/work/projects/opencode-evals
python runner/bench.py run --models <model1,model2> --tasks <task1,task2>
```

Options:
- `--models`: Comma-separated model IDs (default: all configured free models).
- `--tasks`: Comma-separated task IDs (default: all tasks).
- `--keep-worktrees`: Keep temporary worktrees for post-mortem debugging.

To re-sync leaderboards without running tests:
```bash
python runner/bench.py sync
```

---

## Reporting & Leaderboard

After running:
- Display the updated ranking from `D:/work/projects/opencode-evals/LEADERBOARD.md`.
- Mention the visual dashboard at `D:/work/projects/opencode-evals/dashboard/index.html`.
- If a model failed, briefly highlight whether it failed due to test logic, `edit` string mismatches, or timeout.
