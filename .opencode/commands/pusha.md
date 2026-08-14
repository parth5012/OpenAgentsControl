---
agent: orchestrator
description: "Syncs OpenCode and Omniroute configurations from local setup to the remote repository and pushes changes to GitHub"
---

Syncs the OpenCode configs and optionally pushes to GitHub (Pusha).

**Request:** $ARGUMENTS

**Process:**
1. Check the arguments for a push flag (e.g. `--push` or `-Push` or empty/no arguments if push is default).
2. Execute the sync script (`sync.ps1` on PowerShell or `sync.sh` on Bash) with the push flag.
3. Output the sync and push status.

**Syntax:**
```bash
/pusha [--push]
```

**Parameters:**
`--push` Optional flag to commit and push changes to GitHub.

**Examples:**

```bash
Example 1: Sync configurations locally
/pusha

Example 2: Sync configurations and push to GitHub
/pusha --push
```

**Output:**
```yaml
status: "success"
synced: true
pushed: true
```
