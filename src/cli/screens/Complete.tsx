import React, { useEffect } from 'react';
import { Box, Text, useApp } from 'ink';

interface Props {
  outputPath?: string;
  error?: string;
}

export const Complete: React.FC<Props> = ({ outputPath, error }) => {
  const { exit } = useApp();

  useEffect(() => {
    const t = setTimeout(() => exit(), 100);
    return () => clearTimeout(t);
  }, [exit]);

  if (error) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="red" bold>
          ✗ Generation failed
        </Text>
        <Box marginTop={1}>
          <Text>{error}</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Text color="green" bold>
        ✓ Architecture plan generated
      </Text>
      <Box marginTop={1}>
        <Text>Output written to:</Text>
      </Box>
      <Box>
        <Text color="cyan">{outputPath}</Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>
          Open the file in any Markdown viewer with Mermaid support (GitHub, VS Code, Obsidian) to
          render the diagram.
        </Text>
      </Box>
    </Box>
  );
};