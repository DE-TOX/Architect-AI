import type { z } from 'zod';

export interface StreamTextOptions {
  system: string;
  prompt: string;
  model?: string;
  maxTokens?: number;
}

export interface GenerateStructuredOptions<T> {
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  schemaName: string;
  schemaDescription: string;
  model?: string;
  maxTokens?: number;
}

export interface LLMProvider {
  streamText(opts: StreamTextOptions): Promise<string>;
  generateStructured<T>(opts: GenerateStructuredOptions<T>): Promise<T>;
}

export type AgentModelKey = 'interview' | 'architecture' | 'diagram';

export interface ProviderConfig {
  defaultModels: Record<AgentModelKey, string>;
}