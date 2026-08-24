# DECISIONS

## Architectural & Design Tradeoff Decisions

> Track significant architectural and design decisions here. Each entry captures the context, alternatives considered, chosen path, and rationale.

<!-- Add new decisions below this line -->

| # | Date | Decision | Alternatives Considered | Rationale | Status |
|---|------|----------|------------------------|-----------|--------|
| 1 | 2026-08-13 | OpenCode project setup with Impeccable skill | Use standalone design system vs skill-based | Skill approach integrates directly with agent workflows, reduces context switching | Accepted |
| 2 | 2026-08-23 | visual-findings: keep V5 refined-ops + V6 kanban as first canonical templates; expand with Linear/Supabase/Stripe/GitHub-inspired variants for user vote | Ship single generic style (status quo) | User explicitly rejected generic style + loud variants (V1-V4); wants readable structured dashboards | Accepted |
| 3 | 2026-08-23 | visual-findings: modular style architecture in scripts/styles/ with dynamic CLI import and built-in TDD test harness | Monolithic generate.mjs with hardcoded HTML | Dynamic modules allow individual style maintenance; node:test harness prevents XSS & rendering regressions | Accepted |
| 4 | 2026-08-23 | visual-findings: support optional url/href/link field rendering 1-click target="_blank" links in dashboards & detail views | Only display static file:line strings | Codebase URLs, GitHub permalinks, bug trackers, and research links require 1-click navigation | Accepted |
