import OpenAI from 'openai';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { DEFAULT_MAX_TOKENS, withRetry } from './retry';
import type {
  GenerateStructuredOptions,
  LLMProvider,
  ProviderConfig,
  StreamTextOptions,
} from './types.js';

export class OpenAIProvider implements LLMProvider {
  private readonly client: OpenAI;
  constructor(
    private readonly config: ProviderConfig,
    apiKey?: string,
  ) {
    const key = apiKey ?? process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error(
        'OPENAI_API_KEY is not set. Add it to your .env file (see .env.example).',
      );
    }
    this.client = new OpenAI({ apiKey: key });
  }

  async streamText(opts: StreamTextOptions): Promise<string> {
    const model = opts.model ?? this.config.defaultModels.interview;
    return withRetry('openai.streamText', async () => {
      const response = await this.client.chat.completions.create({
        model,
        max_tokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
        messages: [
          { role: 'system', content: opts.system },
          { role: 'user', content: opts.prompt },
        ],
      });
      const content = response.choices[0]?.message?.content ?? '';
      return content.trim();
    });
  }

  async generateStructured<T>(opts: GenerateStructuredOptions<T>): Promise<T> {
    const model = opts.model ?? this.config.defaultModels.architecture;
    const jsonSchema = zodToJsonSchema(opts.schema, { target: 'openApi3' }) as Record<
      string,
      unknown
    >;

    return withRetry('openai.generateStructured', async () => {
      const response = await this.client.chat.completions.create({
        model,
        max_tokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
        messages: [
          { role: 'system', content: opts.system },
          { role: 'user', content: opts.prompt },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: opts.schemaName,
              description: opts.schemaDescription,
              parameters: jsonSchema,
            },
          },
        ],
        tool_choice: {
          type: 'function',
          function: { name: opts.schemaName },
        },
      });

      const toolCall = response.choices[0]?.message?.tool_calls?.[0];
      if (!toolCall || toolCall.type !== 'function') {
        throw new Error(
          `OpenAI did not call the structured tool "${opts.schemaName}". Response: ${JSON.stringify(
            response.choices[0]?.message,
          )}`,
        );
      }

      let rawJson: unknown;
      try {
        rawJson = JSON.parse(toolCall.function.arguments);
      } catch (err) {
        throw new Error(
          `OpenAI returned non-JSON tool arguments: ${(err as Error).message}\nArguments: ${toolCall.function.arguments}`,
        );
      }

      const parsed = opts.schema.safeParse(rawJson);
      if (!parsed.success) {
        throw new Error(
          `OpenAI structured output failed Zod validation: ${parsed.error.message}`,
        );
      }
      return parsed.data;
    });
  }
}