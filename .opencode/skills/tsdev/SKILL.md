---
name: tsdev
description: Host local dev servers on the Tailscale network via serve (tailnet-only) or funnel (public). Use when user says tsdev, tailscale serve, tailscale funnel, host locally, expose port, remote access, share dev server.
version: 1.0.0
author: parth
type: skill
category: development
tags:
  - tailscale
  - serve
  - funnel
  - hosting
  - remote-access
  - dev-server
dependencies: []
---

# TSDev Skill

> **Purpose**: Expose any local port on the Tailscale network without disturbing existing services (T3 Code, OnlyRoute, etc.). Additive-only — new services mount on path prefixes, never reset.

---

## What I Do

- **Serve tailnet-only** — `tailscale serve` for MagicDNS HTTPS inside your tailnet
- **Funnel to public** — `tailscale funnel` for public internet access (ports 443/8443/10000)
- **Additive mounts** — new apps mount at `/prefix`, existing `/` mappings untouched
- **Safe status/stop** — snapshot before change, remove only your prefix on stop

Live node in this setup: `debian.tail46d59a.ts.net` (100.87.250.35).
Existing mounts preserved: `:20130→20128`, `:3000→3000`, `:443→3773`, `:5000→5000`.

---

## How to Use Me

### Quick Start

```bash
# Tailnet-only, additive on 443 path (SAFE - preserves existing /)
bash .opencode/skills/tsdev/router.sh serve 5173 --path=/myapp

# Public internet via funnel (requires funnel ACL)
bash .opencode/skills/tsdev/router.sh funnel 5173

# Check what's serving (read-only, always safe)
bash .opencode/skills/tsdev/router.sh status

# Remove ONLY your prefix (never resets others)
bash .opencode/skills/tsdev/router.sh stop --path=/myapp
```

### Command Reference

| Command | Description |
|---------|-------------|
| `serve <port> [--path=/prefix] [--https=443\|--http=80]` | Expose port on tailnet, additive via path prefix |
| `funnel <port> [--https=443]` | Expose port to public internet |
| `status [--json]` | Show serve + funnel status (read-only) |
| `stop --path=/prefix [--https=443]` | Remove only that prefix mapping |
| `help` | Show help message |

See `reference.md` for serve vs funnel matrix, path-prefix recipe, and safety rules.

---

## Safety Rules (MANDATORY)

1. **NEVER run `tailscale serve reset` or `tailscale funnel reset`** — wipes T3 Code / OnlyRoute.
2. **ALWAYS snapshot first**: `tailscale serve status --json` before any write.
3. **ALWAYS use `--path=/prefix`** for new apps on shared ports (e.g. 443).
4. **Stop removes prefix only**: `tailscale serve --https=443 /prefix off`.
5. If agent is unsure, run `status` and ask user before serving.

---

## Architecture

```
.opencode/skills/tsdev/
├── SKILL.md              # This file
├── reference.md          # Serve vs funnel, recipes, ACLs, troubleshooting
├── router.sh             # CLI router (entry point)
└── scripts/
    └── tsdev-cli.ts      # Additive-safe CLI implementation
```

---

## Examples

### Host Vite dev server for remote access

```bash
$ bash .opencode/skills/tsdev/router.sh serve 5173 --path=/vite-demo
[+] Snapshot saved (4 existing mounts preserved)
[+] Serving https://debian.tail46d59a.ts.net/vite-demo -> http://127.0.0.1:5173
```

Open on phone/laptop: `https://debian.tail46d59a.ts.net/vite-demo`

### Host API on its own tailnet port

```bash
$ bash .opencode/skills/tsdev/router.sh serve 8000 --https=8443
[+] Serving https://debian.tail46d59a.ts.net:8443 -> http://127.0.0.1:8000
```

### Teardown my app only

```bash
$ bash .opencode/skills/tsdev/router.sh stop --path=/vite-demo
[+] Removed /vite-demo only. Other mounts untouched.
```

---

## File Locations

- **Skill**: `.opencode/skills/tsdev/`
- **Router**: `.opencode/skills/tsdev/router.sh`
- **CLI**: `.opencode/skills/tsdev/scripts/tsdev-cli.ts`
- **Docs**: `.opencode/skills/tsdev/reference.md`
