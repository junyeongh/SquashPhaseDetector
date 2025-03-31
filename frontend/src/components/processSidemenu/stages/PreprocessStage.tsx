import React from 'react';
import { Play } from 'lucide-react';
import { PreprocessStageProps } from '../types';
import ProcessingIndicator from '../ui/ProcessingIndicator';

const PreprocessStage: React.FC<PreprocessStageProps> = ({
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
      <button
        onClick={onProcess}
        disabled={isProcessing}
        className='flex w-full items-center justify-center gap-2 rounded border border-blue-300 bg-blue-100 px-4 py-2 text-sm text-blue-700 transition-colors hover:bg-blue-200'
      >
        <Play className='h-3.5 w-3.5' />
        Process Video
      </button>
    </div>
  );
};

export default PreprocessStage;
