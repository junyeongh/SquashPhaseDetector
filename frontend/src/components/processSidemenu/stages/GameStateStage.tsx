import React from 'react';
import { Play } from 'lucide-react';
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
      <button
        onClick={onProcess}
        disabled={isProcessing}
        className='flex w-full items-center justify-center gap-2 rounded border border-blue-300 bg-blue-100 px-4 py-2 text-sm text-blue-700 transition-colors hover:bg-blue-200'
      >
        <Play className='h-3.5 w-3.5' />
        Run Game Analysis
      </button>
    </div>
  );
};

export default GameStateStage;
