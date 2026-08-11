---
description: "Sets up a project for impeccable. Runs a multi-round discovery interview and writes PRODUCT.md (users, brand, principles); offers DESIGN.md when code exists; pre-configures live mode; then recommends next commands. Use once per project."
agent: general
---

# Impeccable Init

Run Impeccable's `init` flow to capture durable product context for this project.

## Steps

1. **Load the impeccable skill** via the skill tool (`name: impeccable`). If unavailable, read `.opencode/skills/impeccable/SKILL.md` and `.opencode/skills/impeccable/reference/init.md` directly.
2. **Load current state**: run `node .opencode/skills/impeccable/scripts/context.mjs` once (keep cwd at project root). Use the PRODUCT.md path it resolves; do not create a competing authority.
3. **Explore the project** before interviewing — scan docs, copy, config, routes, roles, and dev command so the user does not repeat known facts.
4. **Interview** with the `question` tool, at most three focused rounds, on material gaps only: primary user/job, product mechanism/positioning, durable constraints/evidence. Confirm platform (`web`/`ios`/`android`/`adaptive`) only when ambiguous; on greenfield projects ask about stack once. Never ask for colors, fonts, or aesthetic direction.
5. **Write `PRODUCT.md`** at the project root using the template in `reference/init.md` (include the `impeccable:product-schema` comment verbatim). Only confirmed facts; mark undecided ones explicitly.
6. **Completion gate**: verify PRODUCT.md exists with the confirmed record before doing anything else. Do not substitute notes.
7. **Configure live mode** when the project is runnable (per `reference/live.md`); skip otherwise.
8. **Wrap up**: summarize captured and deliberately undecided facts, then recommend the next best command from actual project state.

Arguments: `$ARGUMENTS` (optional target/path to focus init on).

Never silently overwrite an existing PRODUCT.md — ask what is stale or missing first.
