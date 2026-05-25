import React, { useState } from 'react';
import { Welcome } from './screens/Welcome.js';
import { Interview } from './screens/Interview.js';
import { Generating } from './screens/Generating.js';
import { Complete } from './screens/Complete.js';
import type { InterviewAnswers } from '../agents/requirements.js';

type Phase =
  | { kind: 'welcome' }
  | { kind: 'interview' }
  | { kind: 'generating'; answers: InterviewAnswers }
  | { kind: 'complete'; outputPath?: string; error?: string };

export const App: React.FC = () => {
  const [phase, setPhase] = useState<Phase>({ kind: 'welcome' });

  switch (phase.kind) {
    case 'welcome':
      return (
        <Welcome
          title="Architect-AI v0.1"
          onContinue={() => setPhase({ kind: 'interview' })}
        />
      );
    case 'interview':
      return (
        <Interview
          onComplete={(answers) => setPhase({ kind: 'generating', answers })}
        />
      );
    case 'generating':
      return (
        <Generating
          answers={phase.answers}
          onDone={(outputPath) => setPhase({ kind: 'complete', outputPath })}
          onError={(error) => setPhase({ kind: 'complete', error })}
        />
      );
    case 'complete':
      return <Complete outputPath={phase.outputPath} error={phase.error} />;
  }
};