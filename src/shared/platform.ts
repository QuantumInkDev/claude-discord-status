import { platform } from 'node:os';
import { basename } from 'node:path';
import type { AppType, ActionCategory } from './types.js';

/** Detect which Claude application is running based on environment variables */
export function detectAppType(): AppType {
  // Cowork sets a specific env var
  if (process.env['COWORK_SESSION']) {
    return 'cowork';
  }

  // Claude Desktop sets this
  if (process.env['CLAUDE_DESKTOP']) {
    return 'desktop';
  }

  // Default to Claude Code (CLI/terminal)
  return 'code';
}

/** Extract project name from a directory path (handles both Unix and Windows paths) */
export function extractProjectName(cwd: string): string {
  // Handle both forward and back slashes for cross-platform support
  const segments = cwd.split(/[/\\]/);
  const last = segments.filter(Boolean).pop();
  return last || 'Unknown Project';
}

/** Map a tool name to a human-readable action and category */
export function mapToolToAction(toolName: string, toolInput?: Record<string, unknown>): {
  action: string;
  category: ActionCategory;
} {
  switch (toolName) {
    case 'Write':
    case 'Edit':
    case 'NotebookEdit': {
      const filePath = toolInput?.['file_path'] as string | undefined;
      const fileName = filePath ? basename(filePath) : undefined;
      return {
        action: fileName ? `Editing ${fileName}` : 'Editing a file',
        category: 'editing',
      };
    }

    case 'Bash': {
      return {
        action: 'Running a command',
        category: 'running',
      };
    }

    case 'Read':
    case 'Glob':
    case 'Grep':
    case 'LS': {
      return {
        action: 'Exploring codebase',
        category: 'exploring',
      };
    }

    case 'Agent': {
      return {
        action: 'Working with agents',
        category: 'running',
      };
    }

    default: {
      return {
        action: 'Working',
        category: 'idle',
      };
    }
  }
}

/** Check if the current platform is Windows */
export function isWindows(): boolean {
  return platform() === 'win32';
}

/** Truncate a string to fit Discord's field limits */
export function truncate(str: string, maxLength: number = 128): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}
