import { describe, expect, it } from 'vitest';
import { buildMarkdown } from '../../src/agents/documentation.js';
import type { Architecture } from '../../src/types/architecture.js';
import type { ProjectProfile } from '../../src/types/profile.js';
import type { ValidationResult } from '../../src/types/validation.js';

const profile: ProjectProfile = {
  projectName: 'Recipe Box',
  projectType: 'SaaS web app',
  summary: 'A small web app for sharing and rating home recipes.',
  expectedScale: '~10k users in year 1',
  expectedLoad: 'Steady moderate',
  deploymentPreference: 'Serverless',
  authNeeds: 'Email + password',
  aiRequirements: 'None',
  budgetSensitivity: 'Tight',
  timeline: '1 month MVP',
  mode: 'mvp',
};

const baseLayer = {
  rationale: 'r',
  benefits: ['b1', 'b2'],
  tradeoffs: ['t1'],
  maturity: 'stable' as const,
  confidence: 90,
};

const architecture: Architecture = {
  layers: {
    frontend: { layer: 'frontend', name: 'Next.js 15', npmPackage: 'next', ...baseLayer },
    backend: { layer: 'backend', name: 'Next.js API routes', npmPackage: 'next', ...baseLayer },
    database: { layer: 'database', name: 'Neon Postgres', ...baseLayer },
    deployment: { layer: 'deployment', name: 'Vercel', ...baseLayer },
    auth: { layer: 'auth', name: 'NextAuth.js', npmPackage: 'next-auth', ...baseLayer },
    caching: { layer: 'caching', name: 'Upstash Redis', ...baseLayer },
    observability: { layer: 'observability', name: 'Axiom', ...baseLayer },
  },
  adrs: [
    {
      id: 'ADR-001',
      title: 'PostgreSQL over MongoDB',
      status: 'accepted',
      decision: 'Use PostgreSQL',
      reasons: ['Relational consistency', 'Mature ecosystem'],
      tradeoffs: ['Requires migrations'],
      alternatives: ['MongoDB', 'SQLite'],
    },
    {
      id: 'ADR-002',
      title: 'Vercel for hosting',
      status: 'accepted',
      decision: 'Deploy on Vercel',
      reasons: ['Zero config for Next.js'],
      tradeoffs: ['Vendor lock-in'],
      alternatives: [],
    },
    {
      id: 'ADR-003',
      title: 'NextAuth for authentication',
      status: 'accepted',
      decision: 'Adopt NextAuth.js',
      reasons: ['Tight Next.js integration'],
      tradeoffs: ['Less control than rolling our own'],
      alternatives: ['Clerk', 'Lucia'],
    },
  ],
  estimations: {
    mvpDuration: '4 weeks',
    teamSize: '1 dev',
    monthlyInfraCostUsd: '$0-25',
    complexity: 'moderate',
    scalabilityTier: 'horizontal to 50k users without redesign',
  },
};

const validation: ValidationResult[] = [
  {
    layer: 'frontend',
    technology: 'Next.js 15',
    npmPackage: 'next',
    latestVersion: '15.0.0',
    lastReleaseDate: '2025-01-01',
    peerDepConflicts: [],
    flags: [],
    confidence: 96,
    notes: [],
  },
  {
    layer: 'auth',
    technology: 'NextAuth.js',
    npmPackage: 'next-auth',
    latestVersion: '5.0.0-beta.20',
    lastReleaseDate: '2025-02-01',
    peerDepConflicts: [],
    flags: ['prerelease'],
    confidence: 70,
    notes: [],
  },
];

const mermaid = `graph TD\n  U[User] --> F[Frontend]\n  F --> B[Backend]\n  B --> D[(Postgres)]`;

describe('buildMarkdown', () => {
  const md = buildMarkdown({ profile, architecture, validation, mermaid });

  it('contains the project name as a top-level heading', () => {
    expect(md).toMatch(/^# Recipe Box — Architecture Plan/);
  });

  it('includes the recommended stack table with all layers', () => {
    expect(md).toContain('## 2. Recommended Stack');
    expect(md).toContain('Next.js 15');
    expect(md).toContain('Neon Postgres');
    expect(md).toContain('NextAuth.js');
  });

  it('embeds the Mermaid block inside a mermaid fence', () => {
    expect(md).toContain('```mermaid');
    expect(md).toContain('graph TD');
  });

  it('renders every ADR with reasons and tradeoffs', () => {
    expect(md).toContain('### ADR-001: PostgreSQL over MongoDB');
    expect(md).toContain('- Relational consistency');
    expect(md).toContain('- Requires migrations');
  });

  it('lists flagged packages in the compatibility report', () => {
    expect(md).toContain('## 6. Compatibility Validation Report');
    expect(md).toContain('Pre-release');
    expect(md).toContain('next-auth');
  });

  it('includes estimations table', () => {
    expect(md).toContain('## 7. Estimations');
    expect(md).toContain('4 weeks');
    expect(md).toContain('Moderate');
  });
});