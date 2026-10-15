# Project Decisions

## OpenCode Plugin Migration to V2 Architecture

### Context
OpenCode V2 introduces breaking changes to the plugin system:
- Legacy V1 plugin format returned a single object containing tools and hooks.
- V2 plugins use `Plugin.define({ id, setup(ctx) })` where hooks, tools, and events are registered through the `ctx` context object.
- Configuration key in `opencode.json` moved from `"plugin"` to `"plugins"`.
- Standard directory moved from `.opencode/plugin/` to `.opencode/plugins/`.

### Decisions
1. **Remove `claude-mem` and `task-timing`**:
   - Completely deleted all references, configuration, and implementation files for `task-timing` and `claude-mem`.
   - Removed Claude-Mem Memory Context header and instructions block from `AGENTS.md`.

2. **Standardize All Active Plugins on V2 `Plugin.define`**:
   - `graphify.js`: Migrated to `Plugin.define` using `ctx.tool.hook("execute.before")`.
   - `open-code-review.ts`: Migrated to `Plugin.define` registering `ocr_review` and `ocr_health` via `ctx.tool.transform`, with safe fallback for `ctx.command`.
   - `coder-verification/index.ts`: Migrated to `Plugin.define` using `ctx.tool.hook("execute.before")` and `ctx.tool.hook("execute.after")`.
   - `agent-validator.ts`: Migrated to `.opencode/plugins/agent-validator.ts` with V2 `Plugin.define`, utilizing `ctx.tool.transform` for all 8 validator tools, `ctx.tool.hook` for tool monitoring, `ctx.session.hook("prompt")`, and `ctx.event.subscribe`.
   - `notify.ts`: Migrated to `.opencode/plugins/notify.ts` with V2 `Plugin.define` and `ctx.event.subscribe`.

3. **Configuration**:
   - Converted `.opencode/opencode.json` from `"plugin"` to `"plugins"`.
   - Verified symlink binding (`~/.config/opencode` -> `.opencode`) ensures consistency across local and global environments.
