import React from 'react';
import { CheckCircle, Circle, Loader, ListChecks } from 'lucide-react';
import { ProcessingStage, StageConfig } from '../types';

interface StageHeaderProps {
  currentStage: StageConfig;
  currentStageIndex: number;
  totalStages: number;
  activeStage: ProcessingStage;
  completedStages: Set<ProcessingStage>;
  isProcessing: boolean;
  onStageSelect?: (stage: ProcessingStage) => void;
}

const StageHeader: React.FC<StageHeaderProps> = ({
  currentStage,
  currentStageIndex,
  totalStages,
  activeStage,
  completedStages,
  isProcessing,
  onStageSelect,
}) => {
  return (
    <>
      {/* Stages overview button */}
      <button
        onClick={() => onStageSelect?.(activeStage)}
        disabled={!onStageSelect || isProcessing}
        className='mb-3 flex w-full items-center justify-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100'
      >
        <ListChecks className='h-4 w-4' />
        <span>View All Stages</span>
      </button>

      {/* Current stage information */}
      <div className='mb-4'>
        <div className='mb-1 flex items-center gap-2'>
          <div className='flex h-6 w-6 items-center justify-center rounded-full bg-blue-100'>
            <span className='text-xs font-medium text-blue-700'>
              {currentStageIndex + 1}
            </span>
          </div>
          <span className='text-sm font-medium'>
            Stage {currentStageIndex + 1}/{totalStages}: {currentStage.label}
          </span>
        </div>

        <div className='ml-8'>
          <p className='mb-3 text-xs text-gray-600'>
            {currentStage.description}
          </p>

          {/* Stage status */}
          <div className='mb-4 flex items-center gap-2 text-xs text-gray-500'>
            {completedStages.has(activeStage) ? (
              <>
                <CheckCircle className='h-3.5 w-3.5 text-green-500' />
                <span className='text-green-600'>Completed</span>
              </>
            ) : isProcessing ? (
              <>
                <Loader className='h-3.5 w-3.5 animate-spin text-blue-500' />
                <span className='text-blue-600'>Processing</span>
              </>
            ) : (
              <>
                <Circle className='h-3.5 w-3.5 text-gray-400' />
                <span>Ready to process</span>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default StageHeader;
