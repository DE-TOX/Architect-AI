import { GoogleGenerativeAI } from '@google/generative-ai';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { DEFAULT_MAX_TOKENS, withRetry } from './retry.js';
import type {
  GenerateStructuredOptions,
  LLMProvider,
  ProviderConfig,
  StreamTextOptions,
} from './types.js';

const JSON_BLOCK_RE = /```(?:json)?\s*([\s\S]*?)```/;
const UNDEFINED_VALUE_RE = /:\s*undefined\b/g;

function extractJson(raw: string): string {
  const fenceMatch = raw.match(JSON_BLOCK_RE);
  if (fenceMatch && fenceMatch[1]) return fenceMatch[1].trim();
  const trimmed = raw.trim();
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return trimmed;
}

function deepStripNulls(value: unknown): unknown {
  if (value === null) return undefined;
  if (Array.isArray(value)) {
    return value.map(deepStripNulls);
  }
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const cleaned = deepStripNulls(v);
      if (cleaned !== undefined) result[k] = cleaned;
    }
    return result;
  }
  return value;
}

export class GeminiProvider implements LLMProvider {
  private readonly client: GoogleGenerativeAI;
  constructor(
    private readonly config: ProviderConfig,
    apiKey?: string,
  ) {
    const key = apiKey ?? process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
    if (!key) {
      throw new Error(
        'GEMINI_API_KEY (or GOOGLE_API_KEY) is not set. Add it to your .env file (see .env.example).',
      );
    }
    this.client = new GoogleGenerativeAI(key);
  }

  async streamText(opts: StreamTextOptions): Promise<string> {
    const modelName = opts.model ?? this.config.defaultModels.interview;
    return withRetry('gemini.streamText', async () => {
      const model = this.client.getGenerativeModel({
        model: modelName,
        systemInstruction: opts.system,
        generationConfig: {
          maxOutputTokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
        },
      });
      const result = await model.generateContent(opts.prompt);
      return result.response.text().trim();
    });
  }

  async generateStructured<T>(opts: GenerateStructuredOptions<T>): Promise<T> {
    const modelName = opts.model ?? this.config.defaultModels.architecture;
    const jsonSchema = zodToJsonSchema(opts.schema, { target: 'openApi3' });
    const schemaInstruction = `You MUST return a single JSON object that conforms to this schema. Return ONLY the JSON — no prose, no code fences, no commentary.

Critical formatting rules:
- For OPTIONAL fields that don't apply, OMIT the key entirely from the object. Do NOT write "undefined" or "null" — those are not valid here.
- Example: if "npmPackage" doesn't apply (e.g. PostgreSQL is not an npm package), simply leave the key out. Do not write "npmPackage": undefined or "npmPackage": null.
- All values must be valid JSON literals: strings, numbers, booleans, arrays, objects.

Schema (${opts.schemaName} — ${opts.schemaDescription}):
${JSON.stringify(jsonSchema, null, 2)}`;

    return withRetry('gemini.generateStructured', async () => {
      const model = this.client.getGenerativeModel({
        model: modelName,
        systemInstruction: `${opts.system}\n\n${schemaInstruction}`,
        generationConfig: {
          maxOutputTokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
          responseMimeType: 'application/json',
        },
      });
      const result = await model.generateContent(opts.prompt);
      const raw = result.response.text();

      const text = extractJson(raw).replace(UNDEFINED_VALUE_RE, ': null');

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(text);
      } catch (err) {
        throw new Error(
          `Gemini returned non-JSON output: ${(err as Error).message}\nOutput: ${raw.slice(0, 500)}`,
        );
      }

      const cleaned = deepStripNulls(parsedJson);
      const parsed = opts.schema.safeParse(cleaned);
      if (!parsed.success) {
        throw new Error(
          `Gemini structured output failed Zod validation: ${parsed.error.message}`,
        );
      }
      return parsed.data;
    });
  }
}