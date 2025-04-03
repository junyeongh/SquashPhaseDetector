import React from 'react';
import { PreprocessStageProps } from '../types';
import ProcessingIndicator from '../ui/ProcessingIndicator';

const PreprocessStage: React.FC<PreprocessStageProps> = ({
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

  return <div className='space-y-3'>{/* Button removed - will be placed above StageNavigator */}</div>;
};

export default PreprocessStage;
