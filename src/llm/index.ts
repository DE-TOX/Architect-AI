import { AnthropicProvider } from './anthropic';
import { GeminiProvider } from './gemini';
import { OpenAIProvider } from './openai';
import type { AgentModelKey, LLMProvider, ProviderConfig } from './types';

export type ProviderName = 'anthropic' | 'openai' | 'gemini';

const PROVIDER_DEFAULTS: Record<ProviderName, Record<AgentModelKey, string>> = {
  anthropic: {
    interview: 'claude-haiku-4-5',
    architecture: 'claude-sonnet-4-6',
    diagram: 'claude-sonnet-4-6',
  },
  openai: {
    interview: 'gpt-4o-mini',
    architecture: 'gpt-4o',
    diagram: 'gpt-4o',
  },
  gemini: {
    interview: 'gemini-2.5-flash',
    architecture: 'gemini-2.5-pro',
    diagram: 'gemini-2.5-pro',
  },
};

function resolveProviderName(): ProviderName {
  const raw = (process.env.LLM_PROVIDER ?? 'anthropic').toLowerCase();
  if (raw === 'anthropic' || raw === 'openai' || raw === 'gemini') return raw;
  throw new Error(
    `Unsupported LLM_PROVIDER="${raw}". Supported values: anthropic, openai, gemini.`,
  );
}

function resolveModels(provider: ProviderName): Record<AgentModelKey, string> {
  const defaults = PROVIDER_DEFAULTS[provider];
  return {
    interview: process.env.LLM_MODEL_INTERVIEW ?? defaults.interview,
    architecture: process.env.LLM_MODEL_ARCHITECTURE ?? defaults.architecture,
    diagram: process.env.LLM_MODEL_DIAGRAM ?? defaults.diagram,
  };
}

let cachedClient: LLMProvider | undefined;

function buildClient(): LLMProvider {
  const name = resolveProviderName();
  const config: ProviderConfig = { defaultModels: resolveModels(name) };
  switch (name) {
    case 'anthropic':
      return new AnthropicProvider(config);
    case 'openai':
      return new OpenAIProvider(config);
    case 'gemini':
      return new GeminiProvider(config);
  }
}

export function getLLM(): LLMProvider {
  if (!cachedClient) cachedClient = buildClient();
  return cachedClient;
}

export function modelFor(key: AgentModelKey): string {
    return resolveModels(resolveProviderName())[key];
}

export function activeProvider(): ProviderName {
  return resolveProviderName();
}

export function _resetForTests(): void {
  cachedClient = undefined;
}

export type { LLMProvider } from './types.js';