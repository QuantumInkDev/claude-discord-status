import { describe, it, expect } from 'vitest';
import { validateConfig } from './config.js';
import type { PluginConfig } from '../shared/types.js';

function makeConfig(overrides?: Partial<PluginConfig>): PluginConfig {
  return {
    discordAppId: '123456789',
    enabled: true,
    showProjectName: true,
    showFileName: false,
    showElapsedTime: true,
    idleTimeoutSeconds: 300,
    buttons: [],
    ...overrides,
  };
}

describe('validateConfig', () => {
  it('validates a correct config', () => {
    const result = validateConfig(makeConfig());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects missing discordAppId', () => {
    const result = validateConfig(makeConfig({ discordAppId: '' }));
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('discordAppId');
  });

  it('rejects more than 2 buttons', () => {
    const result = validateConfig(makeConfig({
      buttons: [
        { label: 'A', url: 'https://a.com' },
        { label: 'B', url: 'https://b.com' },
        { label: 'C', url: 'https://c.com' },
      ],
    }));
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('2 buttons');
  });

  it('rejects buttons without label or url', () => {
    const result = validateConfig(makeConfig({
      buttons: [{ label: '', url: 'https://a.com' }],
    }));
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('label and url');
  });

  it('accepts valid buttons', () => {
    const result = validateConfig(makeConfig({
      buttons: [
        { label: 'GitHub', url: 'https://github.com' },
        { label: 'Website', url: 'https://example.com' },
      ],
    }));
    expect(result.valid).toBe(true);
  });
});
