import { AnthropicProvider } from './anthropic.js';
import type { AgentModelKey, LLMProvider, ProviderConfig } from './types.js';

const DEFAULT_MODELS: Record<AgentModelKey, string> = {
  interview: process.env.LLM_MODEL_INTERVIEW ?? 'claude-haiku-4-5',
  architecture: process.env.LLM_MODEL_ARCHITECTURE ?? 'claude-sonnet-4-6',
  diagram: process.env.LLM_MODEL_DIAGRAM ?? 'claude-sonnet-4-6',
};

let cached: LLMProvider | undefined;

export function getLLM(): LLMProvider {
  if (cached) return cached;
  const provider = (process.env.LLM_PROVIDER ?? 'anthropic').toLowerCase();
  const config: ProviderConfig = { defaultModels: DEFAULT_MODELS };

  switch (provider) {
    case 'anthropic':
      cached = new AnthropicProvider(config);
      return cached;
    default:
      throw new Error(
        `Unsupported LLM_PROVIDER="${provider}". Currently only "anthropic" is implemented.`,
      );
  }
}

export function modelFor(key: AgentModelKey): string {
  return DEFAULT_MODELS[key];
}

export type { LLMProvider } from './types.js';