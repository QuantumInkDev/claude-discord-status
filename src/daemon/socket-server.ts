import { createServer, type Server, type Socket } from 'node:net';
import { unlinkSync, existsSync } from 'node:fs';
import type { HookMessage } from '../shared/types.js';

export interface SocketServerOptions {
  socketPath: string;
  onMessage: (message: HookMessage) => void;
  onError?: (error: Error) => void;
}

/**
 * NDJSON server over Unix domain socket (or named pipe on Windows).
 * Receives messages from hook scripts and forwards them to the StateManager.
 */
export class SocketServer {
  private server: Server | null = null;
  private connections = new Set<Socket>();
  private options: SocketServerOptions;

  constructor(options: SocketServerOptions) {
    this.options = options;
  }

  /** Start listening for connections */
  async start(): Promise<void> {
    // Clean up stale socket file
    if (existsSync(this.options.socketPath)) {
      try {
        unlinkSync(this.options.socketPath);
      } catch {
        // May fail on Windows named pipes — that's ok
      }
    }

    return new Promise((resolve, reject) => {
      this.server = createServer((socket) => {
        this.handleConnection(socket);
      });

      this.server.on('error', (error) => {
        this.options.onError?.(error);
        reject(error);
      });

      this.server.listen(this.options.socketPath, () => {
        resolve();
      });
    });
  }

  /** Stop the server and close all connections */
  async stop(): Promise<void> {
    for (const conn of this.connections) {
      conn.destroy();
    }
    this.connections.clear();

    return new Promise((resolve) => {
      if (!this.server) {
        resolve();
        return;
      }

      this.server.close(() => {
        // Clean up socket file
        try {
          if (existsSync(this.options.socketPath)) {
            unlinkSync(this.options.socketPath);
          }
        } catch {
          // Best effort
        }
        resolve();
      });
    });
  }

  private handleConnection(socket: Socket): void {
    this.connections.add(socket);

    let buffer = '';

    socket.on('data', (chunk) => {
      buffer += chunk.toString();

      // Process complete NDJSON lines
      const lines = buffer.split('\n');
      // Keep the last incomplete line in the buffer
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const message: unknown = JSON.parse(trimmed);
          if (isValidHookMessage(message)) {
            this.options.onMessage(message);
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    });

    socket.on('close', () => {
      this.connections.delete(socket);
    });

    socket.on('error', () => {
      this.connections.delete(socket);
    });
  }
}

/** Type guard for HookMessage */
function isValidHookMessage(value: unknown): value is HookMessage {
  if (typeof value !== 'object' || value === null) return false;

  const obj = value as Record<string, unknown>;
  return (
    typeof obj['type'] === 'string' &&
    ['register', 'update', 'deregister'].includes(obj['type'] as string) &&
    typeof obj['sessionId'] === 'string' &&
    typeof obj['timestamp'] === 'number' &&
    typeof obj['payload'] === 'object' &&
    obj['payload'] !== null
  );
}
