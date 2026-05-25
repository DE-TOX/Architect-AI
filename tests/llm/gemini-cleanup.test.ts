import { describe, expect, it } from 'vitest';
import { z } from 'zod';

const UNDEFINED_VALUE_RE = /:\s*undefined\b/g;

function deepStripNulls(value: unknown): unknown {
  if (value === null) return undefined;
  if (Array.isArray(value)) return value.map(deepStripNulls);
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

const Schema = z.object({
  name: z.string(),
  npmPackage: z.string().optional(),
  alternatives: z.array(z.string()).default([]),
  nested: z
    .object({
      key: z.string().optional(),
    })
    .optional(),
});

describe('Gemini structured-output cleanup', () => {
  it('replaces literal undefined with null so JSON.parse succeeds', () => {
    const raw = `{"name": "Postgres", "npmPackage": undefined, "alternatives": ["MongoDB"]}`;
    const cleaned = raw.replace(UNDEFINED_VALUE_RE, ': null');
    expect(() => JSON.parse(cleaned)).not.toThrow();
    const parsed = JSON.parse(cleaned);
    expect(parsed.npmPackage).toBeNull();
  });

  it('strips nulls and validates against optional Zod fields', () => {
    const raw = `{"name": "Postgres", "npmPackage": undefined, "alternatives": ["MongoDB"], "nested": {"key": null}}`;
    const text = raw.replace(UNDEFINED_VALUE_RE, ': null');
    const json = JSON.parse(text);
    const cleaned = deepStripNulls(json);
    const result = Schema.safeParse(cleaned);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.npmPackage).toBeUndefined();
      expect(result.data.nested).toEqual({});
    }
  });

  it('preserves non-null values and arrays', () => {
    const input = {
      name: 'A',
      alternatives: ['B', 'C'],
      npmPackage: null,
    };
    const cleaned = deepStripNulls(input) as Record<string, unknown>;
    expect(cleaned).toEqual({ name: 'A', alternatives: ['B', 'C'] });
  });
});