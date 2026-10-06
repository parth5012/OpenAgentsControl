# Paperclip Instance Data Backup

This directory contains the exported state and database backup of the Paperclip AI instance (`default`) created on 2026-10-06.

## Contents
- `database-backup.sql.gz`: Full PostgreSQL database backup containing all schema, agents, issues, goals, comments, activity logs, and configurations.
- `companies/`: Company structures, team prompts, and agent definitions (`SOUL.md`, `TOOLS.md`, `AGENTS.md`, `HEARTBEAT.md`).
- `workspaces/`: Agent workspace states and persistent files (`MEMORY.md`, etc.).
- `storage/`: Uploaded and generated assets (e.g. agent avatars).
- `config.json`: Paperclip instance server and runtime configuration.
- `runtime-info.json`: Snapshot of the active runtime environment.

## Restoration
To restore into a fresh Paperclip setup:
1. Reinstall Paperclip: `npx paperclipai install` or `paperclipai run`
2. Restore configuration into `~/.paperclip/instances/default/config.json`
3. Restore `companies/`, `workspaces/`, and `data/storage/`
4. Unpack `database-backup.sql.gz` and restore into the instance database:
   `gunzip -c database-backup.sql.gz | psql -p <port> -U paperclip paperclip`
