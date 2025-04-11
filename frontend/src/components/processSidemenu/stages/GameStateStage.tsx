import React from 'react';
import { GameStateStageProps } from '../types';
import ProcessingIndicator from '../ui/ProcessingIndicator';

const GameStateStage: React.FC<GameStateStageProps> = ({
  isProcessing,
  processingStatus,
  showSkipButton,
  onSkipStage,
}) => {
  if (isProcessing) {
    return (
      <ProcessingIndicator
        isProcessing={isProcessing}
        processingStatus={processingStatus}
        showSkipButton={showSkipButton}
        onSkipStage={onSkipStage}
      />
    );
  }

  return null;
};

export default GameStateStage;
