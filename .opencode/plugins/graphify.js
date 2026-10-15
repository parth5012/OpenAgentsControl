// graphify OpenCode plugin (OpenCode v2)
// Injects knowledge graph reminder before bash tool calls when graph exists.
//
// IMPORTANT: keep reminder string free of backticks/$(...) constructs.
// The hook prepends `echo "<reminder>" && <cmd>` to the user's bash command;
// backticks inside double-quoted echo will trigger bash command substitution,
// which both corrupts tool output silently and executes the graphify
// command instead of only suggesting. Plain words render fine in opencode's TUI.
import { existsSync } from "node:fs";
import { join } from "node:path";

let Plugin;
try {
  Plugin = (await import("@opencode/plugin")).Plugin;
} catch {
  Plugin = { define: (def) => def };
}

export default Plugin.define({
  id: "graphify",
  async setup(ctx) {
    let reminded = false;
    const directory = ctx.location?.directory || process.cwd();

    await ctx.tool.hook("execute.before", async (event) => {
      // 1. If the graph doesn't exist, let the agent use grep/glob normally
      if (!existsSync(join(directory, "graphify-out", "graph.json"))) return;

      // 2. BLOCK grep and glob entirely
      if (event.tool === "grep" || event.tool === "glob") {
        throw new Error(
          `[graphify instruction] Do not use the '${event.tool}' tool. ` +
          `A knowledge graph exists at graphify-out/. Please use the 'bash' tool ` +
          `to run: graphify query "<your question>"`
        );
      }

      // 3. Keep the gentle reminder for regular bash commands (only once)
      if (event.tool === "bash" && !reminded) {
        const reminderMsg =
          'echo "[graphify] knowledge graph at graphify-out/. For focused questions, run graphify query with your question (scoped subgraph, usually much smaller than GRAPH_REPORT.md) instead of grepping raw files. Read GRAPH_REPORT.md only for broad architecture context."';

        if (event.input && typeof event.input.command === "string") {
          event.input.command = `${reminderMsg} && ${event.input.command}`;
          reminded = true;
        }
      }
    });
  },
});
