---
name: t3-orchestrator
description: Coordinate multi-agent workflows using T3 Code Orchestrator v2 — cross-model delegation, git worktree isolation, adversarial review loops, PR babysitting, and persistent scheduling.
---

# T3 Code Orchestrator v2

Guide for orchestrating multi-agent tasks using the native T3 Code Orchestrator MCP server and Code Mode runtime.

## When to Use

Use this skill when you need:
1. **Isolated Worktree Execution**: Running code tasks in clean git worktrees without mutating the active working directory.
2. **Cross-Model / Cross-Provider Routing**: Routing heavy coding or reasoning tasks to Claude Opus/Sonnet, Codex, or specific effort levels while running the main orchestrator on a fast/cheap model.
3. **Builder–Reviewer Separation**: Delegating fresh review rounds without dragging 150k+ tokens of conversation history into the review context.
4. **Hands-Off PR Babysitting**: Linking PRs and yielding execution via `watch_pull_request` so T3 wakes you only on CI changes or review comments.
5. **Scheduled Automation**: Setting up persistent timers (cron/interval) or webhooks via T3's native scheduler.

> **Note on OpenCode Subagents vs T3 Orchestrator**:
> - Use standard OpenCode `subagent` for fast, intra-session research, quick file exploration (`explore`), or documentation lookups.
> - Use T3 `delegate_task` when you need worktree isolation, cross-provider model execution, or clean token boundaries.

---

## Tool Cheat Sheet

All tools are accessible via Code Mode (`execute`):

| Tool | Purpose | Key Parameters |
|---|---|---|
| `orchestrator_capabilities` | Discover available models and providers live | `{}` |
| `delegate_task` | Delegate child work to a T3-owned agent | `task`, `isolation: "worktree" \| "none"`, `target: { providerInstanceId, model }`, `clientRequestId` |
| `task_status` | Poll status and fetch output of a delegated task | `taskId` |
| `task_cancel` | Cancel an ongoing delegated task | `taskId` |
| `t3_thread_launch` | Launch a separate top-level thread with specific workspace | `title`, `workspaceStrategy: { type: "worktree" \| "existing_worktree" \| "root" }`, `message` |
| `link_pull_request` | Register PR with thread for tracking | `url` |
| `watch_pull_request` | Yield execution until PR checks or reviews change | `url` |
| `unwatch_pull_request` | Stop watching PR before handing back to user | `url` |
| `schedule_task` | Create persistent timer or webhook run | `task`, `schedule: { type: "interval" \| "fixed_time" \| "webhook" }` |

---

## Core Orchestration Workflows

### 1. Model Discovery & Selection

Always discover the live model and provider IDs rather than guessing:

```javascript
const caps = await tools[T3_MCP_NAMESPACE].orchestrator_capabilities({});
// Returns available providers (e.g., opencode, claudeAgent, codex)
// and supported models with options (e.g. effort, reasoning settings).
```

### 2. Isolated Worktree Builder Pattern

Run implementations in an isolated worktree to prevent uncommitted changes from breaking the main working tree:

```javascript
const task = await tools[T3_MCP_NAMESPACE].delegate_task({
  task: `
Implement feature X according to the spec:
1. Write failing tests first (TDD).
2. Implement minimal changes to pass.
3. Run verification.
4. Commit changes with a descriptive message.
5. Conclude with a HANDOFF: INTENT paragraph explaining what changed and why.
  `.trim(),
  isolation: "worktree",
  target: {
    providerInstanceId: "opencode",
    model: "omniroute/claude-sonnet-4-6" // or model discovered via capabilities
  },
  clientRequestId: "feature-x-build-v1"
});

// Wait or check status
const res = await tools[T3_MCP_NAMESPACE].task_status({ taskId: task.taskId });
```

### 3. Builder–Driver–Reviewer Split (Adversarial Multi-Round Review)

To prevent context inflation and confirmation bias:
1. **Builder** finishes task, commits, and returns `HANDOFF: INTENT`.
2. **Reviewer** is delegated via a **fresh** `delegate_task` call with its own `clientRequestId`:
   - Pass *only* the original requirements and the commit diff/hash.
   - Do not pass the builder's entire scratchpad.
3. If review findings are blocking:
   - Call `delegate_task` again for round 2 with prior findings and requested fixes.
   - Use a new `clientRequestId` (e.g. `feature-x-review-round-2`).

### 4. PR Babysitting Loop

Never poll `git status` or GitHub in busy loops. Use event-driven watching:

```javascript
// 1. Link PR immediately after creation
await tools[T3_MCP_NAMESPACE].link_pull_request({
  url: "https://github.com/org/repo/pull/42"
});

// 2. Watch PR and yield turn
await tools[T3_MCP_NAMESPACE].watch_pull_request({
  url: "https://github.com/org/repo/pull/42"
});

// Once T3 wakes the agent when checks finish or comments arrive:
// Address review comments, push fixes, and unwatch when ready for human handoff:
await tools[T3_MCP_NAMESPACE].unwatch_pull_request({
  url: "https://github.com/org/repo/pull/42"
});
```

### 5. Persistent Scheduled Automation

To run recurring maintenance, audits, or digests:

```javascript
// Schedule weekday 09:00 AM check
const scheduled = await tools[T3_MCP_NAMESPACE].schedule_task({
  task: "Run /audit and report Four-Cs score delta to decisions/log.md",
  schedule: {
    type: "fixed_time",
    timeOfDay: "09:00",
    weekdays: [1, 2, 3, 4, 5]
  },
  bindToCurrentThread: true
});
```

---

## Terminal / ACP Fallback Transport

If MCP tools are not directly exposed in the tool catalog but `T3_ACP_MCP_NODE` is set:

```bash
ELECTRON_RUN_AS_NODE=1 "$T3_ACP_MCP_NODE" ${T3_ACP_MCP_ENTRYPOINT:+"$T3_ACP_MCP_ENTRYPOINT"} acp-mcp-call orchestrator_capabilities '{}'

ELECTRON_RUN_AS_NODE=1 "$T3_ACP_MCP_NODE" ${T3_ACP_MCP_ENTRYPOINT:+"$T3_ACP_MCP_ENTRYPOINT"} acp-mcp-call delegate_task '{"task":"...","isolation":"worktree","clientRequestId":"req-1"}'
```
