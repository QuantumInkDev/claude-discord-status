import { Client } from '@xhayper/discord-rpc';
import type { DiscordActivity } from '../shared/types.js';

export interface DiscordClientOptions {
  appId: string;
  onReady?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Wrapper around @xhayper/discord-rpc that handles
 * connection, reconnection, and activity updates.
 */
export class DiscordClient {
  private client: Client;
  private connected = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly reconnectIntervalMs = 15_000;
  private options: DiscordClientOptions;

  constructor(options: DiscordClientOptions) {
    this.options = options;
    this.client = this.createClient();
  }

  private createClient(): Client {
    const client = new Client({ clientId: this.options.appId });

    client.on('ready', () => {
      this.connected = true;
      this.cancelReconnect();
      this.options.onReady?.();
    });

    client.on('disconnected', () => {
      this.connected = false;
      this.options.onDisconnected?.();
      this.scheduleReconnect();
    });

    return client;
  }

  /** Connect to Discord IPC */
  async connect(): Promise<void> {
    try {
      await this.client.login();
    } catch (error) {
      this.connected = false;
      const err = error instanceof Error ? error : new Error(String(error));
      this.options.onError?.(err);
      this.scheduleReconnect();
    }
  }

  /** Update the Rich Presence activity */
  async setActivity(activity: DiscordActivity): Promise<void> {
    if (!this.connected) return;

    try {
      await this.client.user?.setActivity({
        details: activity.details,
        state: activity.state,
        startTimestamp: activity.startTimestamp
          ? new Date(activity.startTimestamp)
          : undefined,
        largeImageKey: activity.largeImageKey,
        largeImageText: activity.largeImageText,
        smallImageKey: activity.smallImageKey,
        smallImageText: activity.smallImageText,
        buttons: activity.buttons?.map((b) => ({
          label: b.label,
          url: b.url,
        })),
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.options.onError?.(err);
    }
  }

  /** Clear the Rich Presence */
  async clearActivity(): Promise<void> {
    if (!this.connected) return;

    try {
      await this.client.user?.clearActivity();
    } catch {
      // Swallow — clearing on disconnect is best-effort
    }
  }

  /** Disconnect from Discord */
  async disconnect(): Promise<void> {
    this.cancelReconnect();
    this.connected = false;

    try {
      await this.client.destroy();
    } catch {
      // Swallow — disconnecting is best-effort
    }
  }

  /** Whether the client is currently connected to Discord */
  isConnected(): boolean {
    return this.connected;
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      // Re-create client to get a fresh socket
      this.client = this.createClient();
      await this.connect();
    }, this.reconnectIntervalMs);
  }

  private cancelReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
