import React, { useState, ReactNode } from 'react';
import { Play, Loader, Check, ChevronDown, ChevronUp, ArrowLeft, ArrowRight } from 'lucide-react';
import { MainviewTimestamp } from '@/services/api/video';
import InteractiveCanvas from '@/components/video/InteractiveCanvas';
import { Point, SegmentationResult } from '@/services/api/segmentation';
import { FramePoseResult } from '@/services/api/pose';
import PoseOverlay from '@/components/video/PoseOverlay';
import { ProcessingStage } from '@/components/ProcessingProgressSidemenu';

interface PreprocessContentProps {
  onProcess: () => void;
  isProcessing: boolean;
  processingStatus: string;
  mainviewTimestamps: MainviewTimestamp[];
  duration: number;
  currentTime: number;
  onSeek?: (time: number) => void;
  buttonConfig?: { label: string; icon: React.ReactNode };
  currentStage: ProcessingStage;
  onPreviousStage?: () => void;
  onNextStage?: () => void;
}

export const PreprocessContent: React.FC<PreprocessContentProps> = ({
  onProcess,
  isProcessing,
  processingStatus,
  mainviewTimestamps,
  duration,
  currentTime,
  onSeek,
  buttonConfig,
  currentStage,
  onPreviousStage,
  onNextStage,
}) => {
  const playheadPosition = (currentTime / duration) * 100;
  const hasMainViewSegments =
    mainviewTimestamps && mainviewTimestamps.length > 0;

  return (
    <StageWrapper
      title="Video Preprocessing"
      description="Analyze the video to detect main view angles and prepare it for player segmentation."
      currentStage={currentStage}
      onPreviousStage={onPreviousStage}
      onNextStage={onNextStage}
    >
      <div className='flex items-start justify-between mb-4'>
        <div className='text-sm text-gray-600'>
          Use this stage to automatically detect the main view segments in your squash video.
        </div>

        <button
          onClick={onProcess}
          disabled={isProcessing}
          className={`flex items-center gap-2 rounded px-4 py-1.5 text-sm transition-colors ${
            isProcessing
              ? 'cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400'
              : 'border border-gray-300 bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {isProcessing ? (
            <>
              <Loader className='h-3 w-3 animate-spin' />
              Processing...
            </>
          ) : (
            <>
              {buttonConfig?.icon || <Play className='h-3 w-3' />}
              {buttonConfig?.label || 'Process Video'}
            </>
          )}
        </button>
      </div>

      {/* Processing status indicator with more detailed feedback */}
      {isProcessing && (
        <div className='mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3'>
          <div className='mb-2 flex items-center space-x-2'>
            <Loader className='h-3 w-3 animate-spin text-gray-500' />
            <span className='text-sm font-medium text-gray-700'>
              {processingStatus}
            </span>
          </div>

          <div className='mt-2'>
            <div className='mb-1 flex justify-between text-xs text-gray-500'>
              <span>Processing video frames</span>
              <span>This may take a few minutes</span>
            </div>
            <div className='relative h-2 w-full overflow-hidden rounded-full bg-gray-200'>
              <div className='absolute left-0 h-full w-1/2 animate-pulse bg-blue-200'></div>
            </div>
          </div>
        </div>
      )}

      {/* MainviewTimeline for preprocessing stage */}
      <div className='rounded-lg border border-gray-200 bg-gray-50 p-3'>
        <div className='mb-3 flex items-center justify-between'>
          <div className='text-sm font-medium text-gray-700'>
            Main View Segments
          </div>
          <div className='text-xs text-gray-500'>
            {hasMainViewSegments ? (
              <span className='flex items-center gap-1'>
                <Check className='h-3 w-3 text-green-500' />
                <span>
                  <span className='font-medium'>
                    {mainviewTimestamps.length}
                  </span>{' '}
                  segments detected
                </span>
              </span>
            ) : isProcessing ? (
              <span className='flex items-center gap-1'>
                <Loader className='h-3 w-3 animate-spin text-gray-500' />
                <span>Detecting segments...</span>
              </span>
            ) : (
              <span>No segments detected yet</span>
            )}
          </div>
        </div>

        <div className='relative h-8 w-full overflow-hidden rounded bg-gray-200'>
          {/* Timeline segments */}
          {hasMainViewSegments ? (
            mainviewTimestamps.map((segment, index) => {
              const startPercent = (segment.start / duration) * 100;
              const widthPercent =
                ((segment.end - segment.start) / duration) * 100;

              return (
                <div
                  key={index}
                  className='absolute h-full cursor-pointer bg-blue-200 transition-colors hover:bg-blue-300'
                  style={{
                    left: `${startPercent}%`,
                    width: `${widthPercent}%`,
                  }}
                  onClick={() => onSeek && onSeek(segment.start)}
                  title={`Segment ${index + 1}: ${segment.start.toFixed(2)}s - ${segment.end.toFixed(2)}s`}
                />
              );
            })
          ) : isProcessing ? (
            // Show loading animation when processing
            <div className='absolute inset-0 flex items-center justify-center'>
              <div className='h-1 w-full animate-pulse bg-gray-300'></div>
            </div>
          ) : null}

          {/* Playhead - only show if we have a duration */}
          {duration > 0 && (
            <div
              className='absolute top-0 h-full w-1 bg-gray-600'
              style={{ left: `${playheadPosition}%` }}
            />
          )}
        </div>

        {hasMainViewSegments && (
          <div className='mt-2 text-xs text-gray-500'>
            Click on a segment to jump to that position in the video
          </div>
        )}
      </div>
    </StageWrapper>
  );
};

export const SegmentationContent = ({
  frameUrl,
  frameIndex,
  player1Points,
  player2Points,
  onPlayer1PointsChange,
  onPlayer2PointsChange,
  onMarkPlayers,
  onStartSegmentation,
  isProcessing,
  processingStatus,
  segmentationResults,
  onNextFrame,
  onPreviousFrame,
  currentStage,
  onPreviousStage,
  onNextStage,
}: {
  frameUrl: string;
  frameIndex: number;
  player1Points: Point[];
  player2Points: Point[];
  onPlayer1PointsChange: (points: Point[]) => void;
  onPlayer2PointsChange: (points: Point[]) => void;
  onMarkPlayers: () => void;
  onStartSegmentation: () => void;
  isProcessing: boolean;
  processingStatus: string;
  segmentationResults: SegmentationResult[] | null;
  onNextFrame?: () => void;
  onPreviousFrame?: () => void;
  currentStage: ProcessingStage;
  onPreviousStage?: () => void;
  onNextStage?: () => void;
}) => {
  const [activePlayer, setActivePlayer] = useState<1 | 2>(1);
  const [confidence, setConfidence] = useState<number>(80);

  // Calculate frameSize based on a standard 16:9 ratio, limited to a max width
  const frameWidth = Math.min(800, window.innerWidth - 40);
  const frameHeight = (frameWidth * 9) / 16;

  return (
    <StageWrapper
      title="Player Segmentation"
      description="Mark players in the frame and generate segmentation masks for tracking."
      currentStage={currentStage}
      onPreviousStage={onPreviousStage}
      onNextStage={onNextStage}
    >
      <div className='mb-4 flex items-start justify-between'>
        <div>
          <p className='text-sm text-gray-600'>
            Mark players in the frame by clicking on them. Add multiple points
            for better segmentation.
          </p>
        </div>

        <div className='flex gap-2'>
          <button
            onClick={onMarkPlayers}
            disabled={
              isProcessing ||
              player1Points.length === 0 ||
              player2Points.length === 0
            }
            className={`flex items-center gap-2 rounded px-4 py-1.5 text-sm transition-colors ${
              isProcessing ||
              player1Points.length === 0 ||
              player2Points.length === 0
                ? 'cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400'
                : 'border border-gray-300 bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Mark Players
          </button>

          <button
            onClick={onStartSegmentation}
            disabled={isProcessing}
            className={`flex items-center gap-2 rounded px-4 py-1.5 text-sm transition-colors ${
              isProcessing
                ? 'cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400'
                : 'border border-blue-300 bg-blue-200 text-blue-700 hover:bg-blue-300'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader className='h-3 w-3 animate-spin' />
                Processing...
              </>
            ) : (
              'Start Segmentation'
            )}
          </button>
        </div>
      </div>

      {/* Processing status indicator */}
      {isProcessing && (
        <div className='mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3'>
          <div className='mb-2 flex items-center space-x-2'>
            <Loader className='h-3 w-3 animate-spin text-gray-500' />
            <span className='text-sm font-medium text-gray-700'>
              {processingStatus}
            </span>
          </div>

          <div className='mt-2'>
            <div className='mb-1 flex justify-between text-xs text-gray-500'>
              <span>Segmenting players</span>
              <span>This may take several minutes</span>
            </div>
            <div className='relative h-2 w-full overflow-hidden rounded-full bg-gray-200'>
              <div className='absolute left-0 h-full w-1/2 animate-pulse bg-blue-200'></div>
            </div>
          </div>
        </div>
      )}

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        {/* Interactive canvas for player marking */}
        <div>
          <div className='mb-2 text-sm font-medium text-gray-700'>
            Mark Players
          </div>
          <div className='rounded-lg border border-gray-200'>
            <InteractiveCanvas
              imageUrl={frameUrl}
              width={frameWidth}
              height={frameHeight}
              player1Points={player1Points}
              player2Points={player2Points}
              onPlayer1PointsChange={onPlayer1PointsChange}
              onPlayer2PointsChange={onPlayer2PointsChange}
              activePlayer={activePlayer}
              setActivePlayer={setActivePlayer}
              disabled={isProcessing}
            />
          </div>
          <div className='mt-2 text-xs text-gray-500'>
            Click on players to mark them. Add multiple points for each player.
          </div>
        </div>

        {/* Segmentation controls and settings */}
        <div>
          <div className='mb-2 text-sm font-medium text-gray-700'>
            Segmentation Controls
          </div>
          <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
            <div className='space-y-4'>
              <div>
                <label className='mb-1 block text-xs font-medium text-gray-700'>
                  Detection Confidence ({confidence}%)
                </label>
                <input
                  type='range'
                  min='0'
                  max='100'
                  value={confidence}
                  onChange={(e) => setConfidence(parseInt(e.target.value))}
                  className='w-full'
                />
              </div>
              <div>
                <label className='mb-1 block text-xs font-medium text-gray-700'>
                  Frame Navigation
                </label>
                <div className='flex items-center gap-2'>
                  <button
                    className='rounded border border-gray-200 bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200'
                    disabled={isProcessing}
                    onClick={onPreviousFrame}
                  >
                    Previous Frame
                  </button>
                  <span className='text-xs text-gray-600'>
                    Frame {frameIndex}
                  </span>
                  <button
                    className='rounded border border-gray-200 bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200'
                    disabled={isProcessing}
                    onClick={onNextFrame}
                  >
                    Next Frame
                  </button>
                </div>
              </div>
              <div>
                <label className='mb-1 block text-xs font-medium text-gray-700'>
                  Instructions
                </label>
                <ul className='ml-4 list-disc text-xs text-gray-600'>
                  <li>
                    Mark Player 1 with red points (multiple points recommended)
                  </li>
                  <li>
                    Mark Player 2 with blue points (multiple points recommended)
                  </li>
                  <li>Click "Mark Players" to save the current frame</li>
                  <li>
                    Navigate to other frames and mark players there as well
                  </li>
                  <li>Click "Start Segmentation" when done marking frames</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Segmentation results, if available */}
      {segmentationResults && segmentationResults.length > 0 && (
        <div className='mt-6'>
          <div className='mb-2 text-sm font-medium text-gray-700'>
            Segmentation Results
          </div>
          <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
            <div className='text-sm text-gray-600'>
              Successfully segmented {segmentationResults.length} frames
            </div>
            {/* We could add a preview of segmentation results here */}
          </div>
        </div>
      )}
    </StageWrapper>
  );
};

export const PoseContent = ({
  frameUrl,
  frameIndex,
  onStartPoseDetection,
  isProcessing,
  processingStatus,
  poseResults,
  modelType,
  setModelType,
  confidenceThreshold,
  setConfidenceThreshold,
  onNextFrame,
  onPreviousFrame,
  currentStage,
  onPreviousStage,
  onNextStage
}: {
  frameUrl: string;
  frameIndex: number;
  onStartPoseDetection: () => void;
  isProcessing: boolean;
  processingStatus: string;
  poseResults: FramePoseResult[] | null;
  modelType: string;
  setModelType: (type: string) => void;
  confidenceThreshold: number;
  setConfidenceThreshold: (threshold: number) => void;
  onNextFrame?: () => void;
  onPreviousFrame?: () => void;
  currentStage: ProcessingStage;
  onPreviousStage?: () => void;
  onNextStage?: () => void;
}) => {
  // Calculate frameSize based on a standard 16:9 ratio, limited to a max width
  const frameWidth = Math.min(800, window.innerWidth - 40);
  const frameHeight = (frameWidth * 9) / 16;

  // Find the current frame's pose result, if available
  const currentFramePose = poseResults?.find(
    (p) => p.frameIndex === frameIndex
  );

  return (
    <StageWrapper
      title="Pose Detection"
      description="Detect player poses and body landmarks throughout the video."
      currentStage={currentStage}
      onPreviousStage={onPreviousStage}
      onNextStage={onNextStage}
    >
      <div className='mb-4 flex items-start justify-between'>
        <div>
          <p className='text-sm text-gray-600'>
            Analyze player movements and detect body landmarks for pose tracking.
          </p>
        </div>

        <button
          onClick={onStartPoseDetection}
          disabled={isProcessing}
          className={`flex items-center gap-2 rounded px-4 py-1.5 text-sm transition-colors ${
            isProcessing
              ? 'cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400'
              : 'border border-blue-300 bg-blue-200 text-blue-700 hover:bg-blue-300'
          }`}
        >
          {isProcessing ? (
            <>
              <Loader className='h-3 w-3 animate-spin' />
              Processing...
            </>
          ) : (
            'Start Pose Detection'
          )}
        </button>
      </div>

      {/* Processing status indicator */}
      {isProcessing && (
        <div className='mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3'>
          <div className='mb-2 flex items-center space-x-2'>
            <Loader className='h-3 w-3 animate-spin text-gray-500' />
            <span className='text-sm font-medium text-gray-700'>
              {processingStatus}
            </span>
          </div>

          <div className='mt-2'>
            <div className='mb-1 flex justify-between text-xs text-gray-500'>
              <span>Detecting poses in frames</span>
              <span>This may take several minutes</span>
            </div>
            <div className='relative h-2 w-full overflow-hidden rounded-full bg-gray-200'>
              <div className='absolute left-0 h-full w-1/2 animate-pulse bg-blue-200'></div>
            </div>
          </div>
        </div>
      )}

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        {/* Pose preview area */}
        <div>
          <div className='mb-2 text-sm font-medium text-gray-700'>
            Preview Frame
          </div>
          <div className='relative overflow-hidden rounded-lg border border-gray-200'>
            {/* Show frame with pose overlay if results available for this frame */}
            <img
              src={frameUrl}
              alt={`Frame ${frameIndex}`}
              className='h-auto w-full object-contain'
              style={{ width: frameWidth, height: frameHeight }}
            />

            {/* Pose overlay when results are available */}
            {currentFramePose && (
              <PoseOverlay
                width={frameWidth}
                height={frameHeight}
                player1Pose={currentFramePose.player1Pose}
                player2Pose={currentFramePose.player2Pose}
              />
            )}

            {/* Fallback message when no pose is detected */}
            {!currentFramePose && poseResults && poseResults.length > 0 && (
              <div className='absolute bottom-2 left-2 rounded bg-gray-800 bg-opacity-70 p-1 text-xs text-white'>
                No pose detected in this frame
              </div>
            )}
          </div>
          <div className='mt-2 text-xs text-gray-500'>
            After detection, pose keypoints will be overlaid on the frames.
          </div>
        </div>

        {/* Pose detection settings */}
        <div>
          <div className='mb-2 text-sm font-medium text-gray-700'>
            Pose Detection Settings
          </div>
          <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
            <div className='space-y-4'>
              <div>
                <label className='mb-1 block text-xs font-medium text-gray-700'>
                  Model Type
                </label>
                <select
                  className='w-full rounded border p-1 text-xs'
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value)}
                  disabled={isProcessing}
                >
                  <option value='YOLOv8'>YOLOv8-Pose</option>
                  <option value='YOLOv7'>YOLOv7-Pose</option>
                  <option value='YOLOv8-Large'>YOLOv8-Pose Large</option>
                </select>
              </div>
              <div>
                <label className='mb-1 block text-xs font-medium text-gray-700'>
                  Keypoint Confidence Threshold ({confidenceThreshold}%)
                </label>
                <input
                  type='range'
                  min='0'
                  max='100'
                  value={confidenceThreshold}
                  onChange={(e) =>
                    setConfidenceThreshold(parseInt(e.target.value))
                  }
                  className='w-full'
                  disabled={isProcessing}
                />
              </div>
              <div>
                <label className='mb-1 block text-xs font-medium text-gray-700'>
                  Frame Navigation
                </label>
                <div className='flex items-center gap-2'>
                  <button
                    className='rounded border border-gray-200 bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200'
                    disabled={isProcessing}
                    onClick={onPreviousFrame}
                  >
                    Previous Frame
                  </button>
                  <span className='text-xs text-gray-600'>
                    Frame {frameIndex}
                  </span>
                  <button
                    className='rounded border border-gray-200 bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200'
                    disabled={isProcessing}
                    onClick={onNextFrame}
                  >
                    Next Frame
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pose detection results summary, if available */}
      {poseResults && poseResults.length > 0 && (
        <div className='mt-6'>
          <div className='mb-2 text-sm font-medium text-gray-700'>
            Pose Detection Results
          </div>
          <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
            <div className='text-sm text-gray-600'>
              Successfully detected poses in {poseResults.length} frames
            </div>
            <div className='mt-2 text-xs text-gray-500'>
              Player 1:{' '}
              {poseResults.filter((r) => r.player1Pose !== null).length} frames
              with poses
              <br />
              Player 2:{' '}
              {poseResults.filter((r) => r.player2Pose !== null).length} frames
              with poses
            </div>
          </div>
        </div>
      )}
    </StageWrapper>
  );
};

export const GameStateContent = ({
  currentStage,
  onPreviousStage,
  onNextStage
}: {
  currentStage: ProcessingStage;
  onPreviousStage?: () => void;
  onNextStage?: () => void;
}) => (
  <StageWrapper
    title="Game State Analysis"
    description="Analyze game state, shots, and rallies."
    currentStage={currentStage}
    onPreviousStage={onPreviousStage}
    onNextStage={onNextStage}
  >
    <div className='text-sm text-gray-600 mb-4'>
      Use machine learning to automatically detect rallies, shots, and game states.
    </div>

    <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
      <h2 className='mb-2 text-sm font-medium text-gray-700'>
        Game Analysis Options
      </h2>
      <div className='space-y-4'>
        <div>
          <label className='mb-1 block text-xs font-medium text-gray-700'>
            Shot Classification Model
          </label>
          <select className='w-full rounded border p-1 text-xs'>
            <option>CNN</option>
            <option>LSTM</option>
            <option>Transformer</option>
          </select>
        </div>
        <div className='flex items-center space-x-2'>
          <input type='checkbox' id='rally-detection' defaultChecked />
          <label htmlFor='rally-detection' className='text-xs text-gray-700'>
            Enable Rally Detection
          </label>
        </div>
      </div>
    </div>
  </StageWrapper>
);

export const ExportContent = ({
  currentStage,
  onPreviousStage,
  onNextStage
}: {
  currentStage: ProcessingStage;
  onPreviousStage?: () => void;
  onNextStage?: () => void;
}) => (
  <StageWrapper
    title="Export Results"
    description="Export processed video and analysis results."
    currentStage={currentStage}
    onPreviousStage={onPreviousStage}
    onNextStage={onNextStage}
  >
    <div className='text-sm text-gray-600 mb-4'>
      Export your analysis results in various formats for further processing or visualization.
    </div>

    <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
      <h2 className='mb-2 text-sm font-medium text-gray-700'>Export Options</h2>
      <div className='space-y-4'>
        <div>
          <label className='mb-1 block text-xs font-medium text-gray-700'>
            Export Format
          </label>
          <select className='w-full rounded border p-1 text-xs'>
            <option>MP4 with Annotations</option>
            <option>JSON Analysis Data</option>
            <option>CSV Timeline</option>
          </select>
        </div>
        <div className='flex items-center space-x-2'>
          <input type='checkbox' id='include-metadata' defaultChecked />
          <label htmlFor='include-metadata' className='text-xs text-gray-700'>
            Include Analysis Metadata
          </label>
        </div>
      </div>
    </div>
  </StageWrapper>
);

// New wrapper component for stage content with collapsible sections
interface StageWrapperProps {
  title: string;
  description: string;
  children: ReactNode;
  currentStage: ProcessingStage;
  onPreviousStage?: () => void;
  onNextStage?: () => void;
  isCollapsible?: boolean;
}

export const StageWrapper: React.FC<StageWrapperProps> = ({
  title,
  description,
  children,
  currentStage,
  onPreviousStage,
  onNextStage,
  isCollapsible = true,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Get previous and next stage based on current stage
  const getPreviousStage = (): ProcessingStage | null => {
    switch (currentStage) {
      case 'segmentation':
        return 'preprocess';
      case 'pose':
        return 'segmentation';
      case 'game_state':
        return 'pose';
      case 'export':
        return 'game_state';
      default:
        return null;
    }
  };

  const getNextStage = (): ProcessingStage | null => {
    switch (currentStage) {
      case 'preprocess':
        return 'segmentation';
      case 'segmentation':
        return 'pose';
      case 'pose':
        return 'game_state';
      case 'game_state':
        return 'export';
      default:
        return null;
    }
  };

  const prevStage = getPreviousStage();
  const nextStage = getNextStage();

  return (
    <div className='mb-6 rounded-lg border border-gray-200'>
      <div
        className={`flex items-center justify-between rounded-t-lg border-b border-gray-200 bg-gray-50 p-4 ${isCollapsible ? 'cursor-pointer' : ''}`}
        onClick={() => isCollapsible && setIsCollapsed(!isCollapsed)}
      >
        <div className='flex-1'>
          <h2 className='text-lg font-medium text-gray-800'>{title}</h2>
          <p className='text-sm text-gray-500'>{description}</p>
        </div>

        <div className='flex gap-2'>
          {isCollapsible && (
            <button className='rounded-full p-1 hover:bg-gray-200'>
              {isCollapsed ? (
                <ChevronDown className='h-5 w-5 text-gray-500' />
              ) : (
                <ChevronUp className='h-5 w-5 text-gray-500' />
              )}
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <>
          <div className='p-4'>{children}</div>

          {/* Navigation buttons */}
          <div className='flex justify-between border-t border-gray-200 p-3'>
            <button
              onClick={onPreviousStage}
              disabled={!prevStage || !onPreviousStage}
              className={`flex items-center gap-1 rounded px-3 py-1 text-sm ${
                prevStage && onPreviousStage
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'cursor-not-allowed text-gray-300'
              }`}
            >
              <ArrowLeft className='h-4 w-4' />
              Previous
            </button>

            <button
              onClick={onNextStage}
              disabled={!nextStage || !onNextStage}
              className={`flex items-center gap-1 rounded px-3 py-1 text-sm ${
                nextStage && onNextStage
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'cursor-not-allowed text-gray-300'
              }`}
            >
              Next
              <ArrowRight className='h-4 w-4' />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
