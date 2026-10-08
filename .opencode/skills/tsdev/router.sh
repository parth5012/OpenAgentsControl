#!/usr/bin/env bash
#############################################################################
# TSDev Skill Router — additive-safe Tailscale hosting
# Never resets existing serve/funnel config. New apps mount on path prefixes.
#############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_SCRIPT="$SCRIPT_DIR/scripts/tsdev-cli.ts"

show_help() {
  cat << 'HELP'
TSDev — host local servers on Tailscale (additive, safe)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Usage: router.sh [COMMAND] [OPTIONS]

COMMANDS:
  serve <port> [--path=/prefix] [--https=443] [--http] [--no-bg]
      Expose port on tailnet (default path /myapp, https 443, bg on)
  funnel <port> [--path=/prefix] [--https=443]
      Expose to public internet (443/8443/10000 only, needs funnel ACL)
  status [--json]         Show serve + funnel status (read-only, safe)
  list [--json]           Alias for status
  stop --path=/prefix [--https=443]
      Remove ONLY that prefix (never resets others)
  help                    Show this help

EXAMPLES:
  ./router.sh status
  ./router.sh serve 5173 --path=/vite-demo
  ./router.sh serve 8000 --https=8443 --path=/api
  ./router.sh funnel 5173 --path=/demo
  ./router.sh stop --path=/vite-demo

SAFETY:
  ✓ Additive only — new services on path prefixes
  ✓ Snapshots serve status --json to /tmp before writes
  ✓ Never runs serve reset / funnel reset
  ✓ Preserves T3 Code (:3000), OnlyRoute (:20130), :443, :5000

For more info, see: .opencode/skills/tsdev/SKILL.md
HELP
}

if [ ! -f "$CLI_SCRIPT" ]; then
  echo "❌ Error: tsdev-cli.ts not found at $CLI_SCRIPT"
  exit 1
fi

find_project_root() {
  local dir
  dir="$(pwd)"
  while [ "$dir" != "/" ]; do
    if [ -e "$dir/.git" ] || [ -f "$dir/package.json" ]; then
      echo "$dir"
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  pwd
  return 0
}

if [ "$1" = "help" ] || [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
  show_help
  exit 0
fi

if [ $# -eq 0 ]; then
  show_help
  exit 0
fi

PROJECT_ROOT="$(find_project_root)"
if command -v bun >/dev/null 2>&1; then
  cd "$PROJECT_ROOT" && bun run "$CLI_SCRIPT" "$@"
else
  cd "$PROJECT_ROOT" && npx ts-node "$CLI_SCRIPT" "$@"
fi
