import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ProcessingStage } from '../types';

interface StageNavigatorProps {
  currentStageIndex: number;
  totalStages: number;
  prevStage: ProcessingStage | null;
  nextStage: ProcessingStage | null;
  onPreviousStage?: (stage: ProcessingStage) => void;
  onNextStage?: (stage: ProcessingStage) => void;
  isProcessing: boolean;
}

const StageNavigator: React.FC<StageNavigatorProps> = ({
  currentStageIndex,
  totalStages,
  prevStage,
  nextStage,
  onPreviousStage,
  onNextStage,
  isProcessing,
}) => {
  return (
    <div className='border-t border-gray-200 bg-gray-50 p-3'>
      <div className='flex items-center justify-between'>
        <button
          onClick={prevStage && onPreviousStage ? () => onPreviousStage(prevStage) : undefined}
          disabled={!prevStage || !onPreviousStage || isProcessing}
          className={`flex items-center gap-1 rounded px-3 py-1.5 text-sm ${
            prevStage && onPreviousStage && !isProcessing
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'cursor-not-allowed text-gray-300'
          }`}
        >
          <ArrowLeft className='h-4 w-4' />
          Previous
        </button>

        <div className='text-xs text-gray-500'>
          Stage {currentStageIndex + 1} of {totalStages}
        </div>

        <button
          onClick={nextStage && onNextStage ? () => onNextStage(nextStage) : undefined}
          disabled={!nextStage || !onNextStage || isProcessing}
          className={`flex items-center gap-1 rounded px-3 py-1.5 text-sm ${
            nextStage && onNextStage && !isProcessing
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              : 'cursor-not-allowed text-gray-300'
          }`}
        >
          Next
          <ArrowRight className='h-4 w-4' />
        </button>
      </div>
    </div>
  );
};

export default StageNavigator;
