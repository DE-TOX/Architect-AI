import type { Architecture, StackRecommendation } from '../types/architecture.js';
import { LAYER_ORDER } from '../types/architecture.js';
import type { ValidationFlag, ValidationResult } from '../types/validation.js';
import { fetchLatestRelease } from '../validation/github.js';
import { fetchNpmPackageInfo, type NpmPackageInfo } from '../validation/npm.js';
import { adjustConfidence, isStale } from '../utils/confidence.js';

const semverRangeOk = (range: string, version: string): boolean => {
  const cleanedRange = range.trim();
  const major = version.split('.')[0];
  if (!major) return true;
  if (cleanedRange === '*' || cleanedRange === '') return true;
  if (cleanedRange.includes(major)) return true;
  return false;
};

export interface ValidatedArchitecture {
  architecture: Architecture;
  results: ValidationResult[];
}

export async function validateArchitecture(
  architecture: Architecture,
): Promise<ValidatedArchitecture> {
  const cache = new Map<string, NpmPackageInfo | null>();
  const npmFetches: Array<{ pkg: string; layer: string }> = [];

  for (const layerKey of LAYER_ORDER) {
    const rec = architecture.layers[layerKey];
    if (rec.npmPackage) npmFetches.push({ pkg: rec.npmPackage, layer: layerKey });
  }

  await Promise.all(
    npmFetches.map(async ({ pkg }) => {
      if (cache.has(pkg)) return;
      try {
        const info = await fetchNpmPackageInfo(pkg);
        cache.set(pkg, info);
      } catch {
        cache.set(pkg, null);
      }
    }),
  );

  const installedVersions = new Map<string, string>();
  for (const [pkg, info] of cache) {
    if (info) installedVersions.set(pkg, info.latestVersion);
  }

  const results: ValidationResult[] = [];
  const updatedLayers = { ...architecture.layers };

  for (const layerKey of LAYER_ORDER) {
    const rec = architecture.layers[layerKey];
    const result = await buildResult(rec, layerKey, cache, installedVersions);
    results.push(result);
    updatedLayers[layerKey] = { ...rec, confidence: result.confidence };
  }

  return {
    architecture: { ...architecture, layers: updatedLayers },
    results,
  };
}

async function buildResult(
  rec: StackRecommendation,
  layerKey: string,
  cache: Map<string, NpmPackageInfo | null>,
  installedVersions: Map<string, string>,
): Promise<ValidationResult> {
  const flags: ValidationFlag[] = [];
  const notes: string[] = [];
  const peerDepConflicts: string[] = [];
  let latestVersion: string | undefined;
  let lastReleaseDate: string | undefined;
  let deprecationMessage: string | undefined;
  let fetchFailed = false;

  if (rec.npmPackage) {
    const info = cache.get(rec.npmPackage);
    if (info === null) {
      flags.push('fetch-failed');
      notes.push(`Could not look up ${rec.npmPackage} on npm.`);
      fetchFailed = true;
    } else if (info === undefined) {
      flags.push('not-found');
      notes.push(`Package "${rec.npmPackage}" was not found on the npm registry.`);
    } else {
      latestVersion = info.latestVersion;
      lastReleaseDate = info.lastReleaseDate;
      if (info.deprecated) {
        flags.push('deprecated');
        deprecationMessage = info.deprecationMessage ?? 'Marked deprecated on npm.';
      }
      if (info.isPrerelease) flags.push('prerelease');
      if (isStale(info.lastReleaseDate)) {
        flags.push('stale-release');
        notes.push(
          `Last release was ${lastReleaseDate ?? 'unknown'} — more than 180 days ago.`,
        );
      }
      for (const [peer, range] of Object.entries(info.peerDependencies)) {
        const resolved = installedVersions.get(peer);
        if (resolved && !semverRangeOk(range, resolved)) {
          peerDepConflicts.push(`${peer}@${resolved} does not satisfy ${peer}@${range}`);
        }
      }
      if (peerDepConflicts.length > 0) flags.push('peer-dep-conflict');
    }
  }

  if (rec.githubRepo && (!lastReleaseDate || fetchFailed)) {
    try {
      const release = await fetchLatestRelease(rec.githubRepo);
      if (release) {
        if (!lastReleaseDate) lastReleaseDate = release.publishedAt;
        if (release.isPrerelease && !flags.includes('prerelease')) flags.push('prerelease');
        if (isStale(release.publishedAt) && !flags.includes('stale-release')) {
          flags.push('stale-release');
          notes.push(
            `Latest GitHub release (${release.tagName}) was ${release.publishedAt} — more than 180 days ago.`,
          );
        }
      }
    } catch {
      // Silent skip — GitHub rate limits without a token are common.
    }
  }

  const confidence = adjustConfidence(rec.confidence, {
    deprecated: flags.includes('deprecated'),
    prerelease: flags.includes('prerelease'),
    staleRelease: flags.includes('stale-release'),
    peerDepConflicts: peerDepConflicts.length,
    notFound: flags.includes('not-found'),
  });

  return {
    layer: layerKey,
    technology: rec.name,
    npmPackage: rec.npmPackage,
    githubRepo: rec.githubRepo,
    latestVersion,
    lastReleaseDate,
    deprecationMessage,
    peerDepConflicts,
    flags,
    confidence,
    notes,
  };
}