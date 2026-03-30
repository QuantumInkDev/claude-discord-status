#!/usr/bin/env node

/**
 * CwdChanged hook — updates the project name when the working directory changes.
 */

import { sendMessage, readStdin } from './lib/ipc-client.mjs';

async function main() {
  const input = await readStdin();
  const sessionId = input.session_id ?? `unknown-${Date.now()}`;
  const cwd = input.cwd ?? process.cwd();
  const project = cwd.split('/').pop() || cwd.split('\\').pop() || 'Unknown';

  await sendMessage({
    type: 'update',
    sessionId,
    timestamp: Date.now(),
    payload: {
      project,
    },
  });
}

main().catch(() => {
  // Hooks should never block Claude Code
});
