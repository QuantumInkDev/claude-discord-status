import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StateManager } from './state-manager.js';
import type { PluginConfig, HookMessage, DiscordActivity } from '../shared/types.js';

function makeConfig(overrides?: Partial<PluginConfig>): PluginConfig {
  return {
    discordAppId: 'test-app-id',
    enabled: true,
    showProjectName: true,
    showFileName: false,
    showElapsedTime: true,
    idleTimeoutSeconds: 300,
    buttons: [],
    ...overrides,
  };
}

function makeMessage(overrides?: Partial<HookMessage>): HookMessage {
  return {
    type: 'register',
    sessionId: 'session-1',
    timestamp: Date.now(),
    payload: {
      appType: 'code',
      project: 'my-project',
      action: 'Starting session',
      actionCategory: 'idle',
    },
    ...overrides,
  };
}

describe('StateManager', () => {
  let lastActivity: DiscordActivity | null | undefined;
  let stateManager: StateManager;

  beforeEach(() => {
    vi.useFakeTimers();
    lastActivity = undefined;
    stateManager = new StateManager(makeConfig(), (activity) => {
      lastActivity = activity;
    });
  });

  afterEach(() => {
    stateManager.destroy();
    vi.useRealTimers();
  });

  it('registers a session and emits activity', () => {
    stateManager.handleMessage(makeMessage());

    // Activity should be emitted immediately (first update, no rate limit)
    expect(lastActivity).not.toBeUndefined();
    expect(lastActivity?.details).toBe('Starting session');
    expect(lastActivity?.state).toBe('Working in my-project');
    expect(lastActivity?.largeImageKey).toBe('claude_code');
  });

  it('updates session action', () => {
    stateManager.handleMessage(makeMessage());

    // Advance past rate limit
    vi.advanceTimersByTime(16_000);

    stateManager.handleMessage(makeMessage({
      type: 'update',
      payload: {
        action: 'Editing index.ts',
        actionCategory: 'editing',
      },
    }));

    expect(lastActivity?.details).toBe('Editing index.ts');
  });

  it('deregisters a session and clears activity', () => {
    stateManager.handleMessage(makeMessage());
    vi.advanceTimersByTime(16_000);

    stateManager.handleMessage(makeMessage({
      type: 'deregister',
      payload: {},
    }));

    expect(lastActivity).toBeNull();
  });

  it('selects most-recently-active session', () => {
    const now = Date.now();

    stateManager.handleMessage(makeMessage({
      sessionId: 'session-1',
      timestamp: now,
      payload: {
        appType: 'code',
        project: 'project-a',
        action: 'Editing a.ts',
        actionCategory: 'editing',
      },
    }));

    vi.advanceTimersByTime(16_000);

    stateManager.handleMessage(makeMessage({
      type: 'register',
      sessionId: 'session-2',
      timestamp: now + 1000,
      payload: {
        appType: 'desktop',
        project: 'project-b',
        action: 'Chatting',
        actionCategory: 'chatting',
      },
    }));

    // Session 2 is more recent, should be displayed
    expect(lastActivity?.details).toBe('Chatting');
    expect(lastActivity?.largeImageKey).toBe('claude_desktop');
  });

  it('rate-limits updates to 15 seconds', () => {
    const callback = vi.fn();
    const sm = new StateManager(makeConfig(), callback);

    // First message — should emit immediately
    sm.handleMessage(makeMessage({ timestamp: Date.now() }));
    expect(callback).toHaveBeenCalledTimes(1);

    // Second message within 15s — should NOT emit yet
    sm.handleMessage(makeMessage({
      type: 'update',
      timestamp: Date.now(),
      payload: { action: 'Editing file.ts', actionCategory: 'editing' },
    }));
    expect(callback).toHaveBeenCalledTimes(1);

    // Advance past rate limit
    vi.advanceTimersByTime(16_000);
    expect(callback).toHaveBeenCalledTimes(2);

    sm.destroy();
  });

  it('hides project name when config says so', () => {
    const sm = new StateManager(
      makeConfig({ showProjectName: false }),
      (activity) => { lastActivity = activity; },
    );

    sm.handleMessage(makeMessage());
    expect(lastActivity?.state).toBeUndefined();

    sm.destroy();
  });

  it('hides elapsed time when config says so', () => {
    const sm = new StateManager(
      makeConfig({ showElapsedTime: false }),
      (activity) => { lastActivity = activity; },
    );

    sm.handleMessage(makeMessage());
    expect(lastActivity?.startTimestamp).toBeUndefined();

    sm.destroy();
  });

  it('includes buttons from config', () => {
    const sm = new StateManager(
      makeConfig({
        buttons: [{ label: 'GitHub', url: 'https://github.com' }],
      }),
      (activity) => { lastActivity = activity; },
    );

    sm.handleMessage(makeMessage());
    expect(lastActivity?.buttons).toHaveLength(1);
    expect(lastActivity?.buttons?.[0]?.label).toBe('GitHub');

    sm.destroy();
  });

  it('implicitly registers on update for unknown session', () => {
    stateManager.handleMessage(makeMessage({
      type: 'update',
      sessionId: 'new-session',
      payload: {
        appType: 'code',
        project: 'project-x',
        action: 'Editing foo.ts',
        actionCategory: 'editing',
      },
    }));

    expect(lastActivity?.details).toBe('Editing foo.ts');
    expect(stateManager.getSessionCount()).toBe(1);
  });

  it('reports correct session count', () => {
    expect(stateManager.getSessionCount()).toBe(0);
    expect(stateManager.hasActiveSessions()).toBe(false);

    stateManager.handleMessage(makeMessage({ sessionId: 'a' }));
    expect(stateManager.getSessionCount()).toBe(1);
    expect(stateManager.hasActiveSessions()).toBe(true);

    stateManager.handleMessage(makeMessage({ sessionId: 'b', type: 'register' }));
    expect(stateManager.getSessionCount()).toBe(2);
  });
});
