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
      // 1. If the graph doesn't exist, let the agent use grep/glob normally
      if (!existsSync(join(directory, "graphify-out", "graph.json"))) return;

      // 2. BLOCK grep and glob entirely
      if (input.tool === "grep" || input.tool === "glob") {
        // Throwing an error cancels the tool execution and sends this exact
        // message back to the agent so it knows how to fix its mistake.
        throw new Error(
          `[graphify instruction] Do not use the '${input.tool}' tool. ` +
          `A knowledge graph exists at graphify-out/. Please use the 'bash' tool ` +
          `to run: graphify query "<your question>"`
        );
      }

      // 3. Keep the gentle reminder for regular bash commands (only once)
      if (input.tool === "bash" && !reminded) {
        const reminderMsg = 'echo "[graphify] knowledge graph at graphify-out/. For focused questions, run graphify query with your question (scoped subgraph, usually much smaller than GRAPH_REPORT.md) instead of grepping raw files. Read GRAPH_REPORT.md only for broad architecture context."';

        output.args.command = `${reminderMsg} && ${output.args.command}`;
        reminded = true;
      }
    },
  };
};
