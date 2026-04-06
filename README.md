# claude-discord-status

[![CI](https://github.com/QuantumInkDev/claude-discord-status/actions/workflows/ci.yml/badge.svg)](https://github.com/QuantumInkDev/claude-discord-status/actions/workflows/ci.yml)

Show your Claude Code, Claude Desktop, or Cowork activity as Discord Rich Presence.

Like the VS Code Discord extension, but for Claude.

## What it shows

- **Which app** you're using (Claude Code, Desktop, or Cowork)
- **What you're doing** (editing files, running commands, chatting, exploring code)
- **Project name** and elapsed time
- **Custom buttons** (optional — link to your GitHub, portfolio, etc.)

## Quick Start

### 1. Create a Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application** — name it "Claude Code" (or whatever you like)
3. Copy your **Application ID**

### 2. Install the plugin

```bash
# Clone and install (auto-builds via postinstall)
git clone https://github.com/QuantumInkDev/claude-discord-status.git
cd claude-discord-status
npm install

# Install in Claude Code
claude plugin install ./claude-discord-status
```

### 3. Configure

Create the config file at the plugin data directory:

```json
{
  "discordAppId": "YOUR_APPLICATION_ID_HERE",
  "enabled": true,
  "showProjectName": true,
  "showFileName": false,
  "showElapsedTime": true,
  "buttons": [
    { "label": "View Project", "url": "https://github.com/you/project" }
  ]
}
```

### 4. Use Claude

That's it. Start a Claude Code session and your Discord status will update automatically.

## How it works

```
Claude Code hooks  ──►  Background daemon  ──►  Discord Rich Presence
(session events)        (Node.js process)       (IPC connection)
```

1. **SessionStart** hook spawns a background daemon (if not already running)
2. Hook scripts send status updates to the daemon over a Unix socket
3. The daemon maintains a persistent Discord IPC connection
4. Most-recently-active session wins when multiple terminals are open
5. Daemon auto-shuts down after 5 minutes with no active sessions

## Configuration

| Option | Default | Description |
|--------|---------|-------------|
| `discordAppId` | `""` | **Required.** Discord Application ID |
| `enabled` | `true` | Toggle the plugin on/off |
| `showProjectName` | `true` | Display the project directory name |
| `showFileName` | `false` | Display current file being edited |
| `showElapsedTime` | `true` | Show how long the session has been active |
| `idleTimeoutSeconds` | `300` | Seconds before marking session as idle |
| `buttons` | `[]` | Up to 2 clickable buttons with label + url |

## Discord Asset Setup (Optional)

For custom icons, upload images in your Discord Application under Rich Presence > Art Assets:

**Large images** (app type — displayed as main icon):

| Asset Key | Description | Size |
|-----------|-------------|------|
| `claude_code` | Claude Code logo | 1024x1024 |
| `claude_desktop` | Claude Desktop logo | 1024x1024 |
| `claude_cowork` | Claude Cowork logo | 1024x1024 |
| `claude_chat` | Claude Chat logo | 1024x1024 |

**Small images** (action — displayed as overlay badge):

| Asset Key | Description | Size |
|-----------|-------------|------|
| `action_edit` | Editing files | 1024x1024 |
| `action_run` | Running commands | 1024x1024 |
| `action_explore` | Exploring codebase | 1024x1024 |
| `action_chat` | Chatting | 1024x1024 |
| `action_idle` | Idle | 1024x1024 |

## Requirements

- Node.js 20+
- Discord desktop app running locally
- "Display current activity" enabled in Discord Settings > Activity Privacy

## Cross-platform

Works on macOS, Windows, and Linux — wherever Claude Code and Discord both run.

- **macOS/Linux**: Uses Unix domain sockets
- **Windows**: Uses named pipes

## License

MIT - see [LICENSE](LICENSE)

## Credits

Created by [QuantumInkDev](https://github.com/QuantumInkDev)
