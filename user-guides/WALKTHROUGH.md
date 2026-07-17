# OpenCode Setup — Complete Walkthrough

This project is **OpenAgents Control (OAC)**, built on [OpenCode](https://opencode.ai). It replaces generic AI coding with a pattern-aware, approval-gated agent system that learns YOUR coding conventions and produces repeatable results.

---

## Directory Structure at a Glance

```
OpenCode Setup/
├── .opencode/              ← The brain (agents, commands, skills, context)
│   ├── agent/              ← AI agents (primary + subagents)
│   ├── command/            ← Slash commands (/commit, /test, etc.)
│   ├── skills/             ← Reusable skill modules
│   ├── context/            ← Knowledge base (standards, patterns, workflows)
│   ├── profiles/           ← Install profiles (developer, full, etc.)
│   ├── plugins/            ← Optional plugins (coder-verification)
│   ├── prompts/            ← Reusable prompt templates
│   ├── tool/               ← Custom tools (env, gemini)
│   ├── config.json         ← OmniRoute provider + model routing
│   └── opencode.json       ← Same (OpenCode config entry point)
├── .omniroute/             ← OmniRoute dashboard config (symlinked)
├── setup-symlink.bat       ← Links ~/.config/opencode → this .opencode
├── setup-omniroute-symlink.bat ← Links ~/.omniroute → this .omniroute
└── SYMLINKS-GUIDE.md       ← Windows symlink reference
```

---

## Part 1: Primary Agents

These are the agents you launch directly with `opencode --agent <name>`.

### OpenAgent — Start Here

**File:** `.opencode/agent/core/openagent.md`
**Launch:** `opencode --agent OpenAgent`
**Best for:** General tasks, learning the system, questions, docs, quick implementations (1–4 files)

**What it does:**
1. Uses ContextScout to discover your project patterns before doing anything
2. Proposes a plan and waits for your approval
3. Executes with validation
4. Delegates to specialist subagents when needed

**When to use:**
- "Create a README for this project"
- "Explain the architecture of this codebase"
- "How do I implement authentication in Next.js?"
- Any task touching fewer than 4 files

**Permissions:** Blocks edits to `.env`, `.key`, `.secret` files. Blocks `sudo` and `/dev/` writes. Asks before running destructive bash commands.

---

### OpenCoder — Production Development

**File:** `.opencode/agent/core/opencoder.md`
**Launch:** `opencode --agent OpenCoder`
**Best for:** Complex features, multi-file refactoring, production systems (4+ files)

**6-stage workflow:**

| Stage | What Happens |
|-------|-------------|
| **1. Discover** | ContextScout finds your tech stack, patterns, naming conventions |
| **2. Propose** | Detailed implementation plan with file list and architecture |
| **3. Approve** | You review and approve before any code is written |
| **4. Execute** | Incremental implementation using YOUR patterns |
| **5. Validate** | Tests (TestEngineer), type check (BuildAgent), review (CodeReviewer) |
| **6. Ship** | Production-ready code, no refactoring needed |

**When to use:**
- "Create a user authentication system"
- "Refactor this codebase to use dependency injection"
- "Add real-time notifications with WebSockets"
- Any feature spanning multiple files/layers

---

### SystemBuilder — Custom AI System Generator

**File:** `.opencode/agent/meta/system-builder.md`
**Launch:** `opencode --agent SystemBuilder`
**Best for:** Building entire domain-specific AI systems from scratch

**What it does:** Interactive wizard that interviews you about your domain, then generates a complete `.opencode` folder with custom orchestrators, subagents, context files, workflows, and commands.

**When to use:**
- "Create a customer support AI system"
- "Build an AI-powered code review pipeline"
- When you want a brand new agent ecosystem for a specific domain

---

### Content Agents

| Agent | File | Purpose |
|-------|------|---------|
| **Copywriter** | `agent/content/copywriter.md` | Marketing copy, product descriptions |
| **Technical Writer** | `agent/content/technical-writer.md` | API docs, technical documentation |
| **Data Analyst** | `agent/data/data-analyst.md` | Data analysis, reporting |

---

## Part 2: Subagents (Auto-Delegated)

You never launch these directly. The primary agents delegate to them automatically.

### Core Subagents

| Subagent | File | What It Does | Triggered When |
|----------|------|-------------|----------------|
| **ContextScout** | `subagents/core/contextscout.md` | Discovers your project patterns and standards from context files. Ranks by priority (Critical → High → Medium). | Before every task — always the first thing that runs |
| **ExternalScout** | `subagents/core/externalscout.md` | Fetches live, current documentation for external libraries (npm, GitHub, official docs). No stale training data. | When an agent detects an external dependency |
| **TaskManager** | `subagents/core/task-manager.md` | Breaks complex features into atomic, verifiable subtasks with dependencies. Smart agent suggestions. | Complex multi-step features |
| **ContextManager** | `subagents/core/context-manager.md` | Manages context file lifecycle — harvest, extract, organize, update | Via `/context` command |
| **BatchExecutor** | `subagents/core/batch-executor.md` | Runs multiple tasks in parallel batches | When work can be parallelized |
| **StageOrchestrator** | `subagents/core/stage-orchestrator.md` | Manages multi-stage workflows, gating rules, validation, rollback | Complex feature delivery |
| **DocWriter** | `subagents/core/documentation.md` | Generates documentation matching your project's style | When docs need writing |

### Code Subagents

| Subagent | File | What It Does |
|----------|------|-------------|
| **CoderAgent** | `subagents/code/coder-agent.md` | Focused, single-task code implementation |
| **TestEngineer** | `subagents/code/test-engineer.md` | Test authoring, TDD workflows |
| **CodeReviewer** | `subagents/code/reviewer.md` | Code review, security analysis |
| **BuildAgent** | `subagents/code/build-agent.md` | Type checking, build validation |

### Development Subagents

| Subagent | File | What It Does |
|----------|------|-------------|
| **FrontendSpecialist** | `subagents/development/frontend-specialist.md` | Design systems, themes, animations, 4-stage UI workflow |
| **DevOpsSpecialist** | `subagents/development/devops-specialist.md` | CI/CD, infrastructure, deployment |

### Planning Subagents

| Subagent | File | What It Does |
|----------|------|-------------|
| **ArchitectureAnalyzer** | `subagents/planning/architecture-analyzer.md` | DDD-driven architecture analysis, bounded contexts |
| **StoryMapper** | `subagents/planning/story-mapper.md` | User journey → epics → stories → vertical slices |
| **ADRManager** | `subagents/planning/adr-manager.md` | Architecture Decision Records |
| **ContractManager** | `subagents/planning/contract-manager.md` | API contract management, OpenAPI/Swagger |
| **PrioritizationEngine** | `subagents/planning/prioritization-engine.md` | RICE/WSJF scoring, MVP slicing |

### SystemBuilder Subagents

| Subagent | File | What It Does |
|----------|------|-------------|
| **DomainAnalyzer** | `subagents/system-builder/domain-analyzer.md` | Analyzes user domains for agent recommendations |
| **AgentGenerator** | `subagents/system-builder/agent-generator.md` | Generates XML-optimized agent files |
| **ContextOrganizer** | `subagents/system-builder/context-organizer.md` | Organizes context files for new systems |
| **WorkflowDesigner** | `subagents/system-builder/workflow-designer.md` | Designs workflow definitions |
| **CommandCreator** | `subagents/system-builder/command-creator.md` | Creates custom slash commands |

### Utility

| Subagent | File | What It Does |
|----------|------|-------------|
| **ImageSpecialist** | `subagents/utils/image-specialist.md` | Image editing and analysis via Gemini |
| **ContextRetriever** | `subagents/core/context-retriever.md` | Generic context search across the repo |

---

## Part 3: Slash Commands

Type these directly in the OpenCode CLI. They are the primary way you interact with the system day-to-day.

### Everyday Commands

| Command | What It Does | When to Use |
|---------|-------------|-------------|
| `/commit [message]` | Analyzes staged changes, generates conventional commit with emoji, runs lint/build, pushes. Auto-stages if nothing is staged. | After finishing a feature or fix |
| `/test` | Runs the full pipeline: `pnpm type:check` → `pnpm lint` → `pnpm test`. Fixes failures and reruns until all pass. | Before committing, after changes |
| `/clean [path]` | Strips debug code, formats with Prettier, sorts imports, fixes lint errors, validates types. | When code needs cleanup |
| `/optimize [path]` | Deep performance, security, and memory analysis. Finds O(n^2) patterns, memory leaks, SQL injection, race conditions. | When optimizing existing code |
| `/context [operation]` | Context knowledge base manager. Multiple sub-operations (see below). | Managing your project knowledge |

### Context Command — Sub-Operations

| Sub-Command | What It Does |
|-------------|-------------|
| `/context` | Quick scan — finds stale summaries, suggests harvest |
| `/context harvest [path]` | Extracts knowledge from AI summaries into permanent context files |
| `/context extract from {source}` | Extracts context from docs, code, or URLs |
| `/context organize {category}` | Restructures flat files into function-based folders |
| `/context update for {topic}` | Updates context when APIs/frameworks change |
| `/context error for {error}` | Adds recurring errors to knowledge base |
| `/context create {category}` | Creates new context category with full structure |
| `/context migrate` | Copies project-intelligence from global to local install |
| `/context map` | Shows current context structure and file counts |
| `/context validate` | Checks integrity, references, file sizes |

### Project Setup Commands

| Command | What It Does | When to Use |
|---------|-------------|-------------|
| `/add-context` | Interactive 6-question wizard that captures your tech stack, API patterns, component patterns, naming conventions, coding standards, and security requirements. Generates `technical-domain.md`. | First time setting up OAC on a project. Run once, update with `--update` as patterns evolve. |
| `/build-context-system [domain]` | Full SystemBuilder interview → generates complete `.opencode` folder with agents, subagents, context, workflows, and commands for your domain. | When building a brand new AI system from scratch |

### Development Commands

| Command | What It Does | When to Use |
|---------|-------------|-------------|
| `/worktrees [create\|list\|cleanup]` | Manages git worktrees for parallel development. Can auto-create worktrees for all open PRs. | When working on multiple branches simultaneously |
| `/analyze-patterns [options]` | Scans codebase for recurring patterns, similar implementations, refactoring opportunities. | When auditing code consistency or finding duplication |
| `/validate-repo` | Validates registry integrity, file paths, component definitions, dependencies across the OAC repo. | After adding new agents/commands, before releases |

### Prompt Engineering Commands

| Command | What It Does | When to Use |
|---------|-------------|-------------|
| `/prompt-enhancer [file]` | Applies Stanford/Anthropic research patterns to optimize agent prompts. Position sensitivity, nesting limits, instruction ratios. | When improving agent prompt quality |
| `/prompt-optimizer [file]` | Advanced token reduction (30–50% savings) while preserving 100% meaning. | When agent prompts are too long/expensive |

### Meta Commands

| Command | What It Does |
|---------|-------------|
| `/commit-openagents` | Specialized commit for the OAC repo itself — validates registry, tests, changelogs |
| `/test-new-command` | Verifies that auto-detection and registry work for new commands |

---

## Part 4: Skills

Skills are specialized, reusable instruction sets that agents load on demand.

| Skill | What It Does | How It's Triggered |
|-------|-------------|-------------------|
| **context7** | Fetches up-to-date library docs via the Context7 API. Replaces stale training data with live documentation. | When any agent needs current docs for an external library |
| **context-manager** | Discovery, fetching, harvesting, extraction, compression, organization, and cleanup of project context. | Via `/context` command or ContextScout |
| **task-management** | CLI for tracking feature subtasks — status, dependencies, blocked tasks, completion, validation. | Via TaskManager subagent or when managing complex features |
| **project-orchestration** | Coordinates multi-agent workflows: context handoff between planning agents, 8-stage feature delivery, session state management. | When building features with multiple planning/execution stages |
| **smart-router-skill** | Demo/fun skill — embody movie characters (Yoda, Tony Stark, Sherlock) with themed missions. Shows how skills adapt via config. | When testing skill system or having fun |

---

## Part 5: The Context System (Your Secret Weapon)

The context system is a structured knowledge base in `.opencode/context/` that agents automatically load before working. This is what makes OAC produce code matching YOUR patterns instead of generic code.

### Structure

```
.opencode/context/
├── core/                      ← Universal standards (shared across projects)
│   ├── standards/             ← Code quality, tests, docs, security patterns
│   ├── workflows/             ← Delegation, code review, session management
│   ├── context-system/        ← How the context system itself works
│   ├── task-management/       ← Task schemas, splitting guides
│   └── guides/                ← Session resuming, etc.
├── project-intelligence/      ← YOUR project's patterns (always local)
│   ├── technical-domain.md    ← Tech stack, API patterns, naming
│   ├── business-domain.md     ← Business rules, domain concepts
│   ├── decisions-log.md       ← Architectural decisions
│   └── living-notes.md        ← Evolving project knowledge
├── development/               ← Framework-specific context
│   ├── ai/mastra-ai/          ← Mastra AI framework docs
│   ├── frontend/              ← React patterns
│   ├── backend/               ← API design, clean code
│   └── principles/            ← Clean code, API design principles
├── ui/                        ← Design system, animation, styling
│   └── web/                   ← CSS, fonts, icons, dark UI guides
├── content-creation/          ← Copywriting, content workflows
├── openagents-repo/           ← OAC repo-specific context
└── system-builder-templates/  ← Templates for generating new systems
```

### MVI Principle (Minimal Viable Information)

Every context file follows MVI to minimize token usage:
- Core concept: 1–3 sentences
- Key points: 3–5 bullets
- Minimal example: <10 lines
- Reference link: to full docs
- File size: <200 lines, scannable in <30 seconds

This achieves ~80% token reduction vs loading entire codebase context.

### How Context Resolution Works

```
1. Agent receives task
2. ContextScout scans .opencode/context/
3. Finds relevant files (e.g., standards/code-quality.md for code tasks)
4. Ranks by priority: Critical → High → Medium
5. Agent loads only what's needed (lazy loading)
6. Agent generates code matching YOUR patterns
```

**Local always wins**: If `.opencode/context/` exists in the project, global (`~/.config/opencode/context/`) is never checked.

---

## Part 6: Install Profiles

The installer offers different profiles controlling which components are installed:

| Profile | What's Included | Best For |
|---------|----------------|----------|
| **developer** (RECOMMENDED) | OpenAgent + OpenCoder, core subagents, main commands (`/commit`, `/test`, `/context`, `/clean`, `/optimize`), task-management skill, UI context, context-manager | Most developers |
| **essential** | Minimal set — just core agents and basic commands | Trying it out |
| **advanced** | Developer + additional planning subagents | Architects |
| **business** | Non-technical focus — content agents, business context | Content/business teams |
| **full** | Everything — all agents, subagents, commands, tools, plugins | Power users |

---

## Part 7: Model Configuration via OmniRoute

Your `.opencode/config.json` routes all AI requests through OmniRoute (`localhost:20128`), giving you a single dashboard to manage models:

| Model ID | Display Name | Use Case |
|----------|-------------|----------|
| `gemini-3.5` | gemini-3.5-flash(medium) | Fast, cheap tasks |
| `gemini-2.5` | gemini-2.5-pro | Complex reasoning |
| `claude` | opus-4.6(Thinking) | Deep analysis, architecture |
| `groq/openai/gpt-oss-120b` | gpt-oss | Open-source alternative |
| `groq/llama-3.3-70b-versatile` | llama-70b | Fast open-source |
| `Planner` | Planner | Planning-specific routing |
| `Executor` | Executor | Execution-specific routing |
| `reviewer` | reviewer | Code review routing |
| `agy` | agy | Current default (Antigravity) |

Change per-agent models by editing the `model:` field in any agent's markdown frontmatter.

---

## Part 8: Typical Workflows

### First-Time Setup (10 minutes)

```
1. Install:          bash install.sh developer
2. Add your patterns: /add-context
3. Start building:   opencode --agent OpenAgent
```

### Daily Development

```
1. Start session:    opencode --agent OpenCoder
2. Request feature:  "Add user profile page with avatar upload"
3. Review plan:      Agent proposes → you approve
4. Watch execution:  Agent implements using YOUR patterns
5. Validate:         Agent runs tests, type check, review
6. Ship:             /commit "feat(user): add profile page"
```

### After Finishing a Feature

```
1. Clean up:     /clean
2. Run tests:    /test
3. Commit:       /commit
4. Update context: /add-context --update (if new patterns emerged)
```

### Managing Context Over Time

```
/context harvest        ← Clean stale summaries into permanent context
/context update for Next.js 15  ← Update when frameworks change
/context organize development/  ← Restructure messy context files
/context validate       ← Check integrity
```

### Parallel Development

```
/worktrees prs          ← Create worktrees for all open PRs
/worktrees create feature/auth  ← Create worktree for specific branch
/worktrees cleanup      ← Remove stale worktrees
```

### Building a Custom AI System

```
1. opencode --agent SystemBuilder
2. "Build a customer support AI system"
3. Answer interview questions about your domain
4. Receive complete .opencode folder with custom agents, context, commands
```

---

## Part 9: Symlink Setup (This Repo)

This repo is configured so all configuration lives here and is symlinked to where tools expect it:

| What | This Project | Symlink Target |
|------|-------------|----------------|
| OpenCode config | `.opencode/` | `~/.config/opencode/` |
| OmniRoute config | `.omniroute/` | `~/.omniroute/` |

**To activate symlinks**, close the respective tool and run the setup scripts as Administrator:
- `setup-symlink.bat` — Links OpenCode config
- `setup-omniroute-symlink.bat` — Links OmniRoute config

Changes made via the OmniRoute dashboard or OpenCode CLI write directly into this project directory. Commit the non-secret files to version control for portability across machines.
