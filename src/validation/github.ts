export interface GithubReleaseInfo {
  tagName: string;
  publishedAt: string;
  isPrerelease: boolean;
}

interface GithubReleaseResponse {
  tag_name: string;
  published_at: string;
  prerelease: boolean;
}

export async function fetchLatestRelease(
  ownerRepo: string,
  fetchImpl: typeof fetch = fetch,
): Promise<GithubReleaseInfo | null> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'architect-ai',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = `https://api.github.com/repos/${ownerRepo}/releases/latest`;
  const res = await fetchImpl(url, { headers });

  if (res.status === 404) return null;
  if (res.status === 403 && !token) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`GitHub releases error for "${ownerRepo}": ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as GithubReleaseResponse;
  return {
    tagName: data.tag_name,
    publishedAt: data.published_at,
    isPrerelease: data.prerelease,
  };
}