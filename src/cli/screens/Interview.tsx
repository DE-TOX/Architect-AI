import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { QUESTION_BANK, type InterviewAnswers } from '../../agents/requirements.js';
import { QuestionPrompt } from '../components/QuestionPrompt.js';

interface Props {
  onComplete: (answers: InterviewAnswers) => void;
}

export const Interview: React.FC<Props> = ({ onComplete }) => {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<InterviewAnswers>({});
  const question = QUESTION_BANK[index];

  if (!question) {
    return (
      <Box padding={1}>
        <Text>Interview complete.</Text>
      </Box>
    );
  }

  const handleSubmit = (value: string) => {
    const next: InterviewAnswers = { ...answers, [question.id]: value };
    setAnswers(next);
    if (index + 1 >= QUESTION_BANK.length) {
      onComplete(next);
    } else {
      setIndex(index + 1);
    }
  };

  return (
    <QuestionPrompt
      key={question.id}
      question={question}
      index={index}
      total={QUESTION_BANK.length}
      onSubmit={handleSubmit}
    />
  );
};