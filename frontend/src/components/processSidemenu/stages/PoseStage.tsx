import React from 'react';
import { PoseStageProps } from '../types';
import ProcessingIndicator from '../ui/ProcessingIndicator';

const PoseStage: React.FC<PoseStageProps> = ({
  isProcessing,
  processingStatus,
  showSkipButton,
  onSkipStage,
  modelType = 'YOLOv8',
  confidenceThreshold = 50,
  setModelType,
  setConfidenceThreshold,
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
        <h4 className='mb-2 text-xs font-medium text-gray-700'>Pose Detection Settings</h4>

        {/* Model selection */}
        {setModelType && (
          <div className='mb-3 space-y-2'>
            <label htmlFor='model-type' className='block text-xs font-medium text-gray-700'>
              Pose Model
            </label>
            <select
              id='model-type'
              value={modelType}
              onChange={(e) => setModelType(e.target.value)}
              disabled={isProcessing}
              className='w-full rounded-md border border-gray-300 py-1 pr-10 pl-3 text-xs text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
            >
              <option value='YOLOv8'>YOLOv8 (Recommended)</option>
              <option value='MediaPipe'>MediaPipe</option>
            </select>
          </div>
        )}

        {/* Confidence threshold */}
        {setConfidenceThreshold && (
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <label htmlFor='confidence' className='block text-xs font-medium text-gray-700'>
                Confidence Threshold: {confidenceThreshold}%
              </label>
            </div>
            <input
              id='confidence'
              type='range'
              min='1'
              max='100'
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(parseInt(e.target.value))}
              disabled={isProcessing}
              className='h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200'
            />
          </div>
        )}
      </div>

      {/* Button removed - will be placed above StageNavigator */}
    </div>
  );
};

export default PoseStage;
