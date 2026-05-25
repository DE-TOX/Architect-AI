import { z } from 'zod';

export const ValidationFlagSchema = z.enum([
  'deprecated',
  'stale-release',
  'peer-dep-conflict',
  'prerelease',
  'not-found',
  'fetch-failed',
]);
export type ValidationFlag = z.infer<typeof ValidationFlagSchema>;

export const ValidationResultSchema = z.object({
  layer: z.string(),
  technology: z.string(),
  npmPackage: z.string().optional(),
  githubRepo: z.string().optional(),
  latestVersion: z.string().optional(),
  lastReleaseDate: z.string().optional().describe('ISO date'),
  deprecationMessage: z.string().optional(),
  peerDepConflicts: z.array(z.string()).default([]),
  flags: z.array(ValidationFlagSchema).default([]),
  confidence: z.number().min(0).max(100),
  notes: z.array(z.string()).default([]),
});
export type ValidationResult = z.infer<typeof ValidationResultSchema>;