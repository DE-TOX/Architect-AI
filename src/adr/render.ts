import type { ADR } from '../types/architecture.js';

export function renderADR(adr: ADR): string {
  const lines: string[] = [];
  lines.push(`### ${adr.id}: ${adr.title}`);
  lines.push('');
  lines.push(`**Status:** ${adr.status}`);
  lines.push('');
  lines.push(`**Decision:** ${adr.decision}`);
  lines.push('');
  lines.push('**Reasons:**');
  for (const r of adr.reasons) lines.push(`- ${r}`);
  lines.push('');
  lines.push('**Tradeoffs:**');
  for (const t of adr.tradeoffs) lines.push(`- ${t}`);
  if (adr.alternatives.length > 0) {
    lines.push('');
    lines.push('**Alternatives considered:**');
    for (const a of adr.alternatives) lines.push(`- ${a}`);
  }
  return lines.join('\n');
}