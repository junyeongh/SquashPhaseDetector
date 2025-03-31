import React from 'react';
import {
  User,
  UserRound,
  Plus,
  Minus,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { SegmentationStageProps } from '../types';
import ProcessingIndicator from '../ui/ProcessingIndicator';

const SegmentationStage: React.FC<SegmentationStageProps> = ({
  isProcessing,
  processingStatus,
  showSkipButton,
  onSkipStage,
  segmentationModel = 'Basic',
  setSegmentationModel,
  activeMarkerType = 'positive',
  setActiveMarkerType,
  player1Points = [],
  player2Points = [],
  player1PositivePoints = [],
  player1NegativePoints = [],
  player2PositivePoints = [],
  player2NegativePoints = [],
  activePlayer = 1,
  setActivePlayer,
  onClearPlayerPoints,
  onClearPlayerMarkerPoints,
  onMarkPlayers,
  onStartSegmentation,
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
      {/* Segmentation Model Selection */}
      {setSegmentationModel && (
        <div className='rounded-md border border-gray-200 bg-gray-50 p-3'>
          <h4 className='mb-2 text-xs font-medium text-gray-700'>
            Segmentation Model
          </h4>
          <select
            id='segmentation-model'
            value={segmentationModel}
            onChange={(e) => setSegmentationModel(e.target.value)}
            disabled={isProcessing}
            className='w-full rounded-md border border-gray-300 py-1 pr-10 pl-3 text-xs text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
          >
            <option value='SAM2'>SAM2 (Recommended)</option>
            <option value='Basic'>Basic Segmentation</option>
          </select>
        </div>
      )}

      <div className='rounded-md border border-gray-200 bg-gray-50 p-3'>
        <h4 className='mb-2 text-xs font-medium text-gray-700'>
          Player Selection
        </h4>

        {/* Player selection toggle */}
        {setActivePlayer && (
          <div className='mb-3 flex space-x-2'>
            <button
              onClick={() => setActivePlayer(1)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded py-1.5 text-xs font-medium ${
                activePlayer === 1
                  ? 'border border-red-300 bg-red-100 text-red-700'
                  : 'border border-gray-200 bg-gray-100 text-gray-600'
              }`}
            >
              <User className='h-3 w-3' />
              Player 1 {player1Points.length > 0 && `(${player1Points.length})`}
              {segmentationModel === 'SAM2' &&
                ` (${player1PositivePoints.length}+/${player1NegativePoints.length}-)`}
            </button>

            <button
              onClick={() => setActivePlayer(2)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded py-1.5 text-xs font-medium ${
                activePlayer === 2
                  ? 'border border-blue-300 bg-blue-100 text-blue-700'
                  : 'border border-gray-200 bg-gray-100 text-gray-600'
              }`}
            >
              <UserRound className='h-3 w-3' />
              Player 2 {player2Points.length > 0 && `(${player2Points.length})`}
              {segmentationModel === 'SAM2' &&
                ` (${player2PositivePoints.length}+/${player2NegativePoints.length}-)`}
            </button>
          </div>
        )}

        {/* SAM2 Marker Type Selection */}
        {segmentationModel === 'SAM2' && setActiveMarkerType && (
          <div className='mb-3'>
            <h5 className='mb-1 text-xs font-medium text-gray-700'>
              Marker Type
            </h5>
            <div className='flex space-x-2'>
              <button
                onClick={() => setActiveMarkerType('positive')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded py-1.5 text-xs font-medium ${
                  activeMarkerType === 'positive'
                    ? 'border border-green-300 bg-green-100 text-green-700'
                    : 'border border-gray-200 bg-gray-100 text-gray-600'
                }`}
              >
                <Plus className='h-3 w-3' />
                Positive
              </button>

              <button
                onClick={() => setActiveMarkerType('negative')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded py-1.5 text-xs font-medium ${
                  activeMarkerType === 'negative'
                    ? 'border border-red-300 bg-red-100 text-red-700'
                    : 'border border-gray-200 bg-gray-100 text-gray-600'
                }`}
              >
                <Minus className='h-3 w-3' />
                Negative
              </button>
            </div>
          </div>
        )}

        <p className='mb-2 text-xs text-gray-600'>
          {segmentationModel === 'SAM2'
            ? 'Add markers by clicking on the video frame. Use positive markers to include areas and negative markers to exclude areas.'
            : 'Mark players by clicking on the video frame. Select a player above first, then add points.'}
        </p>

        {/* Clear points buttons */}
        {segmentationModel === 'SAM2' && onClearPlayerMarkerPoints ? (
          <div className='space-y-2'>
            <div className='flex space-x-2'>
              <button
                onClick={() => onClearPlayerMarkerPoints(1, 'positive')}
                disabled={player1PositivePoints.length === 0}
                className={`flex-1 rounded py-1 text-xs ${
                  player1PositivePoints.length > 0
                    ? 'text-green-600 hover:bg-green-50'
                    : 'cursor-not-allowed text-gray-400'
                }`}
              >
                Clear P1 Positive
              </button>

              <button
                onClick={() => onClearPlayerMarkerPoints(1, 'negative')}
                disabled={player1NegativePoints.length === 0}
                className={`flex-1 rounded py-1 text-xs ${
                  player1NegativePoints.length > 0
                    ? 'text-red-600 hover:bg-red-50'
                    : 'cursor-not-allowed text-gray-400'
                }`}
              >
                Clear P1 Negative
              </button>
            </div>
            <div className='flex space-x-2'>
              <button
                onClick={() => onClearPlayerMarkerPoints(2, 'positive')}
                disabled={player2PositivePoints.length === 0}
                className={`flex-1 rounded py-1 text-xs ${
                  player2PositivePoints.length > 0
                    ? 'text-green-600 hover:bg-green-50'
                    : 'cursor-not-allowed text-gray-400'
                }`}
              >
                Clear P2 Positive
              </button>

              <button
                onClick={() => onClearPlayerMarkerPoints(2, 'negative')}
                disabled={player2NegativePoints.length === 0}
                className={`flex-1 rounded py-1 text-xs ${
                  player2NegativePoints.length > 0
                    ? 'text-red-600 hover:bg-red-50'
                    : 'cursor-not-allowed text-gray-400'
                }`}
              >
                Clear P2 Negative
              </button>
            </div>
          </div>
        ) : (
          onClearPlayerPoints && (
            <div className='flex space-x-2'>
              <button
                onClick={() => onClearPlayerPoints(1)}
                disabled={player1Points.length === 0}
                className={`flex-1 rounded py-1 text-xs ${
                  player1Points.length > 0
                    ? 'text-red-600 hover:bg-red-50'
                    : 'cursor-not-allowed text-gray-400'
                }`}
              >
                Clear Player 1
              </button>

              <button
                onClick={() => onClearPlayerPoints(2)}
                disabled={player2Points.length === 0}
                className={`flex-1 rounded py-1 text-xs ${
                  player2Points.length > 0
                    ? 'text-blue-600 hover:bg-blue-50'
                    : 'cursor-not-allowed text-gray-400'
                }`}
              >
                Clear Player 2
              </button>
            </div>
          )
        )}
      </div>

      <div className='flex flex-col gap-2'>
        {segmentationModel !== 'SAM2' && (
          <button
            onClick={onMarkPlayers}
            disabled={
              isProcessing || !player1Points?.length || !player2Points?.length
            }
            className={`flex items-center justify-center gap-2 rounded px-4 py-2 text-sm transition-colors ${
              isProcessing || !player1Points?.length || !player2Points?.length
                ? 'cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400'
                : 'border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Mark Players
          </button>
        )}

        <button
          onClick={onStartSegmentation}
          disabled={
            isProcessing ||
            (segmentationModel === 'SAM2' &&
              player1PositivePoints.length === 0 &&
              player2PositivePoints.length === 0)
          }
          className='flex items-center justify-center gap-2 rounded border border-blue-300 bg-blue-100 px-4 py-2 text-sm text-blue-700 transition-colors hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-50'
        >
          Start Segmentation
        </button>
      </div>

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

export default SegmentationStage;
