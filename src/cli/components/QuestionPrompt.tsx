import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import type { InterviewQuestion } from '../../agents/requirements.js';

interface Props {
  question: InterviewQuestion;
  index: number;
  total: number;
  onSubmit: (value: string) => void;
}

export const QuestionPrompt: React.FC<Props> = ({ question, index, total, onSubmit }) => {
  const [value, setValue] = useState<string>(question.defaultValue ?? '');

  return (
    <Box flexDirection="column" padding={1}>
      <Text dimColor>
        Question {index + 1} of {total}
      </Text>
      <Box marginTop={1}>
        <Text bold>{question.label}</Text>
      </Box>
      {question.help ? (
        <Box>
          <Text dimColor italic>
            {question.help}
          </Text>
        </Box>
      ) : null}
      <Box marginTop={1}>
        {question.type === 'select' && question.options ? (
          <SelectInput
            items={question.options.map((o) => ({ label: o.label, value: o.value }))}
            initialIndex={Math.max(
              0,
              question.options.findIndex((o) => o.value === question.defaultValue),
            )}
            onSelect={(item) => onSubmit(String(item.value))}
          />
        ) : (
          <Box>
            <Text color="green">› </Text>
            <TextInput
              value={value}
              onChange={setValue}
              onSubmit={(v) => onSubmit(v.trim() || question.defaultValue || '')}
            />
          </Box>
        )}
      </Box>
      {question.allowSkip ? (
        <Box marginTop={1}>
          <Text dimColor>
            (Press Enter with empty input to accept default
            {question.defaultValue ? `: "${question.defaultValue}"` : ''})
          </Text>
        </Box>
      ) : null}
    </Box>
  );
};