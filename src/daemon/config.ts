import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { getConfigPath, DEFAULT_DISCORD_APP_ID } from '../shared/constants.js';
import type { PluginConfig } from '../shared/types.js';

const DEFAULT_CONFIG: PluginConfig = {
  discordAppId: DEFAULT_DISCORD_APP_ID,
  enabled: true,
  showProjectName: true,
  showFileName: false,
  showElapsedTime: true,
  idleTimeoutSeconds: 300,
  buttons: [],
};

/** Load the plugin config from disk, merging with defaults */
export function loadConfig(): PluginConfig {
  const configPath = getConfigPath();

  try {
    const raw = readFileSync(configPath, 'utf-8');
    const parsed: unknown = JSON.parse(raw);

    if (typeof parsed !== 'object' || parsed === null) {
      return { ...DEFAULT_CONFIG };
    }

    return {
      ...DEFAULT_CONFIG,
      ...(parsed as Partial<PluginConfig>),
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

/** Save the plugin config to disk */
export function saveConfig(config: PluginConfig): void {
  const configPath = getConfigPath();

  try {
    mkdirSync(dirname(configPath), { recursive: true });
    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`Failed to save config: ${err.message}`);
  }
}

/** Validate that the config has a Discord App ID set */
export function validateConfig(config: PluginConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.discordAppId) {
    errors.push('discordAppId is required. Create a Discord Application at https://discord.com/developers/applications');
  }

  if (config.buttons.length > 2) {
    errors.push('Discord allows a maximum of 2 buttons');
  }

  for (const button of config.buttons) {
    if (!button.label || !button.url) {
      errors.push('Each button must have a label and url');
    }
  }

  return { valid: errors.length === 0, errors };
}
