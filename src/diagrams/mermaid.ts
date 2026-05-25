import { getLLM, modelFor } from '../llm/index.js';
import type { Architecture, StackRecommendation } from '../types/architecture.js';
import type { ProjectProfile } from '../types/profile.js';

const SYSTEM = `You generate a Mermaid "graph TD" diagram for a system architecture.

Strict rules:
- Output ONLY the diagram body. Do NOT include code fences, explanations, or prose.
- Start with: graph TD
- Use short, distinct node IDs (A, B, C... or U, F, B for user/frontend/backend).
- Use square brackets for components, e.g. F[Frontend - Next.js].
- Use --> for synchronous calls, -.-> for async/event-driven.
- Keep it to 10–14 nodes. Group obvious peripherals (logging, monitoring) into a single node.
- Always include: User, Frontend, Backend/API, Database, Auth, and any AI/cache/observability components that exist in the architecture.`;

const FENCE_RE = /^```(?:mermaid)?\s*\n?|```$/gm;

export async function generateMermaid(
  profile: ProjectProfile,
  architecture: Architecture,
): Promise<string> {
  const llm = getLLM();
  const summary = {
    profile: { name: profile.projectName, type: profile.projectType, summary: profile.summary },
    layers: Object.fromEntries(
      (Object.entries(architecture.layers) as Array<[string, StackRecommendation]>).map(
        ([k, v]) => [k, v.name],
      ),
    ),
  };

  const raw = await llm.streamText({
    system: SYSTEM,
    prompt: `Architecture summary:\n${JSON.stringify(summary, null, 2)}\n\nReturn the Mermaid diagram body now.`,
    model: modelFor('diagram'),
    maxTokens: 800,
  });

  const cleaned = raw.replace(FENCE_RE, '').trim();
  if (!/^graph\s+(TD|LR|TB|RL|BT)/i.test(cleaned) && !/^flowchart\s/i.test(cleaned)) {
    return `graph TD\n  A[Frontend: ${architecture.layers.frontend.name}] --> B[Backend: ${architecture.layers.backend.name}]\n  B --> C[(Database: ${architecture.layers.database.name})]`;
  }
  return cleaned;
}