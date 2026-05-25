import { z } from 'zod';

export const ArchitectureModeSchema = z.enum([
  'mvp',
  'enterprise',
  'cost-optimized',
  'ai-native',
  'rapid-prototype',
  'oss-only',
]);
export type ArchitectureMode = z.infer<typeof ArchitectureModeSchema>;

export const ARCHITECTURE_MODE_LABELS: Record<ArchitectureMode, string> = {
  mvp: 'MVP — ship fast, accept some tech debt',
  enterprise: 'Enterprise — compliance, scale, observability',
  'cost-optimized': 'Cost Optimized — minimize infra spend',
  'ai-native': 'AI-Native — LLM-first product',
  'rapid-prototype': 'Rapid Prototype — throwaway demo',
  'oss-only': 'OSS-Only — no proprietary services',
};

export const ProjectProfileSchema = z.object({
  projectName: z.string().min(1),
  projectType: z.string().min(1).describe('e.g. SaaS web app, mobile app, CLI tool, internal dashboard'),
  summary: z.string().min(1).describe('One-paragraph product description in user voice'),
  expectedScale: z.string().min(1).describe('e.g. <1k users, ~10k users in year 1, 1M+'),
  expectedLoad: z.string().min(1).describe('e.g. low / occasional bursts, steady, high-throughput'),
  deploymentPreference: z.string().min(1).describe('e.g. serverless, container, self-hosted, no preference'),
  authNeeds: z.string().min(1).describe('e.g. none, email/password, social, enterprise SSO'),
  aiRequirements: z.string().min(1).describe('e.g. none, simple chat, RAG, agentic workflows'),
  budgetSensitivity: z.string().min(1).describe('e.g. tight / startup, moderate, generous'),
  timeline: z.string().min(1).describe('e.g. weekend hack, 1 month MVP, 6 month build'),
  mode: ArchitectureModeSchema,
});
export type ProjectProfile = z.infer<typeof ProjectProfileSchema>;