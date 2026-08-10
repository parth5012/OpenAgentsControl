import type { Plugin } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"
import fs from "fs/promises"
import path from "path"

interface TimingRecord {
  sessionID: string
  startTime: number
  endTime: number
  duration: string
  task: string
  timestamp: number
}

/**
 * Task Timing Plugin
 * 
 * Tracks session duration and displays timing information.
 * Shows how long tasks take to complete in real-time.
 */
export const TaskTimingPlugin: Plugin = async ({ client, project, directory, $ }) => {
  const timingLogPath = path.join(directory, ".tmp", "session-timing.json")
  const sessionStartTimes = new Map<string, number>()
  const sessionTasks = new Map<string, string>()
  
  // Ensure .tmp directory exists
  try {
    await fs.mkdir(path.join(directory, ".tmp"), { recursive: true })
  } catch (e) {
    // Directory may already exist
  }

  // Load existing timing records
  async function loadTimingRecords(): Promise<TimingRecord[]> {
    try {
      const data = await fs.readFile(timingLogPath, "utf-8")
      return JSON.parse(data)
    } catch {
      return []
    }
  }

  // Save timing records
  async function saveTimingRecords(records: TimingRecord[]): Promise<void> {
    await fs.writeFile(timingLogPath, JSON.stringify(records, null, 2))
  }

  // Format duration from milliseconds
  function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  return {
    async event(input: any) {
      const event = input
      
      // Track session start when user sends a message
      if (event.type === "message.updated") {
        const msg = event.properties?.info
        if (msg?.sessionID && msg?.role === "user") {
          sessionStartTimes.set(msg.sessionID, Date.now())
          sessionTasks.set(msg.sessionID, msg.parts?.[0]?.text?.substring(0, 50) || "Unknown task")
        }
      }

      // Track session end/completion
      if (event.type === "session.complete" || event.type === "session.idle") {
        const sessionID = event.properties?.sessionID
        if (sessionID && sessionStartTimes.has(sessionID)) {
          const startTime = sessionStartTimes.get(sessionID)!
          const endTime = Date.now()
          const duration = formatDuration(endTime - startTime)
          const task = sessionTasks.get(sessionID) || "Unknown task"

          const record: TimingRecord = {
            sessionID,
            startTime,
            endTime,
            duration,
            task,
            timestamp: Date.now()
          }

          // Save to log
          const records = await loadTimingRecords()
          records.push(record)
          await saveTimingRecords(records)

          // Show toast notification
          await $`say "Session complete: ${duration} | Task: ${task}"`

          // Clear tracking
          sessionStartTimes.delete(sessionID)
          sessionTasks.delete(sessionID)
        }
      }
    },

    // Custom tool to check timing
    tool: {
      // Get timing for current session
      timing_status: tool({
        description: "Show timing information for the current session",
        args: {
          session_id: tool.schema.string().optional().describe("Session ID to check (defaults to current)"),
          verbose: tool.schema.boolean().optional().describe("Show detailed timing info")
        },
        async execute(args, context) {
          const sessionID = args.session_id || context.sessionID
          const startTime = sessionStartTimes.get(sessionID)
          
          if (!startTime) {
            // Check logs
            const records = await loadTimingRecords()
            const currentRecord = records.find(r => r.sessionID === sessionID && !r.endTime)
            
            if (currentRecord) {
              const elapsed = formatDuration(Date.now() - currentRecord.startTime)
              return `Session active for: ${elapsed}\nTask: ${currentRecord.task}`
            }
            
            return "No active session timing found"
          }

          const elapsed = formatDuration(Date.now() - startTime)
          const task = sessionTasks.get(sessionID) || "Unknown task"
          
          let result = `Session elapsed time: ${elapsed}\nTask: ${task}`
          
          if (args.verbose) {
            const records = await loadTimingRecords()
            const recent = records.filter(r => r.sessionID === sessionID).slice(-5)
            result += `\n\nRecent sessions:\n${recent.map(r => `  ${r.task}: ${r.duration}`).join("\n")}`
          }
          
          return result
        }
      }),

      // List timing history
      timing_history: tool({
        description: "Show timing history for recent sessions",
        args: {
          limit: tool.schema.number().optional().describe("Number of records to show (default: 10)")
        },
        async execute(args, context) {
          const records = await loadTimingRecords()
          const limit = args.limit || 10
          const recent = records.slice(-limit).reverse()

          if (recent.length === 0) {
            return "No timing records found"
          }

          const lines = recent.map((r, i) => {
            const date = new Date(r.timestamp).toLocaleString()
            return `${i + 1}. ${date} | ${r.duration} | ${r.task}`
          })

          return lines.join("\n")
        }
      }),

      // Clear timing data
      timing_clear: tool({
        description: "Clear all timing records",
        args: {},
        async execute(args, context) {
          await saveTimingRecords([])
          sessionStartTimes.clear()
          sessionTasks.clear()
          return "Timing records cleared"
        }
      })
    }
  }
}
