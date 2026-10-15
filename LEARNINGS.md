# Learnings & Edge Cases

## OpenCode V2 Plugins
- **Dynamic Plugin Imports**: In standalone test runtimes or environments without `@opencode/plugin` pre-installed, wrapping the import in `try { Plugin = (await import("@opencode/plugin")).Plugin; } catch { Plugin = { define: (def) => def }; }` ensures the module parses and evaluates cleanly.
- **Directory Discovery**: OpenCode V2 checks both `.opencode/plugin/` and `.opencode/plugins/`. Retaining V1 files in `.opencode/plugin/` causes parse errors because V2 attempts to evaluate them. All plugins must reside exclusively under `.opencode/plugins/` using V2 exports.
- **Tool Registration**: Tool definitions in V2 use JSON schema with `editor.add({ name, description, input: { type: "object", ... }, execute: async (input, context) => { ... } })` inside `ctx.tool.transform((editor) => { ... })`.
- **Global Config Symlink**: On Windows with WSL/Git Bash, `C:/Users/DELL/.config/opencode` is symlinked to `D:/work/projects/OpenCode Setup/.opencode`. Changes made to `.opencode/` immediately reflect in the global configuration directory.
