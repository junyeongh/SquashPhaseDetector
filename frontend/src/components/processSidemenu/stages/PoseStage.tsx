import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
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
  onStartPoseDetection,
  onPreviousFrame,
  onNextFrame,
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
        <h4 className='mb-2 text-xs font-medium text-gray-700'>
          Pose Detection Settings
        </h4>

        {/* Model selection */}
        {setModelType && (
          <div className='mb-3 space-y-2'>
            <label
              htmlFor='model-type'
              className='block text-xs font-medium text-gray-700'
            >
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
              <label
                htmlFor='confidence'
                className='block text-xs font-medium text-gray-700'
              >
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

      <button
        onClick={onStartPoseDetection}
        disabled={isProcessing}
        className='flex w-full items-center justify-center gap-2 rounded border border-blue-300 bg-blue-100 px-4 py-2 text-sm text-blue-700 transition-colors hover:bg-blue-200'
      >
        Start Pose Detection
      </button>

      {(onPreviousFrame || onNextFrame) && (
        <div className='mt-2 flex items-center justify-center gap-2'>
          <button
            onClick={onPreviousFrame}
            disabled={isProcessing}
            className='flex items-center justify-center rounded-md border border-gray-300 p-1 text-gray-700 hover:bg-gray-100'
            aria-label='Previous frame'
          >
            <ArrowLeft className='h-4 w-4' />
          </button>
          <span className='text-xs text-gray-500'>Navigate Frames</span>
          <button
            onClick={onNextFrame}
            disabled={isProcessing}
            className='flex items-center justify-center rounded-md border border-gray-300 p-1 text-gray-700 hover:bg-gray-100'
            aria-label='Next frame'
          >
            <ArrowRight className='h-4 w-4' />
          </button>
        </div>
      )}
    </div>
  );
};

export default PoseStage;
