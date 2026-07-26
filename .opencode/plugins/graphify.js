// graphify OpenCode plugin
// Injects knowledge graph reminder before bash tool calls when graph exists.
//
// IMPORTANT: keep reminder string free of backticks/$(...) constructs.
// The hook prepends `echo "<reminder>" && <cmd>` to the user's bash command;
// backticks inside double-quoted echo will trigger bash command substitution,
// which both corrupts tool output silently and executes the graphify
// command instead of only suggesting. Plain words render fine in opencode's TUI.
import { existsSync } from "fs";
import { join } from "path";

export const GraphifyPlugin = async ({ directory }) => {
  let reminded = false;

  return {
    "tool.execute.before": async (input, output) => {
      if (reminded) return;
      if (!existsSync(join(directory, "graphify-out", "graph.json"))) return;

      if (input.tool === "bash") {
        output.args.command =
          'echo "[graphify] knowledge graph exists in graphify-out/. For focused questions, run graphify query \\"<question>\\" (scoped subgraph, much smaller than GRAPH_REPORT.md) instead of grepping raw files. Read GRAPH_REPORT.md only for broad architecture context." && ' +
          output.args.command;
        reminded = true;
      }
    },
  };
};
