---







description: Initialize harness setup files for best practices — creates AGENTS.md, BLOCKED.md, LEARNINGS.md, LOG.md, TECH_DEBT.md, and project docs by exploring the codebase via graphify







agent: general







subtask: true







---







You are a harness setup specialist. Explore the current project and create all files needed for a proper agent harness setup.







## Step 1: Explore the codebase







Use the **graphify skill** to explore this project. Load it with:







```







skill name: graphify







```







If graphify is not installed, install it (`uv tool install graphifyy` or `pip install graphifyy`), then run `graphify .` on the project root. After the graph is built, use `graphify query` to learn:







- Tech stack and frameworks







- Key modules and responsibilities







- Entry points and main workflows







- Test/build/lint commands







- Naming conventions and patterns







If graphify is unavailable, fall back to `glob`, `grep`, and `read` on build configs (`package.json`, `pyproject.toml`, `Cargo.toml`, etc.) and `README.md`.







## Step 2: Create harness files







Create these files if they don't exist (skip if they exist — don't overwrite):







### 1. AGENTS.md (Project Root)







A comprehensive agent instruction file tailored to THIS project. Include these sections:







- **Project Overview**: 2-3 sentences on what this project does and its purpose







- **Tech Stack**: Languages, frameworks, build tools, package managers detected







- **Code & File Operations**: Understand-first (check graphify before reading files), minimal changes, follow existing code style, systematic bug fixes (reproduce then fix then verify), never overwrite existing files unless asked







- **Execution Guardrails**: Plan-first for multi-step tasks, safety zones (no `rm -rf` / `git reset --hard` without explicit approval), stage/commit only when asked




- **How to use Harness Files**: Add details on how to use the below harness files like BLOCKED.md,LEARNINGS.md ,etc.


- **Verification**: The actual test/lint/typecheck commands for THIS project (e.g. `npm test`, `cargo check`, `pytest`)







- **Definition of Done**: Explicit checklist — tests green, typecheck clean, e2e exercised (if applicable), committed with detailed message, learnings logged, logged in LOG.md







- **TDD**: Failing test first then implement then verify green. Never write implementation before a failing test exists







- **Context Re-entry**: Cold re-entry rules — open with recap, plain language, self-contained questions, one question at a time, anchor with project/branch/PR, end with next action







- **Harness Patterns**: Teach the agent via docs, point at docs in live code, one item per fresh chat, close the loop (verify + log + self-feedback), spawn helper agents for research, never compact chat, recover with git, loop anything repetitive, fix bugs by updating instructions not just patching, build spec before code







- **Exit Codes & Statuses**: Done, Blocked, Budget, Compacted, Stuck, Outage, Review







- **Artifacts**: Reference to BLOCKED.md, LEARNINGS.md, LOG.md, TECH_DEBT.md, PROMPT.md, .tmp/







- **Commit Standards**: What changed, what verified, decisions rationale, issue references



- **Concision**: extremely concise, sacrifice grammar concision



- **Agent skills (Matt Pocock)**: Include the `## Agent skills` section at the end of AGENTS.md:

  - **Issue tracker**: [one-line summary where issues tracked, e.g. "Issues tracked via GitHub Issues using gh CLI"]. See `docs/agents/issue-tracker.md`.

  - **Triage labels**: [one-line summary of label vocabulary, e.g. "Five canonical labels mapping to roles"]. See `docs/agents/triage-labels.md` (only if triage is present).

  - **Domain docs**: [one-line summary of layout, e.g. "Single-context domain document layout"]. See `docs/agents/domain.md`.



### 2. BLOCKED.md







A file for the agent to document when it cannot proceed. The human reads this to unblock. Use a table format for tracking:







```markdown







# Blockers







> Agent writes here when it cannot proceed. Human resolves and unblocks.







## Active Blockers







_None yet._







| ID | Date | Description | Attempted | Needs |







|----|------|-------------|-----------|-------|







| —  | —    | —           | —         | —     |







## Resolved Blockers







_None yet._







| ID | Date Resolved | Description | Resolution |







|----|---------------|-------------|------------|







| —  | —             | —           | —          |







```







### 3. LEARNINGS.md







Key learnings, edge cases, and decision rationale discovered during work. Has three sections:







```markdown







# Learnings







> Key learnings, edge cases, and concepts worth remembering for this project.







## Project-Specific Learnings







_None yet — populate as the agent discovers patterns, edge cases, and gotchas._







## Decision Log







> Why decisions were made, alternatives considered, and consequences.







_None yet._







## Edge Cases







> Known edge cases, gotchas, and non-obvious behaviors discovered during work.







_None yet._







```







### 4. LOG.md







Iteration log for every agent session/work cycle. Use table format:







```markdown







# Log







> Every iteration logged with status, what changed, and verification result.







## Format







Each entry:







- **Date**: YYYY-MM-DD HH:MM







- **Status**: Done | Blocked | Budget | Compacted | Stuck | Outage | Review







- **What**: Brief description of the task/change







- **Verified**: What was run to verify (tests, typecheck, etc.)







- **Notes**: Any decisions or learnings







## Entries







| Date | Status | What | Verified | Notes |







|------|--------|------|----------|-------|







| —    | —      | —    | —        | —     |







```







### 5. TECH_DEBT.md







Track technical debt separately to distinguish deliberate choices from bugs. Use table format:







```markdown







# Technical Debt







> Track tech debt separately to distinguish deliberate choices from bugs.







> When a decision is made for pragmatic reasons (deadline, scope), log it here.







> When a bug is actually a choice (not a mistake), log it here.







## Active Debt







_None yet — populate as the agent identifies debt during work._







| ID | Date | Description | Rationale | Impact | Effort to Fix |







|----|------|-------------|-----------|--------|---------------|







| —  | —    | —           | —         | —      | —             |







## Resolved Debt







_None yet._







| ID | Date Resolved | Description | Resolution |







|----|---------------|-------------|------------|







| —  | —             | —           | —          |







```







### 6. docs/architecture.md







Based on graphify exploration, document the actual project architecture:







- Project structure (directories and their purposes)







- Key modules/packages and their responsibilities







- Data flow (request then processing then response)







- External dependencies and integrations







- Entry points (main files, CLI commands, API routes)







- Graphify graph location (`graphify-out/graph.json`) for future agent queries







### 7. docs/decisions.md







Architecture Decision Record (ADR) log:







```markdown







# Architecture Decisions







> ADR-style log of significant decisions.







## Format







### [DATE]: [Title]







- **Status**: Proposed | Accepted | Superseded







- **Context**: Why this decision was needed







- **Decision**: What was decided







- **Consequences**: Trade-offs and implications







## Decisions







_None yet._







```







### 8. docs/patterns.md







Code patterns, naming conventions, and idioms specific to this project:







```markdown







# Patterns & Conventions







> Code patterns, naming conventions, and idioms specific to this project.







## Naming Conventions







_Document as discovered (e.g. camelCase for variables, PascalCase for classes)._







## Code Patterns







_Document as discovered (e.g. repository pattern, factory pattern)._







## Testing Patterns







_Document as discovered (e.g. test file location, naming, mocking)._







## Import/Module Conventions







_Document as discovered (e.g. relative vs absolute imports, barrel files)._







```



### 9. docs/agents/ Layout



Set up Matt Pocock's engineering skills configuration by exploring the repository remote and layout, then creating the following files under `docs/agents/` using the templates in `C:\Users\DELL\.agents\skills\setup-matt-pocock-skills\`:



1. **`docs/agents/issue-tracker.md`**: Detect whether the repository has a GitHub remote (default) or GitLab remote, and write the corresponding issue tracker conventions based on the `issue-tracker-github.md` or `issue-tracker-gitlab.md` templates. If it's a local project without a remote, write `issue-tracker-local.md` template.

2. **`docs/agents/domain.md`**: Define the domain model consumption structure. Propose a `single-context` layout (with `CONTEXT.md` at root and ADRs in `docs/adr/`) by default, using `domain.md` template. Select a `multi-context` layout if monorepo signals exist.

3. **`docs/agents/triage-labels.md`**: If the `triage` skill is present or installed in your agent environment, create the mapping of canonical triage labels using the `triage-labels.md` template.









## Step 3: Report







Summarize:







1. What files were created (with paths)







2. What was detected about the project (stack, structure, graphify communities)







3. Any files that already existed and were skipped







4. Graphify outputs location (`graphify-out/`) for future queries







5. Next steps for the user







