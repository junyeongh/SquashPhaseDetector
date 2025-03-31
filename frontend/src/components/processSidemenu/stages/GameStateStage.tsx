import React from 'react';
import { GameStateStageProps } from '../types';
import ProcessingIndicator from '../ui/ProcessingIndicator';

const GameStateStage: React.FC<GameStateStageProps> = ({
  isProcessing,
  processingStatus,
  showSkipButton,
  onSkipStage,
  onProcess,
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

  return (
    <div className='space-y-3'>
      <div className='rounded-md border border-gray-200 bg-gray-50 p-3'>
        <h4 className='mb-2 text-xs font-medium text-gray-700'>Game State Analysis</h4>
        <p className='text-xs text-gray-600'>Analyze game state based on detected poses and player movements.</p>
      </div>
      {/* Button removed - will be placed above StageNavigator */}
    </div>
  );
};

export default GameStateStage;
