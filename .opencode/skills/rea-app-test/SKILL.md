---
name: rea-app-test
description: "Use the REA MCP (reverse-engineering agent) plus project docs to test a running application: capture its web bundle/UI, exercise interactive flows, compare observed behavior against documented features, and report bugs/issues. Use when user says rea test, test app with rea, find bugs via rea, interactive feature check."
argument-hint: "[--url <app-url>] [--docs <path-or-glob>] [--feature <name>]"
---

# REA App Test

Use the `rea` MCP to inspect and exercise a running application, cross-referenced against project documentation, to find bugs and broken interactive features. REA never executes the app's JS during static analysis; dynamic behavior is captured via controlled scenarios.

## When to use

- An app is running (local dev server or deployed) and you want an independent bug/feature check
- You have docs describing implemented (or about-to-implement) features and want to verify them
- Interactive features (forms, buttons, navigation, state) seem off and you want evidence

## When NOT to use

- Pure code review of a diff → use `code-review` / `ocr-review`
- No running app and no build artifact → build/run first
- Need to modify code → separate task; this skill only reports

## Inputs

1. **App target**: a URL (web) or a local artifact path (Electron/ASAR/native). If a dev server isn't running, start it in the background first (see project README/scripts).
2. **Docs reference**: feature docs/specs (e.g. `docs/`, `README`, `GLOSSARY.md`, issue/PR descriptions, wayfinder tickets). Gather the list of expected features/flows.
3. **Scope** (optional): a single feature name to focus on.

## Workflow

### Step 1 — Gather expected behavior from docs

Read the relevant docs and extract a checklist of **expected features and interactive flows**:
- Pages/routes and their purpose
- User actions (clicks, form submits, navigation, toggles)
- Expected outcomes (state changes, API calls, UI updates, errors)
- Edge cases and constraints documented

Record this as the **expected-behavior checklist**. Do not invent features not in docs; mark undocumented behavior as "unspecified" (not a bug by itself).

### Step 2 — Capture the application (static)

For a web app:
- `rea.analyze_web_bundle` on the app URL → chunk graph, route/endpoint candidates, vendor fingerprints, source maps. Use to understand structure and find hidden routes/endpoints.
- `rea.discover_webmcp_tools` → passively inventory page-registered WebMCP tools (if any).
- `rea.export_web_scripts` (if needed) to retain JS bytes for deeper analysis via `rea.analyze_javascript_application`.

For Electron: `rea.capture_electron_scenario` / analyze ASAR via `rea.analyze_javascript_application`.
For native/mobile: `rea.binary_overview` + `rea.analyze_function` on relevant procedures.

### Step 3 — Exercise interactive flows (dynamic)

Use `rea.capture_browser_scenario` (web) or `rea.capture_electron_scenario` / `rea.capture_native_ui_scenario` to run the documented flows:
- Provide a start URL and a sequence of actions (click, type, wait, navigate).
- Capture network (requests/responses), console, DOM/state snapshots, screenshots.
- Keep scenarios small and focused (one flow per scenario) for clear evidence.

Use `rea.capture_web_screenshot` for before/after visual evidence.

### Step 4 — Compare observed vs expected

For each documented feature/flow:
- Did the scenario complete without errors?
- Did observed network calls match expected endpoints/payloads?
- Did UI state change as documented?
- Any console errors, failed requests, or visual regressions (use `rea.compare_web_screenshots`)?

Classify each:
- **Bug**: observed behavior contradicts docs or crashes.
- **Missing**: documented feature not present/reachable.
- **Regression**: previously-working (per docs/git) now broken.
- **Unspecified**: not in docs — note only, don't flag as bug.
- **Strength**: works as documented.

Use `rea.compare_web_captures` / `rea.find_changed_behavior` to diff before/after captures when investigating a specific change.

### Step 5 — Report

Produce a structured report:

```markdown
## REA App Test Report

**Target:** <url or artifact>
**Docs used:** <list>
**Features checked:** N

### Bugs
- **[<feature>]** <description> — evidence: <screenshot/console/network ref> — severity: high/medium/low

### Missing features
- **[<feature>]** not reachable/implemented

### Regressions
- ...

### Unspecified observations
- ...

### Working as documented
- ...

### Suggested next steps
- <concrete fixes or deeper investigation>
```

Include captured artifact references (screenshots, bundle analysis) so findings are reproducible. Do not modify code; hand fixes to the user or a coding agent.

## Rules

- **Docs are the source of truth** for expected behavior; don't flag undocumented behavior as a bug.
- **Never execute the app's JS during static analysis** (`analyze_web_bundle` parses only). Dynamic execution happens only via controlled scenarios.
- **One flow per scenario** for clear evidence.
- **Capture before/after** for any visual or state claim.
- **Report, don't fix** — this skill is read-only with respect to the app.
- If the app isn't running, start it in the background and wait for readiness before testing.

## Verification

- At least one bundle/UI capture succeeded.
- At least one interactive scenario ran (or explain why none applicable).
- Report lists bugs/missing/regressions with evidence references.
- `git status` unchanged (read-only).