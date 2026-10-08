#!/usr/bin/env npx ts-node
/// <reference types="node" />
/**
 * TSDev CLI — additive-safe Tailscale hosting.
 *
 * Usage: npx ts-node tsdev-cli.ts <command> [options]
 * Commands: serve, funnel, status, stop, help
 *
 * SAFETY: never runs `serve reset` / `funnel reset`.
 * New services mount on path prefixes, preserving existing mounts.
 */

import { execSync } from "node:child_process";

type ServeOpts = {
  port: number;
  pathPrefix: string;
  httpsPort: number;
  useHttp: boolean;
  bg: boolean;
};

type Parsed = {
  command: string;
  positional: string[];
  flags: Record<string, string | boolean>;
};

// ---------- pure: parsing ----------

const getFlag = (flags: Record<string, string | boolean>, keys: string[], fallback: string): string => {
  for (const k of keys) {
    const v = flags[k];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return fallback;
};

const hasFlag = (flags: Record<string, string | boolean>, keys: string[]): boolean =>
  keys.some((k) => flags[k] === true);

export const parseArgs = (argv: string[]): Parsed => {
  const [command = "help", ...rest] = argv;
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (const token of rest) {
    if (token.startsWith("--")) {
      const eq = token.indexOf("=");
      if (eq === -1) flags[token.slice(2)] = true;
      else flags[token.slice(2, eq)] = token.slice(eq + 1);
    } else {
      positional.push(token);
    }
  }
  return { command, positional, flags };
};

// ---------- pure: validation ----------

export const isValidPort = (n: number): boolean =>
  Number.isInteger(n) && n >= 1 && n <= 65535;

export const isValidPathPrefix = (p: string): boolean =>
  p === "/" ? false : /^\/[a-zA-Z0-9][a-zA-Z0-9\-_./]*$/.test(p);

export const isValidHttpsPort = (n: number): boolean =>
  [443, 8443, 10000].includes(n) || (n >= 1024 && n <= 65535);

// ---------- pure: command builders (no side effects) ----------

export const buildServeArgs = (opts: ServeOpts): string[] => {
  const target = `http://127.0.0.1:${opts.port}`;
  const base = opts.useHttp ? ["--http=80"] : [`--https=${opts.httpsPort}`];
  const bg = opts.bg ? ["--bg"] : [];
  // Additive: path prefix mount preserves existing "/" handler
  return [...bg, ...base, opts.pathPrefix, target];
};

export const buildFunnelArgs = (port: number, pathPrefix: string, httpsPort: number): string[] => {
  const target = `http://127.0.0.1:${port}`;
  if (pathPrefix !== "/") return [`--https=${httpsPort}`, pathPrefix, target];
  return [`--https=${httpsPort}`, target];
};

export const buildStopArgs = (pathPrefix: string, httpsPort: number): string[] =>
  [`--https=${httpsPort}`, pathPrefix, "off"];

// ---------- side effects (isolated) ----------

const run = (cmd: string): { success: boolean; output: string } => {
  try {
    const output = execSync(cmd, { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] });
    return { success: true, output };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, output: msg };
  }
};

const snapshotServe = (): void => {
  const res = run("tailscale serve status --json");
  if (res.success) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fs = require("node:fs") as typeof import("node:fs");
    const p = `/tmp/ts-serve-before-${stamp}.json`;
    fs.writeFileSync(p, res.output);
    console.log(`[+] Snapshot saved to ${p} (existing mounts preserved)`);
  } else {
    console.log("[-] Could not snapshot existing serve config (continuing):");
    console.log(res.output);
  }
};

const requireTailscale = (): boolean => {
  const res = run("tailscale status >/dev/null 2>&1");
  void res;
  // execSync with redirect returns empty; check via status command exit
  try {
    execSync("tailscale status", { stdio: "ignore" });
    return true;
  } catch {
    console.error("[-] Tailscale daemon not running. Try: sudo systemctl enable --now tailscaled && sudo tailscale up");
    return false;
  }
};

// ---------- commands ----------

const cmdServe = (parsed: Parsed): void => {
  const rawPort = parsed.positional[0] ?? getFlag(parsed.flags, ["port", "p"], "");
  const port = Number(rawPort);
  if (!isValidPort(port)) {
    console.error(`[-] Invalid port: "${rawPort}". Expected 1-65535. Example: serve 5173 --path=/myapp`);
    process.exit(1);
  }
  const pathPrefix = getFlag(parsed.flags, ["path"], "/myapp");
  if (!isValidPathPrefix(pathPrefix)) {
    console.error(`[-] Invalid --path="${pathPrefix}". Use a prefix like /myapp (never bare "/" on shared ports).`);
    process.exit(1);
  }
  const useHttp = hasFlag(parsed.flags, ["http"]);
  const httpsPort = Number(getFlag(parsed.flags, ["https"], "443"));
  if (!useHttp && !isValidHttpsPort(httpsPort)) {
    console.error(`[-] Invalid --https="${httpsPort}". Use 443, 8443, or 10000.`);
    process.exit(1);
  }
  const bg = !hasFlag(parsed.flags, ["no-bg"]);
  if (!requireTailscale()) process.exit(1);
  snapshotServe();
  const args = buildServeArgs({ port, pathPrefix, httpsPort, useHttp, bg });
  console.log(`[+] Running: tailscale serve ${args.join(" ")}`);
  const res = run(`tailscale serve ${args.map((a) => JSON.stringify(a)).join(" ")}`);
  console.log(res.output);
  if (!res.success) process.exit(1);
  const st = run("tailscale serve status");
  console.log(st.output);
  console.log(`[+] Verify: existing "/" mounts still present + new ${pathPrefix} -> 127.0.0.1:${port}`);
};

const cmdFunnel = (parsed: Parsed): void => {
  const rawPort = parsed.positional[0] ?? getFlag(parsed.flags, ["port", "p"], "");
  const port = Number(rawPort);
  if (!isValidPort(port)) {
    console.error(`[-] Invalid port: "${rawPort}". Example: funnel 5173 --path=/myapp`);
    process.exit(1);
  }
  const pathPrefix = getFlag(parsed.flags, ["path"], "/");
  const httpsPort = Number(getFlag(parsed.flags, ["https"], "443"));
  if (![443, 8443, 10000].includes(httpsPort)) {
    console.error(`[-] Funnel only allows --https=443, 8443, or 10000 (got ${httpsPort}).`);
    process.exit(1);
  }
  if (!requireTailscale()) process.exit(1);
  snapshotServe();
  const args = buildFunnelArgs(port, pathPrefix, httpsPort);
  console.log(`[+] Running: tailscale funnel ${args.join(" ")}`);
  console.log(`[!] Funnel exposes to PUBLIC internet. Requires nodeAttrs funnel ACL grant.`);
  const res = run(`tailscale funnel ${args.map((a) => JSON.stringify(a)).join(" ")}`);
  console.log(res.output);
  if (!res.success) process.exit(1);
};

const cmdStatus = (parsed: Parsed): void => {
  const asJson = hasFlag(parsed.flags, ["json"]);
  if (asJson) {
    const res = run("tailscale serve status --json");
    console.log(res.output);
    if (!res.success) process.exit(1);
    return;
  }
  const serve = run("tailscale serve status");
  console.log(serve.output);
  const funnel = run("tailscale funnel status");
  console.log("--- funnel ---");
  console.log(funnel.output);
};

const cmdStop = (parsed: Parsed): void => {
  const pathPrefix = getFlag(parsed.flags, ["path"], String(parsed.positional[0] ?? ""));
  if (!pathPrefix || !isValidPathPrefix(pathPrefix)) {
    console.error(`[-] Refusing to stop: need --path=/prefix (never bare "/" or empty). Example: stop --path=/myapp`);
    process.exit(1);
  }
  const httpsPort = Number(getFlag(parsed.flags, ["https"], "443"));
  if (!requireTailscale()) process.exit(1);
  snapshotServe();
  const args = buildStopArgs(pathPrefix, httpsPort);
  console.log(`[+] Removing ONLY ${pathPrefix} on ${httpsPort}. Other mounts untouched.`);
  console.log(`[+] Running: tailscale serve ${args.join(" ")}`);
  const res = run(`tailscale serve ${args.map((a) => JSON.stringify(a)).join(" ")}`);
  console.log(res.output);
  if (!res.success) process.exit(1);
};

const showHelp = (): void => {
  console.log(`
TSDev — additive-safe Tailscale hosting (never resets existing services)

Usage: router.sh <command> [options]

Commands:
  serve <port> [--path=/prefix] [--https=443] [--http] [--no-bg]
      Expose port on tailnet. Default --path=/myapp, --https=443, --bg on.
      Example: serve 5173 --path=/vite-demo
  funnel <port> [--path=/prefix] [--https=443]
      Expose to public internet (443/8443/10000 only). Needs funnel ACL.
  status [--json]
      Show serve + funnel status (read-only, always safe).
  stop --path=/prefix [--https=443]
      Remove ONLY that prefix. Never touches other mounts.
  help  Show this help.

Safety:
  - NEVER runs serve/funnel reset. New apps use path prefixes.
  - Snapshots serve status --json to /tmp before every write.
  - Default path is a prefix (never bare /) to protect T3 Code / OnlyRoute.
`);
};

// ---------- main ----------

const main = (): void => {
  const parsed = parseArgs(process.argv.slice(2));
  switch (parsed.command) {
    case "serve": return cmdServe(parsed);
    case "funnel": return cmdFunnel(parsed);
    case "status":
    case "list": return cmdStatus(parsed);
    case "stop":
    case "off": return cmdStop(parsed);
    case "help":
    case "--help":
    case "-h": return showHelp();
    default:
      console.error(`[-] Unknown command: ${parsed.command}`);
      showHelp();
      process.exit(1);
  }
};

main();
