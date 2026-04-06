/** The Claude application type detected from environment */
export type AppType = 'code' | 'desktop' | 'cowork' | 'chat';

/** Actions that map to what the user is doing */
export type ActionCategory = 'editing' | 'running' | 'exploring' | 'chatting' | 'idle';

/** Message sent from hook scripts to the daemon via IPC */
export interface HookMessage {
  type: 'register' | 'update' | 'deregister';
  sessionId: string;
  timestamp: number;
  payload: {
    appType?: AppType;
    project?: string;
    action?: string;
    actionCategory?: ActionCategory;
    details?: string;
    /** PID of the Claude Code process that owns this session */
    ownerPid?: number;
  };
}

/** State tracked per active Claude session */
export interface SessionState {
  sessionId: string;
  appType: AppType;
  project: string;
  action: string;
  actionCategory: ActionCategory;
  startedAt: number;
  lastUpdatedAt: number;
  /** PID of the Claude Code process — used to detect dead sessions */
  ownerPid?: number;
}

/** User-facing plugin configuration */
export interface PluginConfig {
  discordAppId: string;
  enabled: boolean;
  showProjectName: boolean;
  showFileName: boolean;
  showElapsedTime: boolean;
  idleTimeoutSeconds: number;
  buttons: Array<{
    label: string;
    url: string;
  }>;
}

/** Discord activity payload (subset of what discord-rpc expects) */
export interface DiscordActivity {
  details?: string;
  state?: string;
  startTimestamp?: number;
  largeImageKey?: string;
  largeImageText?: string;
  smallImageKey?: string;
  smallImageText?: string;
  buttons?: Array<{
    label: string;
    url: string;
  }>;
}

/** Daemon status for health checks */
export interface DaemonStatus {
  pid: number;
  startedAt: number;
  activeSessions: number;
  discordConnected: boolean;
}
