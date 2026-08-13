#!/usr/bin/env npx ts-node
/**
Upload asset to a free anonymous file host and print the public URL on stdout.

Usage:
  npx ts-node .opencode/scripts/upload.ts <file-path>
  npx ts-node .opencode/scripts/upload.ts <file-path> --host catbox|litterbox|0x0
  npx ts-node .opencode/scripts/upload.ts <url>           # passthrough: just echoes the URL back

Hosts (free, no account, curl/API friendly):
  catbox.moe     permanent, any type, max 200MB, anonymous (best default)
  litterbox.catbox.moe  temporary (1h/12h/24h/72h), any type, max 1GB
  0x0.st         expires after ~30 days, max 512MB, returns deletion token optionally

Prints only the resulting public URL to stdout so agents can capture it.
*/

import * as FS from 'node:fs';
import * as PATH from 'node:path';
export {};

const ARG = process.argv.slice(2);
const TARGET = ARG[0];
const HOST_FLAG = ARG.indexOf('--host');
const HOST = HOST_FLAG >= 0 ? (ARG[HOST_FLAG + 1] ?? 'catbox') : 'catbox';

if (!TARGET) {
  console.error('usage: upload.ts <file-path|url> [--host catbox|litterbox|0x0]');
  process.exit(2);
}

// URL passthrough
if (/^https?:\/\//i.test(TARGET)) {
  console.log(TARGET);
  process.exit(0);
}

const FILE = PATH.resolve(TARGET);
if (!FS.existsSync(FILE)) {
  console.error(`upload error: file not found: ${TARGET}`);
  process.exit(2);
}

const MIME = 'application/octet-stream';
const TOKEN = new URLSearchParams();

async function uploadCatbox(file: string, body: FormData): Promise<string> {
  const res = await fetch('https://catbox.moe/user/api.php', {
    method: 'POST',
    body,
  });
  const text = (await res.text()).trim();
  if (!res.ok || !/^https?:/.test(text)) {
    throw new Error(`catbox: ${res.status} ${text.slice(0, 200)}`);
  }
  return text;
}

async function upload0x0(file: string, body: FormData): Promise<string> {
  const res = await fetch('https://0x0.st', { method: 'POST', body });
  const text = (await res.text()).trim();
  if (!res.ok || !/^https?:/.test(text)) {
    throw new Error(`0x0.st: ${res.status} ${text.slice(0, 200)}`);
  }
  return text;
}

async function main() {
  const data = FS.readFileSync(FILE);
  const name = PATH.basename(FILE);
  const form = new FormData();
  form.append('fileToUpload', new Blob([data]), name);
  form.append('reqtype', 'fileupload');

  let url = '';
  if (HOST === '0x0') {
    const f = new FormData();
    f.append('file', new Blob([data]), name);
    url = await upload0x0(FILE, f);
  } else if (HOST === 'litterbox') {
    const f = new FormData();
    f.append('reqtype', 'fileupload');
    f.append('time', '72h');
    f.append('fileToUpload', new Blob([data]), name);
    const res = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
      method: 'POST',
      body: f,
    });
    const text = (await res.text()).trim();
    if (!res.ok || !/^https?:/.test(text)) throw new Error(`litterbox: ${res.status} ${text.slice(0, 200)}`);
    url = text;
  } else {
    url = await uploadCatbox(FILE, form);
  }

  console.log(url);
}

main().catch((err) => {
  console.error(`upload error: ${err.message}`);
  process.exit(1);
});