import React, { useState } from 'react';
import { User, UserRound, Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { SegmentationStageProps } from '../types';
import ProcessingIndicator from '../ui/ProcessingIndicator';
import { Point } from '@/services/api/segmentation';

interface FrameData {
  player1Points?: Point[];
  player2Points?: Point[];
  player1PositivePoints?: Point[];
  player1NegativePoints?: Point[];
  player2PositivePoints?: Point[];
  player2NegativePoints?: Point[];
}

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
  currentFrameIndex = 0,
  markedFrames,
}) => {
  const [isMarkersDropdownOpen, setIsMarkersDropdownOpen] = useState(false);

  // Handler to clear all points for a player (both regular and marker points)
  const handleClearPlayerAllPoints = (playerId: 1 | 2) => {
    if (onClearPlayerMarkerPoints) {
      onClearPlayerMarkerPoints(playerId, 'positive');
      onClearPlayerMarkerPoints(playerId, 'negative');
    }
    if (onClearPlayerPoints) {
      onClearPlayerPoints(playerId);
    }
  };

  // Create a structure for frames that have markers
  const getMarkedFramesData = (): Array<[number, FrameData]> => {
    // If markedFrames is provided, use it directly
    if (markedFrames && markedFrames.size > 0) {
      return Array.from(markedFrames.entries()).sort(([frameA], [frameB]) => frameA - frameB);
    }

    // Otherwise, use the current frame's data
    const frameData: FrameData = {};

    if (player1Points.length > 0) {
      frameData.player1Points = player1Points;
    }
    if (player2Points.length > 0) {
      frameData.player2Points = player2Points;
    }
    if (player1PositivePoints.length > 0) {
      frameData.player1PositivePoints = player1PositivePoints;
    }
    if (player1NegativePoints.length > 0) {
      frameData.player1NegativePoints = player1NegativePoints;
    }
    if (player2PositivePoints.length > 0) {
      frameData.player2PositivePoints = player2PositivePoints;
    }
    if (player2NegativePoints.length > 0) {
      frameData.player2NegativePoints = player2NegativePoints;
    }

    // Return array with current frame if it has any points
    return Object.keys(frameData).length > 0 ? [[currentFrameIndex, frameData]] : [];
  };

  const markedFramesData = getMarkedFramesData();
  const hasMarkedFrames = markedFramesData.length > 0;

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
          <h4 className='mb-2 text-xs font-medium text-gray-700'>Segmentation Model</h4>
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

      {/* Marker Interface Selection */}
      <div className='rounded-md border border-gray-200 bg-gray-50 p-3'>
        {/* Marker Type Selection - Available for all models */}
        {setActiveMarkerType && (
          <div className='mb-3'>
            <h5 className='mb-1 text-xs font-medium text-gray-700'>Marker Type</h5>
            <p className='mb-2 text-xs text-gray-600'>
              Add markers by clicking on the video frame. Use positive markers to include areas and negative markers to
              exclude areas.
            </p>
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
        <h4 className='mb-2 text-xs font-medium text-gray-700'>Player Selection</h4>

        {/* Player selection toggle */}
        {setActivePlayer && (
          <div className='mb-3 flex space-x-2'>
            <button
              onClick={() => setActivePlayer(1)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded py-1.5 text-xs font-medium ${
                activePlayer === 1
                  ? 'border border-blue-300 bg-blue-100 text-blue-700'
                  : 'border border-gray-200 bg-gray-100 text-gray-600'
              }`}
            >
              <User className='h-3 w-3' />
              Player 1 {player1Points.length > 0 && `(${player1Points.length})`}
              {` (${player1PositivePoints.length}+/${player1NegativePoints.length}-)`}
            </button>

            <button
              onClick={() => setActivePlayer(2)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded py-1.5 text-xs font-medium ${
                activePlayer === 2
                  ? 'border border-yellow-300 bg-yellow-100 text-yellow-700'
                  : 'border border-gray-200 bg-gray-100 text-gray-600'
              }`}
            >
              <UserRound className='h-3 w-3' />
              Player 2 {player2Points.length > 0 && `(${player2Points.length})`}
              {` (${player2PositivePoints.length}+/${player2NegativePoints.length}-)`}
            </button>
          </div>
        )}

        {/* Simplified clear points buttons - One button per player */}
        <div className='flex space-x-2'>
          <button
            onClick={() => handleClearPlayerAllPoints(1)}
            disabled={!player1Points?.length && !player1PositivePoints?.length && !player1NegativePoints?.length}
            className={`flex-1 rounded py-1 text-xs ${
              player1Points?.length || player1PositivePoints?.length || player1NegativePoints?.length
                ? 'text-blue-600 hover:bg-blue-50'
                : 'cursor-not-allowed text-gray-400'
            }`}
          >
            Clear Player 1
          </button>

          <button
            onClick={() => handleClearPlayerAllPoints(2)}
            disabled={!player2Points?.length && !player2PositivePoints?.length && !player2NegativePoints?.length}
            className={`flex-1 rounded py-1 text-xs ${
              player2Points?.length || player2PositivePoints?.length || player2NegativePoints?.length
                ? 'text-yellow-600 hover:bg-yellow-50'
                : 'cursor-not-allowed text-gray-400'
            }`}
          >
            Clear Player 2
          </button>
        </div>
      </div>

      {/* Marker Information Dropdown */}
      <div className='rounded-md border border-gray-200 bg-gray-50 p-3'>
        <button
          onClick={() => setIsMarkersDropdownOpen(!isMarkersDropdownOpen)}
          className='flex w-full items-center justify-between'
        >
          <h4 className='text-xs font-medium text-gray-700'>Marker Information</h4>
          {isMarkersDropdownOpen ? (
            <ChevronUp className='h-4 w-4 text-gray-500' />
          ) : (
            <ChevronDown className='h-4 w-4 text-gray-500' />
          )}
        </button>

        {isMarkersDropdownOpen && (
          <div className='mt-2 max-h-36 overflow-y-auto'>
            {hasMarkedFrames ? (
              markedFramesData.map(([frameIndex, frameData]) => (
                <div key={frameIndex} className='mb-4'>
                  <h5 className='text-xs font-semibold text-gray-800 sticky top-0 bg-gray-50 py-1'>Frame {frameIndex}</h5>

                  <div className='mt-1 flex gap-2'>
                    {/* Player 1 markers */}
                    {((frameData.player1Points && frameData.player1Points.length > 0) ||
                      (frameData.player1PositivePoints && frameData.player1PositivePoints.length > 0) ||
                      (frameData.player1NegativePoints && frameData.player1NegativePoints.length > 0)) && (
                      <div className='flex-1 border-r border-gray-200 pr-2'>
                        <p className='text-xs font-medium text-blue-700'>Player 1</p>

                        {frameData.player1Points && frameData.player1Points.length > 0 && (
                          <div className='mt-1'>
                            <p className='text-xs text-gray-600'>General Points:</p>
                            <ul className='pl-2'>
                              {frameData.player1Points.map((point: Point, idx: number) => (
                                <li key={idx} className='text-xs text-gray-700'>
                                  {point.x}, {point.y}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {frameData.player1PositivePoints && frameData.player1PositivePoints.length > 0 && (
                          <div className='mt-1'>
                            <p className='text-xs text-green-600'>+ Positive Points:</p>
                            <ul className='pl-2'>
                              {frameData.player1PositivePoints.map((point: Point, idx: number) => (
                                <li key={idx} className='text-xs text-gray-700'>
                                  + {point.x}, {point.y}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {frameData.player1NegativePoints && frameData.player1NegativePoints.length > 0 && (
                          <div className='mt-1'>
                            <p className='text-xs text-red-600'>- Negative Points:</p>
                            <ul className='pl-2'>
                              {frameData.player1NegativePoints.map((point: Point, idx: number) => (
                                <li key={idx} className='text-xs text-gray-700'>
                                  - {point.x}, {point.y}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Player 2 markers */}
                    {((frameData.player2Points && frameData.player2Points.length > 0) ||
                      (frameData.player2PositivePoints && frameData.player2PositivePoints.length > 0) ||
                      (frameData.player2NegativePoints && frameData.player2NegativePoints.length > 0)) && (
                      <div className='flex-1 pl-2'>
                        <p className='text-xs font-medium text-yellow-700'>Player 2</p>

                        {frameData.player2Points && frameData.player2Points.length > 0 && (
                          <div className='mt-1'>
                            <p className='text-xs text-gray-600'>General Points:</p>
                            <ul className='pl-2'>
                              {frameData.player2Points.map((point: Point, idx: number) => (
                                <li key={idx} className='text-xs text-gray-700'>
                                  {point.x}, {point.y}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {frameData.player2PositivePoints && frameData.player2PositivePoints.length > 0 && (
                          <div className='mt-1'>
                            <p className='text-xs text-green-600'>+ Positive Points:</p>
                            <ul className='pl-2'>
                              {frameData.player2PositivePoints.map((point: Point, idx: number) => (
                                <li key={idx} className='text-xs text-gray-700'>
                                  + {point.x}, {point.y}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {frameData.player2NegativePoints && frameData.player2NegativePoints.length > 0 && (
                          <div className='mt-1'>
                            <p className='text-xs text-red-600'>- Negative Points:</p>
                            <ul className='pl-2'>
                              {frameData.player2NegativePoints.map((point: Point, idx: number) => (
                                <li key={idx} className='text-xs text-gray-700'>
                                  - {point.x}, {point.y}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className='text-xs text-gray-500 py-2'>No markers added yet</p>
            )}
          </div>
        )}
      </div>

      {/* Button removed - will be placed above StageNavigator */}
    </div>
  );
};

export default SegmentationStage;
