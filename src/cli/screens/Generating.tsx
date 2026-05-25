import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { ProgressLine, type Status } from '../components/ProgressLine.js';
import { designArchitecture } from '../../agents/architecture.js';
import { validateArchitecture } from '../../agents/compatibility.js';
import { generateMermaid } from '../../diagrams/mermaid.js';
import { writeDocument } from '../../agents/documentation.js';
import { normalizeProfile } from '../../prompts/interview.js';
import { activeProvider, modelFor } from '../../llm/index.js';
import type { InterviewAnswers } from '../../agents/requirements.js';
import type { ProjectProfile } from '../../types/profile.js';

interface Props {
  answers: InterviewAnswers;
  onDone: (path: string) => void;
  onError: (message: string) => void;
}

type StepKey = 'profile' | 'architecture' | 'compatibility' | 'diagram' | 'document';

const STEP_LABELS: Record<StepKey, string> = {
  profile: 'Understanding your project',
  architecture: 'Designing the architecture',
  compatibility: 'Verifying technology choices',
  diagram: 'Visualizing the system',
  document: 'Generating your PRD',
};

const ORDER: StepKey[] = ['profile', 'architecture', 'compatibility', 'diagram', 'document'];

export const Generating: React.FC<Props> = ({ answers, onDone, onError }) => {
  const [statuses, setStatuses] = useState<Record<StepKey, Status>>({
    profile: 'pending',
    architecture: 'pending',
    compatibility: 'pending',
    diagram: 'pending',
    document: 'pending',
  });
  const [details, setDetails] = useState<Partial<Record<StepKey, string>>>({});

  useEffect(() => {
    let cancelled = false;
    const setStatus = (key: StepKey, status: Status, detail?: string) => {
      if (cancelled) return;
      setStatuses((prev) => ({ ...prev, [key]: status }));
      if (detail !== undefined) {
        setDetails((prev) => ({ ...prev, [key]: detail }));
      }
    };

    (async () => {
      try {
        setStatus('profile', 'running');
        const profile: ProjectProfile = await normalizeProfile(answers);
        setStatus('profile', 'done', profile.projectName);

        setStatus('architecture', 'running');
        const architecture = await designArchitecture(profile);
        setStatus(
          'architecture',
          'done',
          `${architecture.adrs.length} ADRs, ${Object.keys(architecture.layers).length} layers`,
        );

        setStatus('compatibility', 'running');
        const { architecture: validatedArch, results } = await validateArchitecture(architecture);
        const flagged = results.filter((r) => r.flags.length > 0).length;
        setStatus(
          'compatibility',
          'done',
          flagged > 0 ? `${flagged} flagged` : 'all clean',
        );

        setStatus('diagram', 'running');
        const mermaid = await generateMermaid(profile, validatedArch);
        setStatus('diagram', 'done');

        setStatus('document', 'running');
        const { path } = await writeDocument({
          profile,
          architecture: validatedArch,
          validation: results,
          mermaid,
        });
        setStatus('document', 'done');

        if (!cancelled) onDone(path);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const running = ORDER.find((k) => statuses[k] === 'running');
        if (running) setStatus(running, 'error', message);
        onError(message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>Generating architecture plan…</Text>
      <Box>
        <Text dimColor>
          provider: {activeProvider()} · architecture model: {modelFor('architecture')}
        </Text>
      </Box>
      <Box flexDirection="column" marginTop={1}>
        {ORDER.map((key) => (
          <ProgressLine
            key={key}
            label={STEP_LABELS[key]}
            status={statuses[key]}
            detail={details[key]}
          />
        ))}
      </Box>
    </Box>
  );
};