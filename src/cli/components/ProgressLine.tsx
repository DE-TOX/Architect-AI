import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

export type Status = 'pending' | 'running' | 'done' | 'error';

interface Props {
  label: string;
  status: Status;
  detail?: string;
}

export const ProgressLine: React.FC<Props> = ({ label, status, detail }) => {
  const icon =
    status === 'running' ? (
      <Text color="cyan">
        <Spinner type="dots" />
      </Text>
    ) : status === 'done' ? (
      <Text color="green">✓</Text>
    ) : status === 'error' ? (
      <Text color="red">✗</Text>
    ) : (
      <Text dimColor>○</Text>
    );

  return (
    <Box>
      <Box marginRight={1}>{icon}</Box>
      <Text color={status === 'done' ? 'green' : status === 'error' ? 'red' : undefined}>
        {label}
      </Text>
      {detail ? (
        <Box marginLeft={1}>
          <Text dimColor>— {detail}</Text>
        </Box>
      ) : null}
    </Box>
  );
};
