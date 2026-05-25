import Anthropic from '@anthropic-ai/sdk';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type {
  GenerateStructuredOptions,
  LLMProvider,
  ProviderConfig,
  StreamTextOptions,
} from './types.js';

const DEFAULT_MAX_TOKENS = 4096;
const RETRIES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < RETRIES) {
        const backoff = 500 * 2 ** (attempt - 1);
        await sleep(backoff);
      }
    }
  }
  throw new Error(`${label} failed after ${RETRIES} attempts: ${String(lastErr)}`);
}

export class AnthropicProvider implements LLMProvider {
  private readonly client: Anthropic;
  constructor(
    private readonly config: ProviderConfig,
    apiKey?: string,
  ) {
    const key = apiKey ?? process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error(
        'ANTHROPIC_API_KEY is not set. Add it to your .env file (see .env.example).',
      );
    }
    this.client = new Anthropic({ apiKey: key });
  }

  async streamText(opts: StreamTextOptions): Promise<string> {
    const model = opts.model ?? this.config.defaultModels.interview;
    return withRetry('streamText', async () => {
      const response = await this.client.messages.create({
        model,
        max_tokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
        system: opts.system,
        messages: [{ role: 'user', content: opts.prompt }],
      });
      const parts = response.content
        .filter((p): p is Anthropic.TextBlock => p.type === 'text')
        .map((p) => p.text);
      return parts.join('\n').trim();
    });
  }

  async generateStructured<T>(opts: GenerateStructuredOptions<T>): Promise<T> {
    const model = opts.model ?? this.config.defaultModels.architecture;
    const jsonSchema = zodToJsonSchema(opts.schema, { target: 'openApi3' }) as Record<
      string,
      unknown
    >;
    const tool: Anthropic.Tool = {
      name: opts.schemaName,
      description: opts.schemaDescription,
      input_schema: jsonSchema as Anthropic.Tool['input_schema'],
    };

    return withRetry('generateStructured', async () => {
      const response = await this.client.messages.create({
        model,
        max_tokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
        system: opts.system,
        tools: [tool],
        tool_choice: { type: 'tool', name: opts.schemaName },
        messages: [{ role: 'user', content: opts.prompt }],
      });

      const toolUse = response.content.find(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
      );
      if (!toolUse) {
        throw new Error(
          `Model did not call the structured tool "${opts.schemaName}". Got: ${JSON.stringify(
            response.content,
          )}`,
        );
      }
      const parsed = opts.schema.safeParse(toolUse.input);
      if (!parsed.success) {
        throw new Error(
          `Structured output failed Zod validation: ${parsed.error.message}`,
        );
      }
      return parsed.data;
    });
  }
}