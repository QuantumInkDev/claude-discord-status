/**
 * Shared IPC client for hook scripts.
 * Connects to the daemon's Unix socket and sends NDJSON messages.
 */

import { connect } from 'node:net';
import { platform, tmpdir } from 'node:os';
import { join } from 'node:path';

const SOCKET_FILENAME = 'claude-discord-status.sock';
const CONNECT_TIMEOUT_MS = 2000;

function getSocketPath() {
  const dataDir = process.env.CLAUDE_PLUGIN_DATA ?? join(tmpdir(), 'claude-discord-status');

  if (platform() === 'win32') {
    return '\\\\.\\pipe\\claude-discord-status';
  }

  return join(dataDir, SOCKET_FILENAME);
}

/**
 * Send a message to the daemon. Fails silently if daemon isn't running.
 * @param {object} message - The HookMessage to send
 * @returns {Promise<void>}
 */
export function sendMessage(message) {
  return new Promise((resolve) => {
    const socketPath = getSocketPath();
    const payload = JSON.stringify(message) + '\n';

    const socket = connect(socketPath, () => {
      socket.write(payload, () => {
        socket.end();
        resolve();
      });
    });

    socket.setTimeout(CONNECT_TIMEOUT_MS);

    socket.on('timeout', () => {
      socket.destroy();
      resolve(); // Fail silently
    });

    socket.on('error', () => {
      resolve(); // Fail silently — daemon may not be running
    });
  });
}

/**
 * Read JSON from stdin (hook input from Claude Code).
 * @returns {Promise<object>}
 */
export function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';

    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });
    process.stdin.on('error', reject);

    // If no stdin after 1s, resolve with empty object
    setTimeout(() => {
      if (!data) resolve({});
    }, 1000);
  });
}
