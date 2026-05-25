import { z } from 'zod';
import { getLLM, modelFor } from '../llm/index.js';
import { ProjectProfileSchema, type ProjectProfile } from '../types/profile.js';
import type { InterviewAnswers } from '../agents/requirements.js';

const SYSTEM = `You are a senior solution architect's intake assistant.
You take raw answers from a project intake interview and normalize them into a clean ProjectProfile.
Rules:
- Preserve the user's voice in "summary" but tighten grammar.
- Do not invent details that weren't provided — if something is vague, keep it vague.
- "expectedScale", "expectedLoad" etc. should be short labels, not paragraphs.
- Always return all fields. If the user skipped a field, choose the most reasonable conservative default given the rest of the answers.`;

export async function normalizeProfile(answers: InterviewAnswers): Promise<ProjectProfile> {
  const llm = getLLM();
  const prompt = `Raw interview answers (JSON):
${JSON.stringify(answers, null, 2)}

Return a normalized ProjectProfile.`;

  return llm.generateStructured<ProjectProfile>({
    system: SYSTEM,
    prompt,
    schema: ProjectProfileSchema as unknown as z.ZodType<ProjectProfile>,
    schemaName: 'project_profile',
    schemaDescription: 'Normalized project profile derived from interview answers.',
    model: modelFor('interview'),
    maxTokens: 1500,
  });
}