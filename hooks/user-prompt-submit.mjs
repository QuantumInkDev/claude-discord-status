#!/usr/bin/env node

/**
 * UserPromptSubmit hook — updates status to "Chatting with Claude".
 */

import { sendMessage, readStdin } from './lib/ipc-client.mjs';

async function main() {
  const input = await readStdin();
  const sessionId = input.session_id ?? `unknown-${Date.now()}`;

  await sendMessage({
    type: 'update',
    sessionId,
    timestamp: Date.now(),
    payload: {
      action: 'Chatting with Claude',
      actionCategory: 'chatting',
    },
  });
}

main().catch(() => {
  // Hooks should never block Claude Code
});
