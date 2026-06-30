import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const fromRoot = (...parts: string[]) => path.join(process.cwd(), ...parts);
const read = (...parts: string[]) =>
  readFileSync(fromRoot(...parts), 'utf8');

describe('repo cleanup audit', () => {
  it('drops the fontawesome dependency and stale package entrypoint', () => {
    const pkg = JSON.parse(read('package.json')) as {
      main?: string;
      dependencies?: Record<string, string>;
    };

    expect(pkg.main).toBeUndefined();
    expect(pkg.dependencies?.['@fortawesome/fontawesome-free']).toBeUndefined();
  });

  it('uses local icons in entrypoints instead of fontawesome css', () => {
    expect(read('entrypoints', 'popup', 'main.tsx')).not.toContain('fontawesome-free');
    expect(read('entrypoints', 'setup', 'main.tsx')).not.toContain('fontawesome-free');
  });

  it('removes the dead popup message bridge and debug logging', () => {
    const background = read('entrypoints', 'background.ts');

    expect(background).not.toContain('chrome.runtime.onMessage.addListener');
    expect(background).not.toContain('console.log');
  });

  it('removes cleanup-only files and exports', () => {
    expect(existsSync(fromRoot('src', 'hooks', 'index.ts'))).toBe(false);
    expect(read('src', 'utils', 'icons.tsx')).not.toContain('BackIcon');
    expect(existsSync(fromRoot('src', 'api', 'arrApiBase.ts'))).toBe(false);
    expect(existsSync(fromRoot('src', 'api', 'sonarrApi.ts'))).toBe(false);
    expect(existsSync(fromRoot('src', 'api', 'radarrApi.ts'))).toBe(false);
  });
});
