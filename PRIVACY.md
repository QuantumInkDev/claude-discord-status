# Privacy Policy

**claude-discord-status** — Discord Rich Presence Plugin for Claude Code

**Last Updated**: 2026-04-05

## Overview

This plugin displays your Claude Code activity as Discord Rich Presence status. It operates entirely on your local machine and does not collect, store, or transmit any personal data to external servers.

## What Data the Plugin Accesses

| Data | Purpose | Where it goes |
|------|---------|---------------|
| Project directory name | Displayed as Discord status | Local Discord IPC only |
| Current action (editing, running, etc.) | Displayed as Discord status | Local Discord IPC only |
| Session duration | Displayed as elapsed time | Local Discord IPC only |
| File names (if enabled) | Displayed as Discord status | Local Discord IPC only |

## What the Plugin Does NOT Do

- Does **not** collect or transmit data to any remote server
- Does **not** read file contents — only file names when the "show file name" option is enabled
- Does **not** store any data beyond the current session
- Does **not** require an account or authentication
- Does **not** use analytics, tracking, or telemetry

## How It Works

1. Claude Code hook events trigger local JavaScript scripts
2. Scripts send status updates to a background daemon via a local Unix socket (or Windows named pipe)
3. The daemon forwards the status to the Discord desktop app via Discord's local IPC connection
4. All communication stays on your machine — nothing leaves localhost

## Data Retention

No data is persisted. Session state exists only in memory while the daemon is running and is discarded when the daemon shuts down (automatically after 5 minutes of inactivity).

## Third-Party Services

The only external integration is **Discord Rich Presence**, which is a local IPC protocol between the plugin daemon and your Discord desktop app. No network requests are made by this plugin.

## Contact

If you have questions about this privacy policy, please open an issue at:
https://github.com/QuantumInkDev/claude-discord-status/issues

## Changes

Any changes to this privacy policy will be reflected in this file and noted in the repository's release notes.
