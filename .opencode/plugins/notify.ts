let Plugin: any;
try {
  Plugin = (await import("@opencode/plugin")).Plugin;
} catch {
  Plugin = { define: (def: any) => def };
}

// 🔧 CONFIGURATION: Set to true to enable this plugin
const ENABLED = false;

/**
 * Notify Plugin (OpenCode v2)
 *
 * Emits a notification or audio alert when a session transitions to idle.
 */
export default Plugin.define({
  id: "notify",
  async setup(ctx: any) {
    if (!ENABLED) return;

    const controller = new AbortController();

    if (ctx.event?.subscribe) {
      void (async () => {
        try {
          for await (const event of ctx.event.subscribe({ signal: controller.signal })) {
            if (event?.type === "session.idle") {
              console.log("Your code is done!");
            }
          }
        } catch {
          // Aborted or finished
        }
      })();
    }

    return () => controller.abort();
  },
});
