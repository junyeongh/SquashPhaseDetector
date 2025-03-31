import React from 'react';
import { Loader } from 'lucide-react';

interface ProcessingIndicatorProps {
  isProcessing: boolean;
  processingStatus: string;
  showSkipButton?: boolean;
  onSkipStage?: () => void;
}

const ProcessingIndicator: React.FC<ProcessingIndicatorProps> = ({
  isProcessing,
  processingStatus,
  showSkipButton = false,
  onSkipStage,
}) => {
  if (!isProcessing) return null;

  return (
    <div className='rounded-md border border-blue-100 bg-blue-50 p-4'>
      <div className='flex items-center gap-2 text-blue-700'>
        <Loader className='h-4 w-4 animate-spin' />
        <span className='text-sm font-medium'>Processing...</span>
      </div>
      <p className='mt-1 text-xs text-blue-600'>{processingStatus}</p>

      {showSkipButton && onSkipStage && (
        <button
          onClick={onSkipStage}
          className='mt-3 flex w-full items-center justify-center gap-2 rounded border border-orange-300 bg-orange-100 px-4 py-1.5 text-sm text-orange-700 transition-colors hover:bg-orange-200'
        >
          Skip to Next Stage
        </button>
      )}
    </div>
  );
};

export default ProcessingIndicator;
