import { z } from 'zod';
import { getLLM, modelFor } from '../llm/index.js';
import { ArchitectureSchema, type Architecture } from '../types/architecture.js';
import type { ArchitectureMode, ProjectProfile } from '../types/profile.js';

const MODE_GUIDANCE: Record<ArchitectureMode, string> = {
  mvp: 'Favor managed services, boring proven tech, and the shortest path to a working product. Accept some tech debt.',
  enterprise:
    'Favor compliance-ready, audit-friendly, horizontally scalable choices. Add observability, structured logging, and clear ownership boundaries.',
  'cost-optimized':
    'Minimize fixed monthly cost. Prefer free tiers, cold-startable serverless, single-instance databases when load is low. Call out estimated $/month explicitly.',
  'ai-native':
    'Treat LLM calls as a first-class layer. Recommend a vector store, an evaluation framework, and structured streaming. Pick a frontend that handles streaming well.',
  'rapid-prototype':
    'Optimize for time to first demo. Accept lock-in. Single-file solutions and BaaS providers are fine.',
    'oss-only':
    'Only recommend open-source self-hostable components. Avoid proprietary SaaS. Note any AGPL/commercial-use concerns.',
};

const BASE_SYSTEM = `You are Architect-AI — a senior software architect specializing in modern web/cloud stacks.
Given a ProjectProfile, you produce a complete Architecture covering: frontend, backend, database, deployment, auth, caching, observability.

Hard requirements:
- Every layer must include npmPackage when the choice is a Node-ecosystem library (so it can be validated against the npm registry). Use the canonical package name (e.g. "next", "express", "postgres", "@tanstack/react-query"). Set githubRepo (owner/repo) for any layer whose primary artifact lives on GitHub.
- For non-npm choices (e.g. PostgreSQL, Redis, Fly.io), set npmPackage to undefined but set githubRepo when possible (e.g. "postgres/postgres", "redis/redis").
- Provide 3–6 ADRs covering the most consequential decisions (database choice, deployment target, auth strategy, etc.). ADRs must reference real tradeoffs.
- Confidence scores reflect your honest belief about this combo for this profile (0–100). Penalize hype-tech, beta releases, and combos you haven't seen ship.
- Estimations must be realistic for the team size and timeline in the profile.
- Do NOT recommend the same package twice across layers.`;

export async function designArchitecture(profile: ProjectProfile): Promise<Architecture> {
  const llm = getLLM();
  const modeGuidance = MODE_GUIDANCE[profile.mode];
  const system = `${BASE_SYSTEM}

Mode: ${profile.mode}
Mode guidance: ${modeGuidance}`;

  const prompt = `Project profile:
${JSON.stringify(profile, null, 2)}

Produce the complete Architecture now.`;

  return llm.generateStructured<Architecture>({
    system,
    prompt,
    schema: ArchitectureSchema as unknown as z.ZodType<Architecture>,
    schemaName: 'architecture',
    schemaDescription:
      'Complete architecture recommendation with per-layer stack, ADRs, and estimations.',
    model: modelFor('architecture'),
    maxTokens: 6000,
  });
}

  