#!/usr/bin/env python3
"""agent-hill-climb ratchet executor.

Counts each rule in ratchet.json and fails (exit 1) when a threshold is
crossed. Machine-parsable so agents can score without screen-scraping:

    RULE <name>: <current>/<limit> [OK|FAIL]
    RATCHET: PASS|FAIL (n violations)

Design properties:
- One command, identical local & CI behavior (same python, same rg).
- Deterministic ordering: rules sorted by name, excludes applied consistently.
- Never raises above WARN: ratchet is a gate, not a dashboard.

Usage:
    python ratchet.py [--manifest ratchet.json] [--json]
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

PY = int(sys.version_info.major), int(sys.version_info.minor)


def run(cmd: str, cwd: str) -> tuple[int, str]:
    p = subprocess.run(cmd, cwd=cwd, shell=True, capture_output=True, text=True, timeout=300)
    return p.returncode, (p.stdout or "") + (p.stderr or "")


def last_integer(text: str) -> int:
    ints = re.findall(r"(?<!\d)(\d+)(?!\d)", text)
    return int(ints[-1]) if ints else 0


def count_pattern(rule: dict, cwd: str) -> int:
    ex = rule["extractor"]
    # Prefer rg (installed and aliased on this machine); fall back to python scan
    cmd = ["rg", "--count-matches", "--no-heading", "--config-path", "/dev/null"]
    for g in ex.get("exclude_globs", []):
        cmd += ["--glob", f"!{g}/**"]
    for g in ex.get("globs", []):
        if g == "--":
            continue
        if "*" in g:
            cmd += ["--glob", g]
        else:
            cmd += ["--glob", f"{g}/**"]
    cmd += [ex["pattern"]]
    rc, out = run(" ".join(cmd), cwd)
    if rc not in (0, 1):  # rg: 0 matches found, 1 no matches, >1 error
        # fallback: python scan (portable, slower)
        total = 0
        rx = re.compile(ex["pattern"])
        exclude = set()
        for eg in ex.get("exclude_globs", []):
            for p in Path(cwd).rglob(f"*{eg}*"):
                exclude.add(p.name)
        for g in ex.get("globs", []):
            if g == "--":
                continue
            for p in Path(cwd).rglob(g):
                if any(e in p.parts for e in ex.get("exclude_globs", [])):
                    continue
                try:
                    total += len(rx.findall(p.read_text(encoding="utf-8", errors="ignore")))
                except OSError:
                    pass
        return total
    counts = [int(line.split(":")[1]) for line in out.splitlines() if ":" in line]
    return sum(counts)


def extract(rule: dict, cwd: str) -> int:
    ex = rule["extractor"]
    if ex["type"] == "command":
        rc, out = run(ex["cmd"], cwd)
        return 1 if rc != 0 and rule["kind"] == "command-fails" else last_integer(out)
    if ex["type"] == "pattern":
        return count_pattern(rule, cwd)
    if ex["type"] == "count-pattern":
        return count_pattern(rule, cwd)
    raise ValueError(f"unknown extractor type: {ex['type']}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--manifest", default="ratchet.json")
    ap.add_argument("--json", action="store_true", help="emit raw json rows instead")
    args = ap.parse_args()
    cwd = str(Path.cwd())
    manifest = json.loads(Path(args.manifest).read_text(encoding="utf-8"))

    violations = []
    rows = []
    for rule in sorted(manifest["rules"], key=lambda r: r["name"]):
        current = extract(rule, cwd)
        limit = int(rule["limit"])
        ok = current <= limit if rule["kind"] == "max" else current >= limit
        if not ok:
            violations.append(rule["name"])
        rows.append({"rule": rule["name"], "kind": rule["kind"], "current": current, "limit": limit, "ok": ok})
        print(f"RULE {rule['name']}: {current}/{limit} {'OK' if ok else 'FAIL'}")

    tail = f"RATCHET: {'FAIL' if violations else 'PASS'} ({len(violations)} violations)"
    if args.json:
        print(json.dumps({"rows": rows, "violations": violations, "tail": tail}))
    else:
        print(tail)
    return 1 if violations else 0

if __name__ == "__main__":
    sys.exit(main())
