const STALE_DAYS = 180;

export interface ConfidencePenalties {
  deprecated?: boolean;
  prerelease?: boolean;
  staleRelease?: boolean;
  peerDepConflicts?: number;
  notFound?: boolean;
}

export function adjustConfidence(base: number, penalties: ConfidencePenalties): number {
  let score = base;
  if (penalties.deprecated) score -= 60;
  if (penalties.notFound) score -= 40;
  if (penalties.prerelease) score -= 15;
  if (penalties.staleRelease) score -= 10;
  if (penalties.peerDepConflicts) score -= 8 * penalties.peerDepConflicts;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function isStale(isoDate: string | undefined, now: Date = new Date()): boolean {
  if (!isoDate) return false;
  const released = new Date(isoDate);
  if (Number.isNaN(released.getTime())) return false;
  const ageDays = (now.getTime() - released.getTime()) / (1000 * 60 * 60 * 24);
  return ageDays > STALE_DAYS;
}