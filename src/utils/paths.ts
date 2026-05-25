import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export function timestampSlug(date: Date = new Date()): string {
  return date.toISOString().replace(/[:.]/g, '-');
}

export async function ensureDir(filePath: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
}

export function outputPath(slug: string, projectName: string): string {
  const safeName = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'project';
  return resolve(process.cwd(), 'output', `prd-${safeName}-${slug}.md`);
}
