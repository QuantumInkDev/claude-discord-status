import type {
  SessionState,
  HookMessage,
  DiscordActivity,
  PluginConfig,
} from '../shared/types.js';
import {
  DISCORD_RATE_LIMIT_MS,
  SESSION_IDLE_TIMEOUT_MS,
  APP_ASSETS,
  ACTION_ASSETS,
} from '../shared/constants.js';
import { truncate } from '../shared/platform.js';

/**
 * Manages all active Claude sessions and decides
 * which one to display in Discord Rich Presence.
 *
 * Enforces the 15-second rate limit and selects
 * the most-recently-active session for display.
 */
export class StateManager {
  private sessions = new Map<string, SessionState>();
  private lastUpdateSentAt = 0;
  private pendingUpdate: DiscordActivity | null = null;
  private rateLimitTimer: ReturnType<typeof setTimeout> | null = null;
  private onActivityChange: (activity: DiscordActivity | null) => void;
  private config: PluginConfig;

  constructor(
    config: PluginConfig,
    onActivityChange: (activity: DiscordActivity | null) => void,
  ) {
    this.config = config;
    this.onActivityChange = onActivityChange;
  }

  /** Process an incoming message from a hook script */
  handleMessage(message: HookMessage): void {
    switch (message.type) {
      case 'register':
        this.registerSession(message);
        break;
      case 'update':
        this.updateSession(message);
        break;
      case 'deregister':
        this.deregisterSession(message.sessionId);
        break;
    }
  }

  /** Get the number of active sessions */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /** Check if there are any active sessions */
  hasActiveSessions(): boolean {
    return this.sessions.size > 0;
  }

  /** Clean up idle sessions that haven't sent updates */
  pruneIdleSessions(): void {
    const now = Date.now();
    const idleThreshold = now - SESSION_IDLE_TIMEOUT_MS;

    for (const [id, session] of this.sessions) {
      if (session.lastUpdatedAt < idleThreshold) {
        this.sessions.delete(id);
      }
    }

    this.scheduleUpdate();
  }

  /** Update the config (e.g., after user changes settings) */
  updateConfig(config: PluginConfig): void {
    this.config = config;
    this.scheduleUpdate();
  }

  /** Clean up timers */
  destroy(): void {
    if (this.rateLimitTimer) {
      clearTimeout(this.rateLimitTimer);
      this.rateLimitTimer = null;
    }
  }

  private registerSession(message: HookMessage): void {
    const session: SessionState = {
      sessionId: message.sessionId,
      appType: message.payload.appType ?? 'code',
      project: message.payload.project ?? 'Unknown Project',
      action: message.payload.action ?? 'Starting session',
      actionCategory: message.payload.actionCategory ?? 'idle',
      startedAt: message.timestamp,
      lastUpdatedAt: message.timestamp,
    };

    this.sessions.set(message.sessionId, session);
    this.scheduleUpdate();
  }

  private updateSession(message: HookMessage): void {
    const session = this.sessions.get(message.sessionId);
    if (!session) {
      // Session not registered — register it implicitly
      this.registerSession(message);
      return;
    }

    if (message.payload.project !== undefined) {
      session.project = message.payload.project;
    }
    if (message.payload.action !== undefined) {
      session.action = message.payload.action;
    }
    if (message.payload.actionCategory !== undefined) {
      session.actionCategory = message.payload.actionCategory;
    }
    if (message.payload.appType !== undefined) {
      session.appType = message.payload.appType;
    }

    session.lastUpdatedAt = message.timestamp;
    this.scheduleUpdate();
  }

  private deregisterSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.scheduleUpdate();
  }

  /** Select the most-recently-active session */
  private getActiveSession(): SessionState | null {
    let active: SessionState | null = null;

    for (const session of this.sessions.values()) {
      if (!active || session.lastUpdatedAt > active.lastUpdatedAt) {
        active = session;
      }
    }

    return active;
  }

  /** Build the Discord activity from the active session */
  buildActivity(): DiscordActivity | null {
    const session = this.getActiveSession();
    if (!session) return null;

    const appAsset = APP_ASSETS[session.appType] ?? APP_ASSETS['code']!;
    const actionAsset = ACTION_ASSETS[session.actionCategory] ?? ACTION_ASSETS['idle']!;

    const activity: DiscordActivity = {
      details: truncate(session.action),
      largeImageKey: appAsset.largeImageKey,
      largeImageText: appAsset.largeImageText,
      smallImageKey: actionAsset.smallImageKey,
      smallImageText: actionAsset.smallImageText,
    };

    if (this.config.showProjectName) {
      activity.state = truncate(`Working in ${session.project}`);
    }

    if (this.config.showElapsedTime) {
      activity.startTimestamp = session.startedAt;
    }

    if (this.config.buttons.length > 0) {
      activity.buttons = this.config.buttons.slice(0, 2);
    }

    return activity;
  }

  /** Schedule an activity update, respecting the rate limit */
  private scheduleUpdate(): void {
    const activity = this.buildActivity();
    this.pendingUpdate = activity;

    const now = Date.now();
    const elapsed = now - this.lastUpdateSentAt;

    if (elapsed >= DISCORD_RATE_LIMIT_MS) {
      this.flushUpdate();
    } else if (!this.rateLimitTimer) {
      const delay = DISCORD_RATE_LIMIT_MS - elapsed;
      this.rateLimitTimer = setTimeout(() => {
        this.rateLimitTimer = null;
        this.flushUpdate();
      }, delay);
    }
    // If timer already running, the pending update will be sent when it fires
  }

  private flushUpdate(): void {
    this.lastUpdateSentAt = Date.now();
    this.onActivityChange(this.pendingUpdate);
    this.pendingUpdate = null;
  }
}
