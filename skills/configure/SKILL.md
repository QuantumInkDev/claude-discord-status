---
name: configure
description: Set up and configure the Discord Rich Presence plugin
metadata:
  filePattern: "**/config.json"
  bashPattern: "discord.*config|discord.*setup"
---

# Discord Status Configuration

## First-Time Setup

1. **Create a Discord Application**
   - Go to https://discord.com/developers/applications
   - Click "New Application" and name it (e.g., "Claude Code")
   - Copy the **Application ID** (also called Client ID)

2. **Upload Rich Presence Assets** (optional)
   - In your Discord Application, go to Rich Presence > Art Assets
   - Upload images named: `claude_code`, `claude_desktop`, `claude_cowork`
   - Recommended size: 1024x1024 PNG

3. **Configure the Plugin**
   - The config file is at `$CLAUDE_PLUGIN_DATA/config.json`
   - Set your Discord Application ID:

```json
{
  "discordAppId": "YOUR_APPLICATION_ID",
  "enabled": true,
  "showProjectName": true,
  "showFileName": false,
  "showElapsedTime": true,
  "idleTimeoutSeconds": 300,
  "buttons": []
}
```

4. **Build the Plugin**
   ```bash
   cd <plugin-directory>
   npm install
   npm run build
   ```

5. **Install the Plugin**
   ```
   /plugin install ./path/to/claude-discord-status
   ```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `discordAppId` | string | `""` | **Required.** Your Discord Application ID |
| `enabled` | boolean | `true` | Enable/disable the plugin |
| `showProjectName` | boolean | `true` | Show project directory name in status |
| `showFileName` | boolean | `false` | Show current file name (privacy consideration) |
| `showElapsedTime` | boolean | `true` | Show elapsed session time |
| `idleTimeoutSeconds` | number | `300` | Seconds before status shows as idle |
| `buttons` | array | `[]` | Up to 2 clickable buttons (label + url) |

## Troubleshooting

- **Status not showing**: Ensure Discord is running and "Display current activity" is enabled in Discord Settings > Activity Privacy
- **Daemon not starting**: Check that `npm run build` completed successfully
- **Connection errors**: The daemon reconnects automatically every 15 seconds
