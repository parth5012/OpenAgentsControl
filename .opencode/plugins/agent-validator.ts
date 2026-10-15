import { writeFile } from "node:fs/promises"
import path from "node:path"

let Plugin: any;
try {
  Plugin = (await import("@opencode/plugin")).Plugin;
} catch {
  Plugin = { define: (def: any) => def };
}

/**
 * Helper function to check if a message contains approval request language
 */
function checkForApprovalLanguage(msg: any): boolean {
  if (!msg.parts) return false

  const approvalKeywords = [
    "approval",
    "approve",
    "proceed",
    "confirm",
    "permission",
    "before proceeding",
    "should i",
    "may i",
    "can i proceed",
  ]

  for (const part of msg.parts) {
    if (part.type === "text" && part.text) {
      const text = part.text.toLowerCase()
      if (approvalKeywords.some(keyword => text.includes(keyword))) {
        return true
      }
    }
  }

  return false
}

/**
 * Helper function to check if a user message contains approval response
 */
function checkForUserApproval(msg: any): boolean {
  if (!msg.parts) return false

  const userApprovalKeywords = [
    "proceed",
    "approved",
    "yes",
    "go ahead",
    "ok",
    "okay",
    "sure",
    "do it",
    "continue",
  ]

  for (const part of msg.parts) {
    if (part.type === "text" && part.text) {
      const text = part.text.toLowerCase().trim()
      if (userApprovalKeywords.some(keyword => text === keyword || text.includes(keyword))) {
        return true
      }
    }
  }

  return false
}

export interface ValidationCheck {
  rule: string
  passed: boolean
  severity: "critical" | "warning" | "info"
  details: string
  suggestion?: string
}

export interface AgentValidationReport {
  agent: string
  timestamp: number
  overallStatus: "passed" | "failed" | "warning"
  checks: ValidationCheck[]
  summary: {
    totalChecks: number
    passed: number
    failed: number
    warnings: number
  }
}

/**
 * Agent Validation Plugin (OpenCode v2)
 *
 * Validates that agents follow their defined prompts and execution rules.
 * Tracks tool calls, approval gates, delegation decisions, and critical rule compliance.
 */
export default Plugin.define({
  id: "agent-validator",
  async setup(ctx: any) {
    // Track agent behavior in real-time
    const behaviorLog: Array<{
      timestamp: number
      sessionID: string
      agent: string
      event: string
      data: any
    }> = []

    // Track tool execution for approval gate validation
    const toolExecutionTracker = new Map<string, {
      approvalRequested: boolean
      toolsExecuted: string[]
      timestamp: number
    }>()

    // Track current agent for each session
    const sessionAgentTracker = new Map<string, string>()

    // Helper to retrieve session messages across V2 API versions
    async function getSessionMessages(sessionID: string): Promise<any[]> {
      try {
        if (typeof ctx.session?.context === "function") {
          const res = await ctx.session.context({ sessionID })
          if (Array.isArray(res)) return res
          if (res && Array.isArray(res.messages)) return res.messages
        }
        if (typeof ctx.session?.messages === "function") {
          const res = await ctx.session.messages({ path: { id: sessionID }, sessionID })
          if (Array.isArray(res?.data)) return res.data
          if (Array.isArray(res)) return res
        }
      } catch (err) {
        // Fallback or empty
      }
      return []
    }

    // Subscribe to events if event stream is available
    const abortController = new AbortController()
    if (ctx.event?.subscribe) {
      void (async () => {
        try {
          for await (const event of ctx.event.subscribe({ signal: abortController.signal })) {
            if (event?.type === "message.updated" || event?.type === "message.created") {
              const msg = event.properties?.info || event.message || event.data
              if (msg && msg.sessionID) {
                behaviorLog.push({
                  timestamp: Date.now(),
                  sessionID: msg.sessionID,
                  agent: msg.role === "user" ? (msg.agent || "user") : (msg.agent || "assistant"),
                  event: "message_created",
                  data: {
                    messageID: msg.id,
                    role: msg.role,
                  },
                })
              }
            }
          }
        } catch {
          // Stream completed or aborted
        }
      })()
    }

    // Monitor prompt admission / agent tracking
    if (ctx.session?.hook) {
      try {
        await ctx.session.hook("prompt", (event: any) => {
          const sessionID = event.sessionID
          const agent = event.prompt?.agents?.[0] || event.agent
          if (sessionID && agent) {
            sessionAgentTracker.set(sessionID, agent)
          }
        })
      } catch {
        // Ignore if prompt hook unsupported
      }
    }

    // Monitor tool execution: before
    if (ctx.tool?.hook) {
      await ctx.tool.hook("execute.before", async (event: any) => {
        const tool = event.tool
        const input = event.input || {}
        const sessionID = event.sessionID || event.context?.sessionID || "unknown"
        const callID = event.callID || `${Date.now()}`

        const currentAgent = sessionAgentTracker.get(sessionID) || "unknown"

        // Track context file reads
        if (tool === "read") {
          const filePath = input.filePath || input.target_file || input.path
          if (filePath && typeof filePath === "string" && filePath.includes(".opencode/")) {
            behaviorLog.push({
              timestamp: Date.now(),
              sessionID,
              agent: currentAgent,
              event: "context_file_read",
              data: {
                tool: "read",
                filePath,
                callID,
              },
            })
          }
        }

        // Track execution tools that require approval
        const executionTools = ["bash", "write", "edit", "task"]
        if (executionTools.includes(tool)) {
          const tracker = toolExecutionTracker.get(sessionID) || {
            approvalRequested: false,
            toolsExecuted: [],
            timestamp: Date.now(),
          }

          const messages = await getSessionMessages(sessionID)
          const recentMessages = messages.slice(-5)
          for (let i = 0; i < recentMessages.length; i++) {
            const msg = recentMessages[i]
            const role = msg.info?.role || msg.role
            if (role === "assistant" && checkForApprovalLanguage(msg)) {
              if (i + 1 < recentMessages.length) {
                const nextMsg = recentMessages[i + 1]
                const nextRole = nextMsg.info?.role || nextMsg.role
                if (nextRole === "user" && checkForUserApproval(nextMsg)) {
                  tracker.approvalRequested = true
                  break
                }
              }
            }
          }

          tracker.toolsExecuted.push(tool)
          toolExecutionTracker.set(sessionID, tracker)

          behaviorLog.push({
            timestamp: Date.now(),
            sessionID,
            agent: currentAgent,
            event: "execution_tool_called",
            data: {
              tool,
              callID,
              args: input,
              approvalRequested: tracker.approvalRequested,
            },
          })
        }
      })

      // Monitor tool execution: after
      await ctx.tool.hook("execute.after", async (event: any) => {
        const tool = event.tool
        const sessionID = event.sessionID || event.context?.sessionID || "unknown"
        const currentAgent = sessionAgentTracker.get(sessionID) || "unknown"

        behaviorLog.push({
          timestamp: Date.now(),
          sessionID,
          agent: currentAgent,
          event: "tool_executed",
          data: {
            tool,
            status: event.status,
            output: event.output,
          },
        })
      })
    }

    // Register validator tools
    if (ctx.tool?.transform) {
      await ctx.tool.transform((editor: any) => {
        // 1. validate_session
        editor.add({
          name: "validate_session",
          description: "Validate that the current agent session is following its defined prompt rules and execution patterns. Returns a detailed validation report.",
          input: {
            type: "object",
            properties: {
              include_details: {
                type: "boolean",
                description: "Include detailed evidence for each validation check",
              },
            },
          },
          execute: async (args: any, context: any) => {
            const sessionID = context?.sessionID || "unknown"
            try {
              const messages = await getSessionMessages(sessionID)
              const validation = await validateAgentSession(messages, behaviorLog, args?.include_details || false)
              return { content: formatValidationReport(validation) }
            } catch (err: any) {
              return { content: `Error during validation: ${err.message}` }
            }
          },
        })

        // 2. check_approval_gates
        editor.add({
          name: "check_approval_gates",
          description: "Check if approval gates were properly enforced before execution operations (bash, write, edit, task). Returns compliance status.",
          input: {
            type: "object",
            properties: {},
          },
          execute: async (_args: any, context: any) => {
            const sessionID = context?.sessionID || "unknown"
            const tracker = toolExecutionTracker.get(sessionID)

            if (!tracker) {
              return { content: "No execution operations tracked in this session." }
            }

            const { approvalRequested, toolsExecuted } = tracker
            const violations = approvalRequested ? [] : toolsExecuted

            if (violations.length === 0) {
              return { content: `✅ Approval gate compliance: PASSED\n\nAll ${toolsExecuted.length} execution operation(s) were properly approved.` }
            }

            return { content: `⚠️ Approval gate compliance: FAILED\n\nExecuted ${violations.length} operation(s) without approval:\n${violations.map(t => `  - ${t}`).join("\n")}\n\nCritical rule violated: approval_gate` }
          },
        })

        // 3. export_validation_report
        editor.add({
          name: "export_validation_report",
          description: "Export a comprehensive validation report for the current session to a markdown file",
          input: {
            type: "object",
            properties: {
              output_path: {
                type: "string",
                description: "Path to save the report (defaults to .tmp/validation-{sessionID}.md)",
              },
            },
          },
          execute: async (args: any, context: any) => {
            const sessionID = context?.sessionID || "unknown"
            try {
              const messages = await getSessionMessages(sessionID)
              const validation = await validateAgentSession(messages, behaviorLog, true)
              const report = generateMarkdownReport(sessionID, validation, messages, behaviorLog)
              const outputPath = args?.output_path || path.join(process.cwd(), ".tmp", `validation-${sessionID}.md`)
              await writeFile(outputPath, report, "utf-8")
              return { content: `✅ Validation report exported to: ${outputPath}` }
            } catch (error: any) {
              return { content: `Error exporting validation report: ${error.message}` }
            }
          },
        })

        // 4. analyze_delegation
        editor.add({
          name: "analyze_delegation",
          description: "Analyze task delegation patterns to verify if subagents are used appropriately",
          input: {
            type: "object",
            properties: {},
          },
          execute: async (_args: any, context: any) => {
            const sessionID = context?.sessionID || "unknown"
            const messages = await getSessionMessages(sessionID)
            const analysis = analyzeDelegationPatterns(messages)
            return { content: formatDelegationAnalysis(analysis) }
          },
        })

        // 5. analyze_context_reads
        editor.add({
          name: "analyze_context_reads",
          description: "Show all context files that were read during the session (e.g., .opencode/agent/openagent.md)",
          input: {
            type: "object",
            properties: {},
          },
          execute: async (_args: any, context: any) => {
            const sessionID = context?.sessionID || "unknown"
            const contextReads = behaviorLog.filter(
              log => log.sessionID === sessionID && log.event === "context_file_read"
            )

            if (contextReads.length === 0) {
              return { content: "📚 No context files read in this session yet.\n\nContext files are in `.opencode/` directories (agent definitions, workflows, standards, etc.)" }
            }

            const lines: string[] = [
              `## Context Files Read`,
              ``,
              `**Total reads:** ${contextReads.length}`,
              ``,
            ]

            const fileReadCounts = new Map<string, number>()
            contextReads.forEach(log => {
              const filePath = log.data.filePath
              fileReadCounts.set(filePath, (fileReadCounts.get(filePath) || 0) + 1)
            })

            const sorted = Array.from(fileReadCounts.entries()).sort((a, b) => b[1] - a[1])
            lines.push(`### Files Read:`)
            sorted.forEach(([filePath, count]) => {
              const fileName = filePath.split("/").pop()
              const readText = count === 1 ? "read" : "reads"
              lines.push(`- **${fileName}** (${count} ${readText})`)
              lines.push(`  \`${filePath}\``)
            })

            return { content: lines.join("\n") }
          },
        })

        // 6. check_context_compliance
        editor.add({
          name: "check_context_compliance",
          description: "Verify that context files were fetched BEFORE executing work (Context-First principle)",
          input: {
            type: "object",
            properties: {},
          },
          execute: async (_args: any, context: any) => {
            const sessionID = context?.sessionID || "unknown"
            const sessionBehaviorLog = behaviorLog.filter(log => log.sessionID === sessionID)

            const firstContextRead = sessionBehaviorLog.find(log => log.event === "context_file_read")
            const firstExecution = sessionBehaviorLog.find(log => log.event === "execution_tool_called")

            if (!firstContextRead && !firstExecution) {
              return { content: "ℹ️ No activity tracked yet in this session." }
            }

            const lines: string[] = [`## Context-First Compliance Check`, ``]
            if (!firstContextRead) {
              lines.push(`⚠️ **Status: NON-COMPLIANT**`)
              lines.push(`No context files were read during this session.`)
              lines.push(``)
              lines.push(`**Recommendation:** Fetch relevant context from \`.opencode/context/\` before starting work.`)
            } else if (!firstExecution) {
              lines.push(`✅ **Status: COMPLIANT (Context Loaded)**`)
              lines.push(`Context was read at ${new Date(firstContextRead.timestamp).toLocaleTimeString()}.`)
              lines.push(`No execution operations have occurred yet.`)
            } else if (firstContextRead.timestamp < firstExecution.timestamp) {
              const diffMs = firstExecution.timestamp - firstContextRead.timestamp
              const diffSec = Math.round(diffMs / 1000)
              lines.push(`✅ **Status: COMPLIANT**`)
              lines.push(`Context was fetched ${diffSec}s before first execution operation.`)
              lines.push(`- Context read: \`${firstContextRead.data.filePath}\``)
              lines.push(`- First execution: \`${firstExecution.data.tool}\``)
            } else {
              lines.push(`⚠️ **Status: VIOLATION DETECTED**`)
              lines.push(`Execution occurred BEFORE context was fetched:`)
              lines.push(`- First execution: \`${firstExecution.data.tool}\` at ${new Date(firstExecution.timestamp).toLocaleTimeString()}`)
              lines.push(`- Context read: \`${firstContextRead.data.filePath}\` at ${new Date(firstContextRead.timestamp).toLocaleTimeString()}`)
            }

            return { content: lines.join("\n") }
          },
        })

        // 7. analyze_agent_usage
        editor.add({
          name: "analyze_agent_usage",
          description: "Show which agents were active during the session and what tools they used",
          input: {
            type: "object",
            properties: {},
          },
          execute: async (_args: any, context: any) => {
            const sessionID = context?.sessionID || "unknown"
            const sessionBehaviorLog = behaviorLog.filter(log => log.sessionID === sessionID)

            if (sessionBehaviorLog.length === 0) {
              return { content: "📊 No agent activity tracked yet in this session." }
            }

            const agentStats = new Map<string, {
              toolCalls: Map<string, number>
              events: string[]
              firstSeen: number
              lastSeen: number
            }>()

            sessionBehaviorLog.forEach(log => {
              const agent = log.agent || "unknown"
              if (!agentStats.has(agent)) {
                agentStats.set(agent, {
                  toolCalls: new Map(),
                  events: [],
                  firstSeen: log.timestamp,
                  lastSeen: log.timestamp,
                })
              }

              const stats = agentStats.get(agent)!
              stats.lastSeen = log.timestamp
              stats.events.push(log.event)

              if (log.event === "execution_tool_called" || log.event === "tool_executed") {
                const tool = log.data?.tool
                if (tool) {
                  stats.toolCalls.set(tool, (stats.toolCalls.get(tool) || 0) + 1)
                }
              }
            })

            const lines: string[] = [`## Agent Usage Statistics`, ``]
            agentStats.forEach((stats, agent) => {
              lines.push(`### Agent: \`${agent}\``)
              lines.push(`- Active: ${new Date(stats.firstSeen).toLocaleTimeString()} - ${new Date(stats.lastSeen).toLocaleTimeString()}`)
              lines.push(`- Total Events: ${stats.events.length}`)
              if (stats.toolCalls.size > 0) {
                lines.push(`- Tools Used:`)
                const sortedTools = Array.from(stats.toolCalls.entries()).sort((a, b) => b[1] - a[1])
                sortedTools.forEach(([tool, count]) => {
                  lines.push(`  - ${tool}: ${count}x`)
                })
              }
              lines.push(``)
            })

            return { content: lines.join("\n") }
          },
        })

        // 8. debug_validator
        editor.add({
          name: "debug_validator",
          description: "Debug tool to inspect what the validator is tracking (behavior log, messages, etc.)",
          input: {
            type: "object",
            properties: {},
          },
          execute: async (_args: any, context: any) => {
            const sessionID = context?.sessionID || "unknown"
            const messages = await getSessionMessages(sessionID)
            const sessionBehaviorLog = behaviorLog.filter(log => log.sessionID === sessionID)
            const tracker = toolExecutionTracker.get(sessionID)

            const debug = {
              sessionID,
              behaviorLogEntries: sessionBehaviorLog.length,
              messagesCount: messages.length,
              toolTracker: tracker ? {
                approvalRequested: tracker.approvalRequested,
                toolsExecuted: tracker.toolsExecuted,
              } : null,
              activeAgent: sessionAgentTracker.get(sessionID) || "unknown",
            }

            return { content: `\`\`\`json\n${JSON.stringify(debug, null, 2)}\n\`\`\`` }
          },
        })
      })
    }

    return () => {
      abortController.abort()
    }
  },
})

// Validation analysis functions
async function validateAgentSession(
  messages: any[],
  behaviorLog: any[],
  includeDetails: boolean
): Promise<AgentValidationReport> {
  const checks: ValidationCheck[] = []

  checks.push(...analyzeToolUsage(messages))
  checks.push(...analyzeApprovalGates(messages, behaviorLog))
  checks.push(...analyzeContextFirst(messages, behaviorLog))

  const summary = {
    totalChecks: checks.length,
    passed: checks.filter(c => c.passed).length,
    failed: checks.filter(c => !c.passed && c.severity === "critical").length,
    warnings: checks.filter(c => !c.passed && c.severity === "warning").length,
  }

  let overallStatus: "passed" | "failed" | "warning" = "passed"
  if (summary.failed > 0) {
    overallStatus = "failed"
  } else if (summary.warnings > 0) {
    overallStatus = "warning"
  }

  return {
    agent: "session",
    timestamp: Date.now(),
    overallStatus,
    checks: includeDetails ? checks : checks.filter(c => !c.passed),
    summary,
  }
}

function analyzeToolUsage(messages: any[]): ValidationCheck[] {
  const checks: ValidationCheck[] = []
  for (const msg of messages) {
    const role = msg.info?.role || msg.role
    if (role !== "assistant") continue

    const tools = extractToolsFromMessage(msg)
    if (tools.length > 0) {
      checks.push({
        rule: "tool_usage",
        passed: true,
        severity: "info",
        details: `Used ${tools.length} tool(s): ${tools.join(", ")}`,
      })
    }
  }
  return checks
}

function analyzeApprovalGates(messages: any[], behaviorLog: any[]): ValidationCheck[] {
  const checks: ValidationCheck[] = []
  const executionTools = ["bash", "write", "edit", "task"]

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    const role = msg.info?.role || msg.role
    if (role !== "assistant") continue

    const tools = extractToolsFromMessage(msg)
    const executionOps = tools.filter(t => executionTools.includes(t))

    if (executionOps.length > 0) {
      let hasApprovalRequest = checkForApprovalLanguage(msg)
      if (!hasApprovalRequest) {
        for (let j = Math.max(0, i - 3); j < i; j++) {
          const prevMsg = messages[j]
          const prevRole = prevMsg.info?.role || prevMsg.role
          if (prevRole === "assistant" && checkForApprovalLanguage(prevMsg)) {
            if (j + 1 < messages.length) {
              const userResponse = messages[j + 1]
              const userRole = userResponse.info?.role || userResponse.role
              if (userRole === "user" && checkForUserApproval(userResponse)) {
                hasApprovalRequest = true
                break
              }
            }
          }
        }
      }

      if (hasApprovalRequest) {
        checks.push({
          rule: "approval_gate",
          passed: true,
          severity: "critical",
          details: `Execution operations (${executionOps.join(", ")}) were properly preceded by an approval request`,
        })
      } else {
        checks.push({
          rule: "approval_gate",
          passed: false,
          severity: "critical",
          details: `Executed operations (${executionOps.join(", ")}) without explicit approval request`,
          suggestion: "Ask user for confirmation before executing changes: 'Should I proceed with [action]?'",
        })
      }
    }
  }

  return checks
}

function analyzeContextFirst(messages: any[], behaviorLog: any[]): ValidationCheck[] {
  const checks: ValidationCheck[] = []
  let contextReadCount = 0
  let executionCount = 0

  for (const msg of messages) {
    const role = msg.info?.role || msg.role
    if (role !== "assistant") continue

    const tools = extractToolsFromMessage(msg)
    if (tools.includes("read")) {
      const reads = extractContextReads(msg)
      contextReadCount += reads.length
    }
    const executions = tools.filter(t => ["write", "edit", "task", "bash"].includes(t))
    executionCount += executions.length
  }

  if (executionCount > 0 && contextReadCount === 0) {
    checks.push({
      rule: "context_first",
      passed: false,
      severity: "warning",
      details: "Executed operations without reading context files first",
      suggestion: "Check .opencode/context/ for relevant standards, workflows, or templates before making changes",
    })
  } else if (contextReadCount > 0) {
    checks.push({
      rule: "context_first",
      passed: true,
      severity: "info",
      details: `Read ${contextReadCount} context file(s) during session`,
    })
  }

  return checks
}

function analyzeDelegationPatterns(messages: any[]): any {
  const stats = {
    delegations: 0,
    appropriate: 0,
    inappropriate: 0,
    fileCountStats: [] as number[],
  }

  for (const msg of messages) {
    const role = msg.info?.role || msg.role
    if (role !== "assistant") continue

    const tools = extractToolsFromMessage(msg)
    const hasDelegation = tools.includes("task")
    const writeEditCount = tools.filter(t => t === "write" || t === "edit").length

    if (hasDelegation) {
      stats.delegations++
      stats.fileCountStats.push(writeEditCount)
      if (writeEditCount >= 4) {
        stats.appropriate++
      } else {
        stats.inappropriate++
      }
    }
  }

  return stats
}

function extractToolsFromMessage(msg: any): string[] {
  const tools: string[] = []
  const parts = msg.parts || []

  for (const part of parts) {
    if (part.type === "tool" && part.tool) {
      tools.push(part.tool)
    }
    if (part.type === "tool-invocation" && part.toolInvocation) {
      tools.push(part.toolInvocation.toolName)
    }
  }

  return tools
}

function extractContextReads(msg: any): string[] {
  const contextFiles: string[] = []
  if (!msg.parts) return contextFiles

  for (const part of msg.parts) {
    if (part.type === "tool" && part.tool === "read") {
      const pathArg = part.args?.filePath || part.args?.target_file || part.args?.path
      if (pathArg && typeof pathArg === "string" && pathArg.includes(".opencode/")) {
        contextFiles.push(pathArg)
      }
    }
  }

  return contextFiles
}

function formatValidationReport(report: AgentValidationReport): string {
  const lines: string[] = [
    `# Agent Validation Report`,
    ``,
    `**Status:** ${report.overallStatus === "passed" ? "✅ PASSED" : report.overallStatus === "failed" ? "❌ FAILED" : "⚠️ WARNING"}`,
    `**Timestamp:** ${new Date(report.timestamp).toLocaleString()}`,
    ``,
    `## Summary`,
    `- Total Checks: ${report.summary.totalChecks}`,
    `- Passed: ${report.summary.passed} ✅`,
    `- Failed: ${report.summary.failed} ❌`,
    `- Warnings: ${report.summary.warnings} ⚠️`,
    ``,
    `## Checks`,
  ]

  for (const check of report.checks) {
    const icon = check.passed ? "✅" : check.severity === "critical" ? "❌" : "⚠️"
    lines.push(`### ${icon} ${check.rule}`)
    lines.push(check.details)
    if (check.suggestion) {
      lines.push(`**Suggestion:** ${check.suggestion}`)
    }
    lines.push(``)
  }

  return lines.join("\n")
}

function formatDelegationAnalysis(stats: any): string {
  return [
    `## Delegation Analysis`,
    `- Total Delegations: ${stats.delegations}`,
    `- Appropriate: ${stats.appropriate}`,
    `- Inappropriate: ${stats.inappropriate}`,
  ].join("\n")
}

function generateMarkdownReport(sessionID: string, validation: AgentValidationReport, messages: any[], behaviorLog: any[]): string {
  return [
    `# Validation Report for Session ${sessionID}`,
    ``,
    formatValidationReport(validation),
  ].join("\n")
}
