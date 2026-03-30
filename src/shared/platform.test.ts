import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { detectAppType, extractProjectName, mapToolToAction, truncate } from './platform.js';

describe('detectAppType', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns "cowork" when COWORK_SESSION is set', () => {
    process.env['COWORK_SESSION'] = '1';
    expect(detectAppType()).toBe('cowork');
  });

  it('returns "desktop" when CLAUDE_DESKTOP is set', () => {
    process.env['CLAUDE_DESKTOP'] = '1';
    expect(detectAppType()).toBe('desktop');
  });

  it('returns "code" by default', () => {
    delete process.env['COWORK_SESSION'];
    delete process.env['CLAUDE_DESKTOP'];
    expect(detectAppType()).toBe('code');
  });

  it('prioritizes cowork over desktop', () => {
    process.env['COWORK_SESSION'] = '1';
    process.env['CLAUDE_DESKTOP'] = '1';
    expect(detectAppType()).toBe('cowork');
  });
});

describe('extractProjectName', () => {
  it('extracts the last directory segment', () => {
    expect(extractProjectName('/Users/dev/my-project')).toBe('my-project');
  });

  it('handles Windows-style paths', () => {
    expect(extractProjectName('C:\\Users\\dev\\my-project')).toBe('my-project');
  });

  it('returns "Unknown Project" for empty string', () => {
    expect(extractProjectName('')).toBe('Unknown Project');
  });
});

describe('mapToolToAction', () => {
  it('maps Write to editing with filename', () => {
    const result = mapToolToAction('Write', { file_path: '/src/index.ts' });
    expect(result.action).toBe('Editing index.ts');
    expect(result.category).toBe('editing');
  });

  it('maps Edit to editing with filename', () => {
    const result = mapToolToAction('Edit', { file_path: '/src/app.tsx' });
    expect(result.action).toBe('Editing app.tsx');
    expect(result.category).toBe('editing');
  });

  it('maps Write without file_path', () => {
    const result = mapToolToAction('Write', {});
    expect(result.action).toBe('Editing a file');
    expect(result.category).toBe('editing');
  });

  it('maps Bash to running', () => {
    const result = mapToolToAction('Bash');
    expect(result.action).toBe('Running a command');
    expect(result.category).toBe('running');
  });

  it('maps Read to exploring', () => {
    const result = mapToolToAction('Read');
    expect(result.action).toBe('Exploring codebase');
    expect(result.category).toBe('exploring');
  });

  it('maps Glob to exploring', () => {
    const result = mapToolToAction('Glob');
    expect(result.action).toBe('Exploring codebase');
    expect(result.category).toBe('exploring');
  });

  it('maps Agent to running', () => {
    const result = mapToolToAction('Agent');
    expect(result.action).toBe('Working with agents');
    expect(result.category).toBe('running');
  });

  it('maps unknown tools to idle', () => {
    const result = mapToolToAction('SomeUnknownTool');
    expect(result.action).toBe('Working');
    expect(result.category).toBe('idle');
  });
});

describe('truncate', () => {
  it('returns short strings unchanged', () => {
    expect(truncate('hello', 128)).toBe('hello');
  });

  it('truncates long strings with ellipsis', () => {
    const long = 'a'.repeat(200);
    const result = truncate(long, 128);
    expect(result.length).toBe(128);
    expect(result.endsWith('...')).toBe(true);
  });

  it('handles exact length', () => {
    const exact = 'a'.repeat(128);
    expect(truncate(exact, 128)).toBe(exact);
  });
});
