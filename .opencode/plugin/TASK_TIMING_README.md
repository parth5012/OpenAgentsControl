# Task Timing Plugin

This plugin tracks session duration and displays timing information for completed tasks.

## Features

- **Automatic Timing**: Tracks how long each session takes from start to finish
- **Toast Notifications**: Shows duration when a session completes
- **Command Tools**:
  - `/timing status` - Check current session elapsed time
  - `/timing history` - View timing history for recent sessions
  - `/timing clear` - Clear all timing records
- **Persistent Logging**: Saves timing data to `.tmp/session-timing.json`

## Usage

The plugin works automatically - it tracks sessions without any configuration needed.

### Manual Commands

In the TUI, you can use:
- `/timing status` - See how long the current session has been running
- `/timing history` - View past session durations
- `/timing clear` - Reset timing data

### Data Storage

Timing records are saved to:
```
.opencode/.tmp/session-timing.json
```

Each record includes:
- Session ID
- Start time
- End time
- Duration (formatted as `Xh Ym Zs`)
- Task description (first 50 chars of user message)

## Configuration

No configuration needed. The plugin activates automatically when loaded.

## Notes

- Timing starts when you send a message and ends when the session completes
- Duration is shown in toast notifications upon session completion
- The plugin uses the opencode SDK event system for real-time tracking
