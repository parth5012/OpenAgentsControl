# TSDev Reference

Detailed serve vs funnel guide, additive-mount recipe, and troubleshooting.
Keep SKILL.md concise — load this file when planning a serve/funnel operation.

---

## 1. Serve vs Funnel Matrix

| Aspect | `tailscale serve` | `tailscale funnel` |
|--------|-------------------|--------------------|
| Audience | Tailnet only (your devices + shared users) | Public internet (anyone with URL) |
| TLS | Auto-provisioned via MagicDNS | Auto-provisioned via edge relays |
| Ports | Any serve port (80/443/3000/8443/10000/etc) | Only 443, 8443, 10000 |
| DNS | `https://<node>.<tailnet>.ts.net[:port][/prefix]` | Same, routed via Tailscale edge |
| ACL | Tailnet ACLs apply | Requires `nodeAttrs: funnel` grant |
| Use when | Remote dev access from your phone/laptop | Demos, webhooks, public previews |

Current node: `debian.tail46d59a.ts.net` (100.87.250.35, v1.102.4).

---

## 2. Existing Mounts (DO NOT TOUCH)

Snapshot from `2026-10-08` — `tailscale serve status --json`:

```json
{
  "TCP": {
    "20130": { "HTTP": true },
    "3000": { "HTTP": true },
    "443": { "HTTPS": true },
    "5000": { "HTTP": true }
  },
  "Web": {
    "debian.tail46d59a.ts.net:20130": { "Handlers": { "/": { "Proxy": "http://127.0.0.1:20128" } } },
    "debian.tail46d59a.ts.net:3000": { "Handlers": { "/": { "Proxy": "http://127.0.0.1:3000" } } },
    "debian.tail46d59a.ts.net:443": { "Handlers": { "/": { "Proxy": "http://localhost:3773" } } },
    "debian.tail46d59a.ts.net:5000": { "Handlers": { "/": { "Proxy": "http://127.0.0.1:5000" } } }
  }
}
```

Rule: new apps go on **path prefixes of 443** or **fresh ports** — never overwrite `/`.

---

## 3. Additive-Mount Recipe (SAFE)

### 3a. New app on shared 443 via path prefix (preferred)

```bash
# 1. Snapshot (mandatory)
tailscale serve status --json > /tmp/ts-serve-before.json

# 2. Add prefix mount (does NOT touch existing /)
tailscale serve --https=443 /myapp http://127.0.0.1:5173

# 3. Verify both old + new present
tailscale serve status
# Expect: / -> localhost:3773 STILL THERE, plus /myapp -> 127.0.0.1:5173

# 4. Open remotely
# https://debian.tail46d59a.ts.net/myapp
```

To run in background/persist across CLI sessions, add `--bg`:
```bash
tailscale serve --bg --https=443 /myapp http://127.0.0.1:5173
```

### 3b. New app on its own port (isolated)

```bash
tailscale serve --https=8443 http://127.0.0.1:8000
# -> https://debian.tail46d59a.ts.net:8443
```

### 3c. Public via funnel (needs ACL)

ACL grant required in tailnet policy:
```json
{
  "nodeAttrs": [{ "target": ["autogroup:member", "tag:server"], "attr": ["funnel"] }]
}
```

Then:
```bash
tailscale funnel --https=443 /myapp http://127.0.0.1:5173
tailscale funnel status
```

### 3d. Teardown ONLY your prefix

```bash
# Removes /myapp only — leaves / and other prefixes intact
tailscale serve --https=443 /myapp off

# Verify
tailscale serve status
```

FORBIDDEN (wipes everything):
```bash
# NEVER DO THESE without explicit user approval:
tailscale serve reset
tailscale funnel reset
tailscale serve --https=443 off   # removes ALL of 443 including /
```

---

## 4. CLI Mapping (tsdev-cli.ts)

| Skill command | Underlying Tailscale command |
|---------------|------------------------------|
| `serve 5173 --path=/myapp` | `tailscale serve --https=443 /myapp http://127.0.0.1:5173` |
| `serve 8000 --https=8443` | `tailscale serve --https=8443 http://127.0.0.1:8000` |
| `funnel 5173` | `tailscale funnel --https=443 http://127.0.0.1:5173` |
| `status` | `tailscale serve status` + `tailscale funnel status` |
| `status --json` | `tailscale serve status --json` |
| `stop --path=/myapp` | `tailscale serve --https=443 /myapp off` |

---

## 5. Certs for Custom Servers (NGINX/Caddy)

If bypassing `serve` and terminating TLS yourself:
```bash
sudo tailscale cert \
  --cert-file=/etc/ssl/certs/app.crt \
  --key-file=/etc/ssl/private/app.key \
  debian.tail46d59a.ts.net
```

---

## 6. Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `permission denied` on serve | Needs root for 443/funnel | Use `sudo tailscale serve ...` |
| `funnel not enabled` | ACL missing funnel attr | Add nodeAttrs funnel grant, then retry |
| `address already in use` | Path `/` already taken on that port | Use `--path=/unique-prefix` or different `--https` port |
| Served URL 404 on prefix | App expects `/` root, got `/prefix` | Add proxy rewrite or serve on dedicated port instead |
| Lost previous mounts | Someone ran `reset` | Restore from `/tmp/ts-serve-before.json` snapshot manually |
| `tailscaled not running` | Daemon down | `sudo systemctl enable --now tailscaled && sudo tailscale up` |

---

## 7. Agent Checklist (before every serve)

- [ ] Ran `status` and read existing mounts?
- [ ] Chose unused `--path=/prefix` or unused port?
- [ ] Snapshot `serve status --json` saved?
- [ ] Used `--bg` for persistence if long-lived?
- [ ] After serve, verified old mounts still present?
- [ ] Gave user full `https://...` URL with prefix?

Never `reset`. Always additive.
