---
name: serve-html
description: Host HTML files or reports on Parth's cron-system project so they are viewable anywhere including mobile. Use when the user says "serve html", "host this report", "put this online", "share this html", "make this viewable on mobile", or wants any local HTML artifact published to a public URL.
---

# Serve HTML

Publishes local HTML files/reports on the cron-system project so Parth can open them
from any device via a public URL.

## Targets

- Hosted base URL: **https://cron-system.vercel.app/**
- Local project: `D:\work\projects\cron-system`
- Repo: `github.com/parth5012/cron-system`, branch `main`, auto-deploys on push

## Workflow

1. Copy the HTML files into `D:\work\projects\cron-system\static\<name>\`.
   - `<name>` is a short lowercase slug for the content (e.g., `findings`, `report-sih`).
2. If that folder is not already mounted, add to `main.py`:
   ```python
   from fastapi.staticfiles import StaticFiles
   app.mount("/<name>", StaticFiles(directory="static/<name>", html=True), name="<name>")
   ```
3. Verify locally with FastAPI TestClient before pushing:
   ```python
   from fastapi.testclient import TestClient
   from main import app
   client = TestClient(app)
   assert client.get("/health").status_code == 200
   r = client.get("/<name>/")
   assert r.status_code == 200 and len(r.content) > 1000
   ```
4. Commit ONLY `main.py` + `static/<name>/`. Never commit `.env`, caches,
   or unrelated working-tree files.
5. Push to `origin/main`. This triggers auto-deploy (implies push permission —
   the user asking to serve html IS the push request).
6. Wait for deploy, then verify with:
   ```powershell
   Invoke-WebRequest -Uri 'https://cron-system.vercel.app/<name>/' -UseBasicParsing
   ```
7. Hand over the final URL: **https://cron-system.vercel.app/<name>/**

## Rules

- Only host non-sensitive content. Everything under `static/` is public.
- Multi-page reports: keep relative links intact by copying the whole folder.
- If a deploy check fails with 404, wait ~90s and re-check; Vercel deploys lag behind git push.
- Existing example: SIH 2026 findings report lives at `/findings`.
