let Plugin: any;
try {
  Plugin = (await import("@opencode/plugin")).Plugin;
} catch {
  Plugin = { define: (def: any) => def };
}

/**
 * CoderAgent Assistant Plugin (OpenCode v2)
 *
 * Actively monitors and validates CoderAgent delegations.
 */
export default Plugin.define({
  id: "coder-verification",
  async setup(ctx: any) {
    // Hook 1: Before CoderAgent starts
    await ctx.tool.hook("execute.before", async (event: any) => {
      const toolName = event.tool;
      const args = event.input;
      if (
        (toolName === "task" || toolName === "subagent") &&
        (args?.subagent_type === "CoderAgent" || args?.agent === "CoderAgent" || args?.agent === "subagents/code/coder-agent")
      ) {
        console.log("\n🤖 CoderAgent Assistant: Monitoring started");
      }
    });

    // Hook 2: After CoderAgent completes
    await ctx.tool.hook("execute.after", async (event: any) => {
      const toolName = event.tool;
      const args = event.input;
      if (
        (toolName === "task" || toolName === "subagent") &&
        (args?.subagent_type === "CoderAgent" || args?.agent === "CoderAgent" || args?.agent === "subagents/code/coder-agent")
      ) {
        const result = typeof event.output === "string" ? event.output : JSON.stringify(event.output || "");

        // Check for self-review
        const hasSelfReview =
          result.includes("Self-Review") ||
          result.includes("✅ Types clean");

        // Check for deliverables
        const hasDeliverables =
          result.includes("Deliverables:") ||
          result.includes("created");

        console.log("\n🤖 CoderAgent Assistant: Validation");
        console.log(`   Self-Review: ${hasSelfReview ? "✅" : "⚠️"}`);
        console.log(`   Deliverables: ${hasDeliverables ? "✅" : "⚠️"}`);
      }
    });
  },
});
