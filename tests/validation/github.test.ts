import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchLatestRelease } from '../../src/validation/github.js';

describe('fetchLatestRelease', () => {
  const origToken = process.env.GITHUB_TOKEN;
  beforeEach(() => {
    delete process.env.GITHUB_TOKEN;
  });
  afterEach(() => {
    if (origToken !== undefined) process.env.GITHUB_TOKEN = origToken;
    else delete process.env.GITHUB_TOKEN;
  });

  it('returns null on 403 when no token is set (rate-limited gracefully)', async () => {
    const fetchImpl = vi.fn(async () => new Response('', { status: 403 })) as unknown as typeof fetch;
    const result = await fetchLatestRelease('vercel/next.js', fetchImpl);
    expect(result).toBeNull();
  });

  it('returns null for 404', async () => {
    const fetchImpl = vi.fn(async () => new Response('', { status: 404 })) as unknown as typeof fetch;
    const result = await fetchLatestRelease('not/found', fetchImpl);
    expect(result).toBeNull();
  });

  it('parses tag, date, and prerelease flag', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            tag_name: 'v15.0.0',
            published_at: '2024-10-21T12:00:00Z',
            prerelease: false,
          }),
          { status: 200 },
        ),
    ) as unknown as typeof fetch;
    const result = await fetchLatestRelease('vercel/next.js', fetchImpl);
    expect(result).toEqual({
      tagName: 'v15.0.0',
      publishedAt: '2024-10-21T12:00:00Z',
      isPrerelease: false,
    });
  });

  it('throws on non-OK non-403/404', async () => {
    const fetchImpl = vi.fn(async () => new Response('', { status: 500 })) as unknown as typeof fetch;
    await expect(fetchLatestRelease('foo/bar', fetchImpl)).rejects.toThrow(/500/);
  });
});