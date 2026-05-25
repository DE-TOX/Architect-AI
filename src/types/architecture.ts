import { z } from 'zod';

export const ConfidenceSchema = z.number().min(0).max(100);

export const StackRecommendationSchema = z.object({
  layer: z.string(),
  name: z.string().describe('Display name, e.g. "Next.js 15"'),
  npmPackage: z.string().optional().describe('Primary npm package name for compatibility checks'),
  githubRepo: z.string().optional().describe('owner/repo for GitHub release lookups'),
  rationale: z.string(),
  benefits: z.array(z.string()).min(1),
  tradeoffs: z.array(z.string()).min(1),
  maturity: z.enum(['experimental', 'beta', 'stable', 'mature']),
  confidence: ConfidenceSchema,
});

export type StackRecommendation = z.infer<typeof StackRecommendationSchema>;

export const ADRSchema = z.object({
  id: z.string().describe('e.g. ADR-001'),
  title: z.string(),
  status: z.enum(['proposed', 'accepted', 'deprecated']).default('accepted'),
  decision: z.string(),
  reasons: z.array(z.string()).min(1),
  tradeoffs: z.array(z.string()).min(1), 
  alternatives: z.array(z.string()).default([]),
});
export type ADR = z.infer<typeof ADRSchema>;

export const ComplexityTierSchema = z.enum(['simple', 'moderate', 'advanced', 'enterprise']);
export type ComplexityTier = z.infer<typeof ComplexityTierSchema>;

export const EstimationsSchema = z.object({
  mvpDuration: z.string().describe('e.g. "2 weeks", "6 weeks"'),
  teamSize: z.string().describe('e.g. "1 dev", "2 devs + 1 designer"'),
  monthlyInfraCostUsd: z.string().describe('e.g. "$20-50", "$200-500"'),
  complexity: ComplexityTierSchema,
  scalabilityTier: z.string().describe('e.g. "horizontal to 100k users without redesign"'),
});
export type Estimations = z.infer<typeof EstimationsSchema>;

export const ArchitectureSchema = z.object({
  layers: z.object({
    frontend: StackRecommendationSchema,
    backend: StackRecommendationSchema,
    database: StackRecommendationSchema,
    deployment: StackRecommendationSchema,
    auth: StackRecommendationSchema,
    caching: StackRecommendationSchema,
    observability: StackRecommendationSchema,
  }),
  adrs: z.array(ADRSchema).min(3).max(8),
  estimations: EstimationsSchema,
});
export type Architecture = z.infer<typeof ArchitectureSchema>;

export type LayerKey =
  | 'frontend'
  | 'backend'
  | 'database'
  | 'deployment'
  | 'auth'
  | 'caching'
  | 'observability';

export const LAYER_ORDER: readonly LayerKey[] = [
  'frontend',
  'backend',
  'database',
  'auth',
  'caching',
  'deployment',
  'observability',
] as const;
