#!/usr/bin/env node

/**
 * SessionStart hook — spawns daemon if not running, registers the session.
 */

import { spawn } from 'node:child_process';
import { existsSync, readFileSync, mkdirSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { sendMessage, readStdin } from './lib/ipc-client.mjs';

const PID_FILENAME = 'claude-discord-status.pid';
const FALLBACK_DATA_DIR = join(homedir(), '.claude', 'plugins', 'data', 'claude-discord-status');

function getPluginDataDir() {
  return process.env.CLAUDE_PLUGIN_DATA ?? FALLBACK_DATA_DIR;
}

function getPidPath() {
  return join(getPluginDataDir(), PID_FILENAME);
}

function isDaemonRunning() {
  const pidPath = getPidPath();
  if (!existsSync(pidPath)) return false;

  try {
    const pid = parseInt(readFileSync(pidPath, 'utf-8').trim(), 10);
    // Check if process is alive (signal 0 doesn't kill, just checks)
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function spawnDaemon() {
  const hooksDir = dirname(new URL(import.meta.url).pathname);
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT ?? dirname(hooksDir);
  const daemonScript = join(pluginRoot, 'dist', 'daemon', 'index.js');

  if (!existsSync(daemonScript)) {
    console.error(`[discord-status] Daemon not built. Run 'npm run build' in the plugin directory.`);
    return;
  }

  // Ensure data directory exists
  const dataDir = getPluginDataDir();
  mkdirSync(dataDir, { recursive: true });

  const child = spawn(process.execPath, [daemonScript], {
    detached: true,
    stdio: 'ignore',
    env: {
      ...process.env,
      CLAUDE_PLUGIN_DATA: dataDir,
    },
  });

  child.unref();
}

function detectAppType() {
  if (process.env.COWORK_SESSION) return 'cowork';
  if (process.env.CLAUDE_DESKTOP) return 'desktop';
  return 'code';
}

async function main() {
  const logFile = join(getPluginDataDir(), 'hook-debug.log');
  const log = (msg) => {
    const line = `[${new Date().toISOString()}] session-start: ${msg}\n`;
    try { appendFileSync(logFile, line); } catch { /* best effort */ }
  };

  log('Hook fired');
  log(`CLAUDE_PLUGIN_ROOT=${process.env.CLAUDE_PLUGIN_ROOT ?? 'NOT SET'}`);
  log(`CLAUDE_PLUGIN_DATA=${process.env.CLAUDE_PLUGIN_DATA ?? 'NOT SET'}`);

  const input = await readStdin();
  log(`stdin parsed: ${JSON.stringify(input).slice(0, 200)}`);

  // Spawn daemon if not running
  if (!isDaemonRunning()) {
    log('Daemon not running, spawning...');
    spawnDaemon();
    // Give daemon a moment to start
    await new Promise((resolve) => setTimeout(resolve, 1500));
    log(`Daemon running after spawn: ${isDaemonRunning()}`);
  } else {
    log('Daemon already running');
  }

  const sessionId = input.session_id ?? `unknown-${Date.now()}`;
  const cwd = input.cwd ?? process.cwd();
  const project = cwd.split('/').pop() || cwd.split('\\').pop() || 'Unknown';

  log(`Sending register: session=${sessionId} project=${project}`);

  await sendMessage({
    type: 'register',
    sessionId,
    timestamp: Date.now(),
    payload: {
      appType: detectAppType(),
      project,
      action: 'Starting session',
      actionCategory: 'idle',
      ownerPid: process.ppid,
    },
  });

  log('Register sent successfully');

  // Output to stdout so Claude Code shows it in system-reminders
  console.log(`Discord Rich Presence: session ${sessionId} registered for project "${project}"`);
}

main().catch((err) => {
  const logFile = join(getPluginDataDir(), 'hook-debug.log');
  try { appendFileSync(logFile, `[${new Date().toISOString()}] session-start ERROR: ${err.message}\n${err.stack}\n`); } catch { /* */ }
  console.error(`Discord Rich Presence error: ${err.message}`);
});
