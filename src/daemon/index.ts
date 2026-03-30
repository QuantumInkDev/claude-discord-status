import { writeFileSync, unlinkSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DiscordClient } from './discord-client.js';
import { SocketServer } from './socket-server.js';
import { StateManager } from './state-manager.js';
import { loadConfig, validateConfig } from './config.js';
import { getSocketPath, getPidPath, DAEMON_IDLE_TIMEOUT_MS } from '../shared/constants.js';

/** The main daemon process that bridges Claude hooks → Discord Rich Presence */
async function main(): Promise<void> {
  const config = loadConfig();
  const { valid, errors } = validateConfig(config);

  if (!valid) {
    console.error('Configuration errors:');
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  // Write PID file
  const pidPath = getPidPath();
  mkdirSync(dirname(pidPath), { recursive: true });
  writeFileSync(pidPath, String(process.pid), 'utf-8');

  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  let pruneInterval: ReturnType<typeof setInterval> | null = null;

  // Set up Discord client
  const discord = new DiscordClient({
    appId: config.discordAppId,
    onReady: () => {
      console.log('[daemon] Connected to Discord');
    },
    onDisconnected: () => {
      console.log('[daemon] Disconnected from Discord');
    },
    onError: (error) => {
      console.error(`[daemon] Discord error: ${error.message}`);
    },
  });

  // Set up state manager
  const stateManager = new StateManager(config, async (activity) => {
    if (activity) {
      await discord.setActivity(activity);
    } else {
      await discord.clearActivity();
    }
  });

  // Set up socket server
  const socketPath = getSocketPath();
  mkdirSync(dirname(socketPath), { recursive: true });

  const socketServer = new SocketServer({
    socketPath,
    onMessage: (message) => {
      stateManager.handleMessage(message);
      resetIdleTimer();
    },
    onError: (error) => {
      console.error(`[daemon] Socket error: ${error.message}`);
    },
  });

  function resetIdleTimer(): void {
    if (idleTimer) {
      clearTimeout(idleTimer);
    }

    idleTimer = setTimeout(async () => {
      if (!stateManager.hasActiveSessions()) {
        console.log('[daemon] No active sessions, shutting down');
        await shutdown();
      }
    }, DAEMON_IDLE_TIMEOUT_MS);
  }

  async function shutdown(): Promise<void> {
    console.log('[daemon] Shutting down...');

    if (idleTimer) clearTimeout(idleTimer);
    if (pruneInterval) clearInterval(pruneInterval);

    stateManager.destroy();
    await discord.clearActivity();
    await socketServer.stop();
    await discord.disconnect();

    // Clean up PID file
    try {
      unlinkSync(pidPath);
    } catch {
      // Best effort
    }

    process.exit(0);
  }

  // Handle graceful shutdown
  process.on('SIGTERM', () => void shutdown());
  process.on('SIGINT', () => void shutdown());

  // Start everything
  try {
    await socketServer.start();
    console.log(`[daemon] Socket server listening on ${socketPath}`);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`[daemon] Failed to start socket server: ${err.message}`);
    process.exit(1);
  }

  await discord.connect();

  // Prune idle sessions every minute
  pruneInterval = setInterval(() => {
    stateManager.pruneIdleSessions();
  }, 60_000);

  // Start idle timer
  resetIdleTimer();

  console.log('[daemon] Ready');
}

main().catch((error) => {
  console.error('[daemon] Fatal error:', error);
  process.exit(1);
});
