import { platform, tmpdir } from 'node:os';
import { join } from 'node:path';

/** Default Discord Application ID for the official claude-discord-status plugin */
export const DEFAULT_DISCORD_APP_ID = '1488323365642047630';

/** Rate limit: Discord allows 1 presence update per 15 seconds */
export const DISCORD_RATE_LIMIT_MS = 15_000;

/** How long the daemon stays alive with no active sessions */
export const DAEMON_IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/** How long before a session is considered idle (no updates) */
export const SESSION_IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/** Socket filename */
export const SOCKET_FILENAME = 'claude-discord-status.sock';

/** PID lockfile filename */
export const PID_FILENAME = 'claude-discord-status.pid';

/** Config filename */
export const CONFIG_FILENAME = 'config.json';

/** Get the plugin data directory (set by Claude Code, fallback to tmp) */
export function getPluginDataDir(): string {
  return process.env['CLAUDE_PLUGIN_DATA'] ?? join(tmpdir(), 'claude-discord-status');
}

/** Get the socket path based on platform */
export function getSocketPath(): string {
  const dataDir = getPluginDataDir();

  if (platform() === 'win32') {
    // Windows named pipe
    return '\\\\.\\pipe\\claude-discord-status';
  }

  return join(dataDir, SOCKET_FILENAME);
}

/** Get the PID file path */
export function getPidPath(): string {
  return join(getPluginDataDir(), PID_FILENAME);
}

/** Get the config file path */
export function getConfigPath(): string {
  return join(getPluginDataDir(), CONFIG_FILENAME);
}

/** Discord asset keys for each app type */
export const APP_ASSETS: Record<string, { largeImageKey: string; largeImageText: string }> = {
  code: { largeImageKey: 'claude_code', largeImageText: 'Claude Code' },
  desktop: { largeImageKey: 'claude_desktop', largeImageText: 'Claude Desktop' },
  cowork: { largeImageKey: 'claude_cowork', largeImageText: 'Claude Cowork' },
  chat: { largeImageKey: 'claude_chat', largeImageText: 'Claude Chat' },
};

/** Small image keys for action categories */
export const ACTION_ASSETS: Record<string, { smallImageKey: string; smallImageText: string }> = {
  editing: { smallImageKey: 'action_edit', smallImageText: 'Editing' },
  running: { smallImageKey: 'action_run', smallImageText: 'Running' },
  exploring: { smallImageKey: 'action_explore', smallImageText: 'Exploring' },
  chatting: { smallImageKey: 'action_chat', smallImageText: 'Chatting' },
  idle: { smallImageKey: 'action_idle', smallImageText: 'Idle' },
};
