---
name: ocr-review
description: "AI code review via ocr CLI (alibaba/open-code-review v1.12.9): diff review (workspace/branch/commit), full-file scan, delegation mode, session resume. Use when user says ocr review, review changes, scan repo, delegate review, check branch diff. Produces line-level findings grouped by severity."
argument-hint: "[workspace | --from main --to <branch> | --commit <sha> | scan --path <dir>] [--format json]"
---

# OCR Review

Diff-based (`ocr review`) and full-file (`ocr scan`) AI review via [alibaba/open-code-review](https://github.com/alibaba/open-code-review), plus no-LLM delegation (`ocr delegate`) for host agents. OCR reads diffs/files, sends to configured LLM (here: omniroute gateway → gemini-3.7-flash-medium, verified via `ocr llm test`), returns structured line-level comments. Companion: `checkpoint`/`babysit-pr`/`merge-pr` for PR lifecycle — this skill only reviews.

## Workflow

### Step 1: Gather Business Context

Analyze the review target (workspace diff, branch range, commit) and extract 1-2 sentences of business context. **Always pass via `--background`** when available — it measurably improves finding quality:

```bash
ocr review --audience agent --background "Adding rate limiting to login API, public API unchanged" [scope-flags]
```

If context lives in a file: `--background-file ./docs/requirements.md` (takes precedence over `--background`).

### Step 2: Run Code Review

**Do not probe for install** (`which ocr`, `ocr --version`) on the common path — assume available, run directly. Only if `command not found`, install: `npm install -g @alibaba-group/open-code-review` (v1.12.9 installed here, supports `--output`).

| Goal | Command |
|------|---------|
| Workspace (staged+unstaged+untracked) | `ocr review --audience agent -b "context"` |
| Branch range (merge-base) | `ocr review --audience agent -b "context" --from main --to feature-branch` |
| Single commit vs parent | `ocr review --audience agent -b "context" --commit abc123` (`-c` short) |
| Whole repo, no diff | `ocr scan --audience agent --path internal/agent` (or bare `ocr scan`) |
| Host agent reviews itself (no LLM) | `ocr delegate preview` then `ocr delegate rule <files>` |
| Resume interrupted range/commit/scan | add `--resume <session-id>` (workspace resume NOT supported) |
| Machine output | add `--format json --output result.json` (`text` default, `sarif` for code-scanning) |

Preview first (cheap, no LLM) on new scopes:

```bash
ocr review --preview
ocr review --from main --to feature-branch --preview
ocr scan --path internal/agent --preview
ocr delegate preview --from main --to feature-branch
```

Tuning (all verified `v1.12.9`):

```bash
--exclude '**/generated/*,**/testdata/*'  # merged with rule.json excludes
--effort high                             # low | medium | high (default medium)
--provider <name> --model <name>          # per-run override; list via `ocr llm providers`
--concurrency 8 --timeout 15              # 15min × rounds (low 1 / medium 2 / high 3)
--max-tokens 200000 --max-tokens-budget 0 # per-group ceiling / total cap (0=unlimited)
--no-filter                               # keep all comments, skip LLM post-filter
--repo /path/to/repo                      # run outside current dir
```

**Prevent truncation:** for large reviews never pipe through `tail`/`head` — use `--output /tmp/ocr_out.txt` (`-o` short) and read the file. If `unknown flag: --output`, CLI is <v1.10.0 → ask user to upgrade (`npm i -g @alibaba-group/open-code-review@latest`), wait for confirm, rerun.

Delegation (no LLM config needed, OCR supplies files+rules, agent reviews):

```bash
ocr delegate preview --from main --to feature-branch
ocr delegate rule src/main.go src/handler.go
```

Sessions:

```bash
ocr session list
ocr session show <id> | ocr session comments <id>
ocr session compare <id1> <id2>
ocr session export <id> -o review.html
ocr review --from main --to feature-branch --resume <id>
ocr scan --resume <id>
```

### Step 3: Report

OCR emits `severity` (critical/high/medium/low) + `category` (bug/security/performance/maintainability/test/style/documentation/other) per comment, with `path`, `start_line`/`end_line`, `suggestion_code`, `existing_code`. **Discard `low`** (likely nitpick). Group remainder:

```markdown
## Code Review Results

**Files reviewed**: N
**Issues found**: X critical, Y high, Z medium

### Critical
- **`path/file:42`** [bug] — Brief description
  > Recommendation: fix

### High
- **`path/file:26`** [security] — Brief description
  > Recommendation: fix

### Medium
- **`path/file:88`** [performance] — Brief description
```

If none remain: "Review complete — no critical, high, or medium issues found in N files." Lines `0-0` mean positioning failed — read the file and locate by content. Always include scope, finding count, output path, session id.

### Step 4: Fix (gated)

- Explicit "review and fix" → proceed with critical/high/medium fixes directly.
- Bare "review" → **ask permission before changing code**. Report first, propose fixes, request approval.
- Complex/manual fixes → describe clearly, verify with user before committing.

## Custom Review Rules

Priority: `--rule <path>` > `<repo>/.opencodereview/rule.json` > `~/.opencodereview/rule.json` > built-in defaults. First matching user rule replaces the built-in; set `merge_system_rule: true` to keep both:

```json
{
  "rules": [
    {"path": "**/*.java", "rule": "All new methods must validate required parameters for null", "merge_system_rule": true},
    {"path": "**/*mapper*.xml", "rule": "Check SQL for injection risks and missing closing tags"}
  ]
}
```

Preview resolution: `ocr rules check src/main/Foo.java`. Built-ins here cover Correctness/Security/Performance/Maintainability (verified via `ocr rules check README.md`).

## Gotchas

- **LLM must be configured** — fails loudly if unreachable. Here omniroute gateway works (`ocr llm test` ✓). If broken: `ocr config provider` (interactive) or `ocr config set llm.url/token/model/use_anthropic`, then `ocr llm test`. Never invent keys.
- **Cwd matters** — operates on repo at cwd; use `--repo` elsewhere.
- **Workspace includes untracked** — bare `ocr review` covers staged+unstaged+untracked; stage selectively to narrow.
- **Large diffs skip** — file diff >~80% of `MAX_TOKENS` (200k review / 58888 scan) is skipped pre-LLM; output capped by `MAX_COMPLETION_TOKENS` 16384.
- **Plan phase** triggers when largest changed file ≥50 lines or 2+ files total ≥100 lines (extra latency, better quality).
- **Never `--audience human`** for agents — progress UI pollutes output. Always `--audience agent`.
- **Comment language follows `language` config** (default English, accepts any name e.g. `中文`).
- **Budget partials exit 0** unless every item failed; skipped files report `failed(budget)`.

## Rules

- **Background first.** Always pass `--background`/`--background-file` when context exists.
- **Preview before spend.** `--preview` on every new scope before LLM run.
- **Agent output discipline.** `--audience agent --format json --output <file>` for machine consumers; read file in full.
- **Never invent flags.** Verified v1.12.9: `--from/--to/--commit/-c/--resume/--path/--preview/-p/--format/-f/--output/-o/--exclude/--effort/--background/-b/--background-file/-B/--provider/--model/--audience/--repo/--rule/--tools/--concurrency/--timeout/--max-tokens/--max-tokens-budget/--no-filter/--no-plan/--no-dedup/--no-summary`. Else `ocr <cmd> --help`.
- **Delegate ≠ review.** `ocr delegate` never calls LLM — host builds git commands from `preview` metadata.
- **`scan` needs no git history; `review` needs a diff.**
- **Never auto-fix on bare review.** Gated Step 4.
- **Never commit `result.json`/`scan.json`** unless asked.

## Verification

- Preview listed ≥1 file (or explain empty)
- Exit 0; `--output` file exists, valid UTF-8 (JSON parses for `json`)
- Report grouped critical/high/medium, low discarded, scope + session id included
- `git status --porcelain` unchanged (read-only)

## Troubleshooting

- `ocr: command not found` → `npm install -g @alibaba-group/open-code-review`
- `unknown flag: --output` → CLI <v1.10.0 → ask to upgrade, wait, rerun
- LLM connection error → `ocr config provider` / manual `ocr config set …` / `ocr llm test`; ask user for creds
- Rate limits → lower `--concurrency`, raise `--timeout`, or split `--path` scope

## References

- Repo: https://github.com/alibaba/open-code-review
- Docs: https://open-codereview.ai/docs (+ `/delegate`, `/cicd`, `/agent-skill`)
- NPM: https://www.npmjs.com/package/@alibaba-group/open-code-review
- Issues: https://github.com/alibaba/open-code-review/issues
- OpenCode plugin: `plugins/open-code-review/opencode/` (ocr_review/ocr_health tools)
