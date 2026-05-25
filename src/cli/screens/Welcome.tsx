import React from 'react';
import { Box, Text, useApp, useInput } from 'ink';

interface Props {
  title: string;
  onContinue: () => void;
}

export const Welcome: React.FC<Props> = ({ title, onContinue }) => {
  const { exit } = useApp();
  useInput((input, key) => {
    if (key.return) onContinue();
    if (input === 'q') exit();
  });
  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">
        ╔═══════════════════════════════════╗
      </Text>
      <Text bold color="cyan">
        ║         {title.padEnd(26)}║
      </Text>
      <Text bold color="cyan">
        ╚═══════════════════════════════════╝
      </Text>
      <Box marginTop={1} flexDirection="column">
        <Text>
          AI Technical Architect — turns project ideas into production-grade architecture plans.
        </Text>
        <Text dimColor>
          The interview takes about 2 minutes. Output is written to ./output/ as Markdown.
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text>
          Press <Text color="green">Enter</Text> to begin, or <Text color="red">q</Text> to quit.
        </Text>
      </Box>
    </Box>
  );
};