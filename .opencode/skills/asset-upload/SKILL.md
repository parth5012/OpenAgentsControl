---
name: asset-upload
description: "Upload any local file asset (screenshot, image, audio, video, text, zip, pdf) to a free anonymous host via .opencode/scripts/upload.ts and return the public URL. Use when user says upload, push asset, share file/screenshot, give me the URL, or when you generated an artifact the user should see."
---
# Asset Upload

Turn any generated or fetched asset into a shareable public URL for the user. Handles screenshots, images, audio, video, text, PDFs, archives — any file type. No account needed.

## When to use

- User asks "upload this", "share this file", "give me the URL".
- You (agent) generated/edited an artifact (screenshot via image tools, audio, PDF, export) and the user should see or download it.
- User hands you a URL and wants it passed back out (passthrough).

## Workflow

1. **Locate the file**
   - If a file path was given, use it. If an artifact was just generated in this session, find it on disk (e.g. `generated-images/...`, screenshots from image tools, exported files).
   - Verify it exists: `Test-Path -LiteralPath <path>`.

2. **Upload**
   - Run: `npx ts-node .opencode/scripts/upload.ts <file-path>`
   - Default host `catbox` is permanent and supports any type up to 200MB.
   - Large files (>200MB) or temporary needs: re-run with `--host litterbox` (temp up to 1GB) or `--host 0x0` (expires ~30d, up to 512MB). Choose based on file size — do not guess, check the size first.
   - The script prints only the final public URL to stdout — capture it.

3. **Report to user**
   - Show the URL to the user with a one-line description of what it is.
   - If it is an image the user asked to "see", also offer the local path so they can open it directly.

## Rules

- Never claim an upload succeeded unless the script printed a URL and exited 0.
- Never upload secrets, credentials, `.env`, or private keys. If asked, refuse and explain.
- Never rewrite or modify the file before upload; upload as-is.
- If upload fails on the default host, retry once with `--host 0x0` before reporting failure.
- Anonymous hosts are public — warn the user when the content is sensitive.

## Verification

After upload, confirm the printed URL begins with `https://` and return it to the user unmodified.