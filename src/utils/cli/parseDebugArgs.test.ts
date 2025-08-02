import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { parseDebugArgs } from './parseDebugArgs';

describe('utils/cli/parseDebugArgs()', () => {
  let originalArgv: string[];

  beforeEach(() => {
    originalArgv = [...process.argv]; // snapshot argv to keep tests isolated
  });

  afterEach(() => {
    process.argv = originalArgv;
  });

  describe('no --debug flag', () => {
    it('returns { enabled: false } when flag is not present', () => {
      process.argv = ['node', 'script.js', 'foo', 'bar'];
      const result = parseDebugArgs();

      expect(result).toEqual({ enabled: false });
    });

    it('handles empty argv array defensively', () => {
      // Node normally guarantees at least two entries, but the function should be resilient
      process.argv = [];
      const result = parseDebugArgs();

      expect(result).toEqual({ enabled: false });
    });

    it('--debug as the last token yields default mode', () => {
      process.argv = ['node', 'script.js', 'foo', '--debug'];
      const result = parseDebugArgs();

      expect(result).toEqual({ enabled: true, mode: 'default' });
    });
  });

  describe('--debug without an "path" argument', () => {
    it('returns default mode when next token is missing', () => {
      process.argv = ['node', 'script.js', '--debug'];
      const result = parseDebugArgs();

      expect(result).toEqual({ enabled: true, mode: 'default' });
    });

    it('returns default mode when next token is another flag', () => {
      process.argv = ['node', 'script.js', '--debug', '--other'];
      const result = parseDebugArgs();

      expect(result).toEqual({ enabled: true, mode: 'default' });
    });
  });

  describe('--debug with absolute path', () => {
    it('returns path mode with given absolute path (POSIX style)', () => {
      const absPath = '/tmp/debug.log';
      process.argv = ['node', 'script.js', '--debug', absPath];
      const result = parseDebugArgs();

      expect(result).toEqual({ enabled: true, mode: 'path', path: absPath });
    });
  });

  describe('--debug with relative path', () => {
    it('throws for relative path without dot segments', () => {
      const relPath = 'relative/debug.log';
      process.argv = ['node', 'script.js', '--debug', relPath];

      expect(() => parseDebugArgs()).toThrow(`Invalid debug path: "${relPath}". Debug path must be an absolute path.`);
    });

    it('throws for ./debug.log', () => {
      const relDot = './debug.log';
      process.argv = ['node', 'script.js', '--debug', relDot];

      expect(() => parseDebugArgs()).toThrow(`Invalid debug path: "${relDot}". Debug path must be an absolute path.`);
    });

    it('throws for ../debug.log', () => {
      const relParent = '../debug.log';
      process.argv = ['node', 'script.js', '--debug', relParent];

      expect(() => parseDebugArgs()).toThrow(`Invalid debug path: "${relParent}". Debug path must be an absolute path.`);
    });
  });
});
