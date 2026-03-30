#!/usr/bin/env node

/**
 * PostToolUse hook — updates Discord status based on which tool was used.
 */

import { basename } from 'node:path';
import { sendMessage, readStdin } from './lib/ipc-client.mjs';

function mapToolToAction(toolName, toolInput) {
  switch (toolName) {
    case 'Write':
    case 'Edit':
    case 'NotebookEdit': {
      const filePath = toolInput?.file_path;
      const fileName = filePath ? basename(filePath) : undefined;
      return {
        action: fileName ? `Editing ${fileName}` : 'Editing a file',
        actionCategory: 'editing',
      };
    }

    case 'Bash': {
      return {
        action: 'Running a command',
        actionCategory: 'running',
      };
    }

    case 'Read':
    case 'Glob':
    case 'Grep': {
      return {
        action: 'Exploring codebase',
        actionCategory: 'exploring',
      };
    }

    case 'Agent': {
      return {
        action: 'Working with agents',
        actionCategory: 'running',
      };
    }

    default: {
      return {
        action: 'Working',
        actionCategory: 'idle',
      };
    }
  }
}

async function main() {
  const input = await readStdin();
  const sessionId = input.session_id ?? `unknown-${Date.now()}`;
  const toolName = input.tool_name ?? '';
  const toolInput = input.hook_input?.tool_input ?? {};

  const { action, actionCategory } = mapToolToAction(toolName, toolInput);

  await sendMessage({
    type: 'update',
    sessionId,
    timestamp: Date.now(),
    payload: {
      action,
      actionCategory,
    },
  });
}

main().catch(() => {
  // Hooks should never block Claude Code
});
