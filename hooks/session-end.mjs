#!/usr/bin/env node

/**
 * SessionEnd hook — deregisters the session from the daemon.
 */

import { sendMessage, readStdin } from './lib/ipc-client.mjs';

async function main() {
  const input = await readStdin();
  const sessionId = input.session_id ?? `unknown-${Date.now()}`;

  await sendMessage({
    type: 'deregister',
    sessionId,
    timestamp: Date.now(),
    payload: {},
  });
}

main().catch(() => {
  // Hooks should never block Claude Code
});
