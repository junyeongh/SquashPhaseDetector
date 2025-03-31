import React from 'react';
import {
  CheckCircle,
  Circle,
  Loader,
  Play,
  ArrowRight,
  ArrowLeft,
  User,
  UserRound,
  ListChecks,
  FileJson,
  Video,
  FileText,
} from 'lucide-react';
import { Point } from '@/services/api/segmentation';

// Define the types of processing stages
export type ProcessingStage =
  | 'preprocess'
  | 'segmentation'
  | 'pose'
  | 'game_state'
  | 'export';

// Stage configuration type
export interface StageConfig {
  id: ProcessingStage;
  label: string;
  description: string;
}

interface ProcessSidebarProps {
  activeStage: ProcessingStage;
  completedStages: Set<ProcessingStage>;
  isProcessing: boolean;
  processingStatus: string;

  // Stage configuration
  stageConfig: StageConfig[];

  // Stage selection
  onStageSelect?: (stage: ProcessingStage) => void;

  // Processing action props
  onProcess?: () => void;
  onMarkPlayers?: () => void;
  onStartSegmentation?: () => void;
  onStartPoseDetection?: () => void;

  // Skip button props
  showSkipButton?: boolean;
  onSkipStage?: () => void;

  // Controls for different stages
  modelType?: string;
  confidenceThreshold?: number;
  setModelType?: (type: string) => void;
  setConfidenceThreshold?: (threshold: number) => void;

  // Navigation controls
  onPreviousFrame?: () => void;
  onNextFrame?: () => void;
  onPreviousStage?: (stage?: ProcessingStage) => void;
  onNextStage?: (stage?: ProcessingStage) => void;

  // Player points for segmentation
  player1Points?: Point[];
  player2Points?: Point[];

  // Player selection controls
  activePlayer?: 1 | 2;
  setActivePlayer?: (player: 1 | 2) => void;

  // Points marking controls
  onClearPlayerPoints?: (player: 1 | 2) => void;

  // Export controls
  onExportJson?: () => void;
  onExportVideo?: () => void;
  onExportReport?: () => void;
}

const ProcessSidemenu: React.FC<ProcessSidebarProps> = ({
  activeStage,
  completedStages,
  isProcessing,
  processingStatus,
  stageConfig,

  // Stage selection
  onStageSelect,

  // Processing actions
  onProcess,
  onMarkPlayers,
  onStartSegmentation,
  onStartPoseDetection,

  // Skip button
  showSkipButton = false,
  onSkipStage,

  // Controls
  modelType,
  confidenceThreshold,
  setModelType,
  setConfidenceThreshold,

  // Navigation
  onPreviousFrame,
  onNextFrame,
  onPreviousStage,
  onNextStage,

  // Player points
  player1Points = [],
  player2Points = [],

  // Player selection
  activePlayer = 1,
  setActivePlayer,

  // Clear points
  onClearPlayerPoints,

  // Export actions
  onExportJson,
  onExportVideo,
  onExportReport,
}) => {
  // Use the provided stage configuration instead of the hardcoded one
  const processingStages = stageConfig;

  // Get previous and next stage based on current stage
  const getPreviousStage = (): ProcessingStage | null => {
    const stageIds = processingStages.map((s) => s.id);
    const currentIndex = stageIds.indexOf(activeStage);
    return currentIndex > 0
      ? (stageIds[currentIndex - 1] as ProcessingStage)
      : null;
  };

  const getNextStage = (): ProcessingStage | null => {
    const stageIds = processingStages.map((s) => s.id);
    const currentIndex = stageIds.indexOf(activeStage);
    return currentIndex < stageIds.length - 1
      ? (stageIds[currentIndex + 1] as ProcessingStage)
      : null;
  };

  const prevStage = getPreviousStage();
  const nextStage = getNextStage();

  // Get current stage details
  const currentStage = processingStages.find(
    (stage) => stage.id === activeStage
  );

  // Render processing controls based on active stage
  const renderProcessingControls = () => {
    if (isProcessing) {
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
    }

    switch (activeStage) {
      case 'preprocess':
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

      case 'segmentation':
        return (
          <div className='space-y-3'>
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
                    Player 1{' '}
                    {player1Points.length > 0 && `(${player1Points.length})`}
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
                    Player 2{' '}
                    {player2Points.length > 0 && `(${player2Points.length})`}
                  </button>
                </div>
              )}

              <p className='mb-2 text-xs text-gray-600'>
                Mark players by clicking on the video frame. Select a player
                above first, then add points.
              </p>

              {/* Clear points buttons */}
              {onClearPlayerPoints && (
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
              )}
            </div>

            <div className='flex flex-col gap-2'>
              <button
                onClick={onMarkPlayers}
                disabled={
                  isProcessing ||
                  !player1Points?.length ||
                  !player2Points?.length
                }
                className={`flex items-center justify-center gap-2 rounded px-4 py-2 text-sm transition-colors ${
                  isProcessing ||
                  !player1Points?.length ||
                  !player2Points?.length
                    ? 'cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400'
                    : 'border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Mark Players
              </button>

              <button
                onClick={onStartSegmentation}
                disabled={isProcessing}
                className='flex items-center justify-center gap-2 rounded border border-blue-300 bg-blue-100 px-4 py-2 text-sm text-blue-700 transition-colors hover:bg-blue-200'
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

      case 'pose':
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
                    onChange={(e) =>
                      setConfidenceThreshold(parseInt(e.target.value))
                    }
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

      case 'game_state':
        return (
          <div className='space-y-3'>
            <div className='rounded-md border border-gray-200 bg-gray-50 p-3'>
              <h4 className='mb-2 text-xs font-medium text-gray-700'>
                Game State Analysis
              </h4>
              <p className='text-xs text-gray-600'>
                Analyze game state based on detected poses and player movements.
              </p>
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

      case 'export':
        return (
          <div className='space-y-3'>
            <div className='rounded-md border border-gray-200 bg-gray-50 p-3'>
              <h4 className='mb-2 text-xs font-medium text-gray-700'>
                Export Options
              </h4>
              <p className='mb-3 text-xs text-gray-600'>
                Export your analysis results in various formats.
              </p>

              <div className='space-y-2'>
                <button
                  onClick={onExportJson}
                  disabled={isProcessing || !onExportJson}
                  className='flex w-full items-center justify-center gap-2 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50'
                >
                  <FileJson className='h-3.5 w-3.5' />
                  Export JSON
                </button>

                <button
                  onClick={onExportVideo}
                  disabled={isProcessing || !onExportVideo}
                  className='flex w-full items-center justify-center gap-2 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50'
                >
                  <Video className='h-3.5 w-3.5' />
                  Generate Video
                </button>

                <button
                  onClick={onExportReport}
                  disabled={isProcessing || !onExportReport}
                  className='flex w-full items-center justify-center gap-2 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50'
                >
                  <FileText className='h-3.5 w-3.5' />
                  Generate Report
                </button>
              </div>
            </div>

            <div className='rounded-lg border border-blue-100 bg-blue-50 p-3'>
              <p className='text-xs text-blue-700'>
                <span className='font-medium'>Note:</span> Export functionality
                is currently in development and will be available soon.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Render the stages overview
  const renderStagesOverview = () => {
    return (
      <button
        onClick={() => onStageSelect?.(activeStage)}
        disabled={!onStageSelect || isProcessing}
        className='mb-3 flex w-full items-center justify-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100'
      >
        <ListChecks className='h-4 w-4' />
        <span>View All Stages</span>
      </button>
    );
  };

  // Find current stage index
  const currentStageIndex = processingStages.findIndex(
    (stage) => stage.id === activeStage
  );
  const totalStages = processingStages.length;

  return (
    <div className='flex h-full w-full flex-col border-l border-gray-200'>
      {/* Main content area with scrolling */}
      <div className='flex flex-1 flex-col overflow-auto p-4'>
        <h2 className='text-md mb-4 font-semibold'>Processing Progress</h2>

        {/* Stages overview button */}
        {renderStagesOverview()}

        {/* Current stage information */}
        {currentStage && (
          <div className='mb-4'>
            <div className='mb-1 flex items-center gap-2'>
              <div className='flex h-6 w-6 items-center justify-center rounded-full bg-blue-100'>
                <span className='text-xs font-medium text-blue-700'>
                  {currentStageIndex + 1}
                </span>
              </div>
              <span className='text-sm font-medium'>
                Stage {currentStageIndex + 1}/{totalStages}:{' '}
                {currentStage.label}
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
        )}

        {/* Processing controls for current stage */}
        <div className='flex-1'>{renderProcessingControls()}</div>
      </div>

      {/* Fixed footer with navigation controls */}
      <div className='border-t border-gray-200 bg-gray-50 p-3'>
        <div className='flex items-center justify-between'>
          <button
            onClick={
              prevStage && onPreviousStage
                ? () => onPreviousStage(prevStage)
                : undefined
            }
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
            onClick={
              nextStage && onNextStage
                ? () => onNextStage(nextStage)
                : undefined
            }
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
    </div>
  );
};

export default ProcessSidemenu;
