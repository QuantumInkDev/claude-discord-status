#!/usr/bin/env node
/**
 * Test script to cycle through all Discord Rich Presence icon combinations.
 * Sends IPC messages to the running daemon with a delay between each.
 *
 * Usage: node scripts/test-icons.mjs [delay_seconds]
 * Default delay: 20s (Discord rate limit is 15s)
 */

import { connect } from 'node:net';
import { homedir, platform } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const SOCKET_FILENAME = 'claude-discord-status.sock';
const FALLBACK_DATA_DIR = join(homedir(), '.claude', 'plugins', 'data', 'claude-discord-status');
const DELAY_S = parseInt(process.argv[2] || '20', 10);

function getSocketPath() {
  const dataDir = process.env.CLAUDE_PLUGIN_DATA ?? FALLBACK_DATA_DIR;
  if (platform() === 'win32') return '\\\\.\\pipe\\claude-discord-status';
  return join(dataDir, SOCKET_FILENAME);
}

function sendMessage(message) {
  return new Promise((resolve, reject) => {
    const socket = connect(getSocketPath(), () => {
      socket.write(JSON.stringify(message) + '\n', () => {
        socket.end();
        resolve();
      });
    });
    socket.setTimeout(3000);
    socket.on('timeout', () => { socket.destroy(); reject(new Error('timeout')); });
    socket.on('error', reject);
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

const APP_TYPES = ['code', 'desktop', 'cowork', 'chat'];
const ACTION_CATEGORIES = ['editing', 'running', 'exploring', 'chatting', 'idle'];

const sessionId = `icon-test-${randomUUID().slice(0, 8)}`;

async function main() {
  console.log(`\n🎨 Discord Icon Test — cycling through all combinations`);
  console.log(`   Session: ${sessionId}`);
  console.log(`   Delay between changes: ${DELAY_S}s`);
  console.log(`   Total combos: ${APP_TYPES.length * ACTION_CATEGORIES.length}\n`);

  // Register session first
  await sendMessage({
    type: 'register',
    sessionId,
    timestamp: Date.now(),
    payload: { appType: 'code', project: 'icon-test', actionCategory: 'idle', action: 'Starting icon test' },
  });
  console.log(`✅ Session registered\n`);
  await sleep(2000);

  let i = 1;
  for (const appType of APP_TYPES) {
    for (const actionCategory of ACTION_CATEGORIES) {
      console.log(`[${i}/${APP_TYPES.length * ACTION_CATEGORIES.length}] large: ${appType} | small: ${actionCategory}`);

      await sendMessage({
        type: 'update',
        sessionId,
        timestamp: Date.now(),
        payload: {
          appType,
          project: 'icon-test',
          actionCategory,
          action: `Testing ${appType} + ${actionCategory}`,
          details: `Large: ${appType} | Small: ${actionCategory}`,
        },
      });

      if (i < APP_TYPES.length * ACTION_CATEGORIES.length) {
        console.log(`   ⏳ Waiting ${DELAY_S}s (check Discord now)...\n`);
        await sleep(DELAY_S * 1000);
      }
      i++;
    }
  }

  console.log(`\n✅ Done! Deregistering test session...`);
  await sendMessage({
    type: 'deregister',
    sessionId,
    timestamp: Date.now(),
    payload: {},
  });
  console.log(`🏁 Test complete.\n`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
