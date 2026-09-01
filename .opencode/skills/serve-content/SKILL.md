---
name: serve-content
description: Publish HTML files, images, videos, and PDFs on the cron-system project so they are viewable anywhere including mobile. Use when the user says "serve", "host", "publish", "put this online", "share this", "make this viewable on mobile", or wants any local content published to a public URL.
---

# Serve Content

Publishes local HTML, images, videos, and PDFs on the cron-system project
so Parth can open them from any device via a public URL.

## Targets

- Hosted base URL: **https://cron-system.vercel.app/**
- Local project: `D:\work\projects\cron-system`
- Repo: `github.com/parth5012/cron-system`, branch `main`, auto-deploys on push
- Supported formats: HTML, PNG, JPG, GIF, WEBP, MP4, WEBM, MOV, PDF

## Workflow (Publish)

1. Copy files into `D:\work\projects\cron-system\static\<slug>\`.
   - `<slug>` is a short lowercase slug for the content (e.g., `findings`, `report-sih`, `screenshots`).
2. Commit ONLY `static/<slug>/`. No `main.py` edits needed — server auto-discovers static directories.
3. Push to `origin/main`. This triggers auto-deploy.
4. Verify deployment:
   ```powershell
   Invoke-WebRequest -Uri 'https://cron-system.vercel.app/admin/static/<slug>/status' -UseBasicParsing
   ```
   Check that `file_count` and `total_bytes` match what was pushed locally.
5. Hand over the final URL: **https://cron-system.vercel.app/<slug>/**

## Workflow (Teardown)

1. API teardown (removes from live server immediately):
   ```powershell
   Invoke-WebRequest -Uri 'https://cron-system.vercel.app/admin/static/<slug>' -Method DELETE -Headers @{'X-Admin-Secret'='<secret>'} -UseBasicParsing
   ```
2. Permanent removal (also remove from git):
   ```powershell
   git rm -r static/<slug>/
   git commit -m 'chore: remove static/<slug>'
   git push origin main
   ```

## Verification

- List all deployed content: `GET /admin/static`
- Check specific slug health: `GET /admin/static/<slug>/status`
- Compare local file count vs deployed file count before declaring success.

## Web Upload (Alternative)

Users can upload files directly from the index page at
https://cron-system.vercel.app/ — files go to `static/uploads/`.

- Supported: HTML, images, videos, PDFs (50MB max per file)
- Password-gated via browser prompt
- **Note**: Web uploads are ephemeral (lost on redeploy) until GitHub API persistence is implemented.

## Future: GitHub API Persistence for Web Uploads

To make web uploads permanent, implement in `main.py`:
1. Add `GITHUB_TOKEN` env var (Personal Access Token with repo scope)
2. After saving file to disk, also commit via GitHub Contents API:
   ```
   PUT /repos/parth5012/cron-system/contents/static/uploads/{filename}
   ```
   with base64-encoded content and commit message.
3. This triggers a Vercel redeploy, making the file permanent.

## Rules

- Only host non-sensitive content. Everything under `static/` is public.
- Multi-page reports: keep relative links intact by copying the whole folder.
- If a deploy check fails with 404, wait ~90s and re-check; Vercel deploys lag behind git push.
- Existing content: SIH 2026 findings at `/findings`, SIH architecture at `/sih-arch`.
