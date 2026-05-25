import { describe, expect, it, vi } from 'vitest';
import { fetchNpmPackageInfo } from '../../src/validation/npm.js';

function mockFetch(payload: unknown, status = 200): typeof fetch {
  return vi.fn(async () =>
    new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } }),
  ) as unknown as typeof fetch;
}

describe('fetchNpmPackageInfo', () => {
  it('returns null for 404', async () => {
    const fetchImpl = vi.fn(async () => new Response('', { status: 404 })) as unknown as typeof fetch;
    const info = await fetchNpmPackageInfo('totally-fake-pkg-xyz', fetchImpl);
    expect(info).toBeNull();
  });

  it('parses latest, deprecation, peerDeps, release date', async () => {
    const payload = {
      'dist-tags': { latest: '1.2.3' },
      versions: {
        '1.2.3': {
          deprecated: 'use new-pkg instead',
          peerDependencies: { react: '^18.0.0' },
        },
      },
      time: { '1.2.3': '2024-09-01T00:00:00.000Z' },
    };
    const info = await fetchNpmPackageInfo('some-pkg', mockFetch(payload));
    expect(info).not.toBeNull();
    expect(info?.latestVersion).toBe('1.2.3');
    expect(info?.deprecated).toBe(true);
    expect(info?.deprecationMessage).toContain('new-pkg');
    expect(info?.peerDependencies).toEqual({ react: '^18.0.0' });
    expect(info?.lastReleaseDate).toBe('2024-09-01T00:00:00.000Z');
    expect(info?.isPrerelease).toBe(false);
  });

  it('detects prerelease in latest version tag', async () => {
    const payload = {
      'dist-tags': { latest: '2.0.0-beta.4' },
      versions: { '2.0.0-beta.4': {} },
      time: { '2.0.0-beta.4': '2025-01-01T00:00:00.000Z' },
    };
    const info = await fetchNpmPackageInfo('beta-pkg', mockFetch(payload));
    expect(info?.isPrerelease).toBe(true);
    expect(info?.deprecated).toBe(false);
  });

  it('throws on non-OK non-404', async () => {
    const fetchImpl = vi.fn(async () => new Response('', { status: 500 })) as unknown as typeof fetch;
    await expect(fetchNpmPackageInfo('broken', fetchImpl)).rejects.toThrow(/500/);
  });
});