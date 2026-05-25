export interface NpmPackageInfo {
  name: string;
  latestVersion: string;
  deprecated: boolean;
  deprecationMessage?: string;
  peerDependencies: Record<string, string>;
  lastReleaseDate?: string;
  isPrerelease: boolean;
}

interface NpmRegistryResponse {
  'dist-tags'?: { latest?: string };
  versions?: Record<
    string,
    {
      deprecated?: string | boolean;
      peerDependencies?: Record<string, string>;
    }
  >;
  time?: Record<string, string>;
}

const NPM_REGISTRY = 'https://registry.npmjs.org';

const PRERELEASE_RE = /-(alpha|beta|rc|next|canary|preview)/i;

export async function fetchNpmPackageInfo(
  pkg: string,
  fetchImpl: typeof fetch = fetch,
): Promise<NpmPackageInfo | null> {
  const url = `${NPM_REGISTRY}/${encodeURIComponent(pkg).replace('%40', '@')}`;
  const res = await fetchImpl(url, {
    headers: { Accept: 'application/vnd.npm.install-v1+json, application/json' },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`npm registry error for "${pkg}": ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as NpmRegistryResponse;
  const latest = data['dist-tags']?.latest;
  if (!latest) {
    throw new Error(`npm registry for "${pkg}" had no dist-tags.latest`);
  }
  const versionInfo = data.versions?.[latest];
  const deprecatedRaw = versionInfo?.deprecated;
  const deprecated = Boolean(deprecatedRaw);
  const deprecationMessage = typeof deprecatedRaw === 'string' ? deprecatedRaw : undefined;
  return {
    name: pkg,
    latestVersion: latest,
    deprecated,
    deprecationMessage,
    peerDependencies: versionInfo?.peerDependencies ?? {},
    lastReleaseDate: data.time?.[latest],
    isPrerelease: PRERELEASE_RE.test(latest),
  };
}