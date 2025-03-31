import React, { ReactNode } from 'react';
import { MainviewTimestamp } from '@/services/api/video';
import InteractiveCanvas from '@/components/video/InteractiveCanvas';
import { Point, SegmentationResult } from '@/services/api/segmentation';
import { FramePoseResult } from '@/services/api/pose';
import PoseOverlay from '@/components/video/PoseOverlay';

interface PreprocessContentProps {
  mainviewTimestamps?: MainviewTimestamp[];
}

export const PreprocessContent: React.FC<PreprocessContentProps> = ({
  mainviewTimestamps = [],
}) => {
  return (
    <StageWrapper
      title='Video Preprocessing'
      description='Analyze the video to detect main view angles and prepare it for player segmentation.'
    >
      <div className='mb-4'>
        <div className='text-sm text-gray-600'>
          This stage automatically detects the main view segments in your
          squash video. Use the video player below to review the footage.
        </div>
      </div>

      {mainviewTimestamps.length > 0 && (
        <div className="mt-4 rounded-lg border border-green-100 bg-green-50 p-3">
          <p className="text-sm text-green-700">
            <span className="font-medium">Main view detection complete.</span> {mainviewTimestamps.length} segments detected.
          </p>
        </div>
      )}

      {/* MainviewTimeline has been moved to VideoPlayer component */}
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
  segmentationResults,
}: {
  frameUrl: string;
  frameIndex: number;
  player1Points: Point[];
  player2Points: Point[];
  onPlayer1PointsChange: (points: Point[]) => void;
  onPlayer2PointsChange: (points: Point[]) => void;
  segmentationResults: SegmentationResult[] | null;
}) => {
  const [activePlayer, setActivePlayer] = React.useState<1 | 2>(1);

  // Calculate frameSize based on a standard 16:9 ratio, limited to a max width
  const frameWidth = Math.min(800, window.innerWidth - 40);
  const frameHeight = (frameWidth * 9) / 16;

  return (
    <StageWrapper
      title='Player Segmentation'
      description='Mark players in the frame and generate segmentation masks for tracking.'
    >
      <div className='mb-4'>
        <p className='text-sm text-gray-600'>
          Mark players in the frame by clicking on them. Add multiple points
          for better segmentation. Use the controls in the sidebar to process.
        </p>
      </div>

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
              disabled={false}
            />
          </div>
          <div className='mt-2 text-xs text-gray-500'>
            Player 1: {player1Points.length} points | Player 2: {player2Points.length} points
          </div>
        </div>

        {/* Segmentation results display */}
        <div>
          <div className='mb-2 text-sm font-medium text-gray-700'>
            Segmentation Results
          </div>
          <div className='rounded-lg border border-gray-200 bg-gray-50 p-4 h-full flex items-center justify-center'>
            {segmentationResults ? (
              <div className='text-center'>
                <span className='text-sm font-medium text-green-600'>
                  Segmentation complete
                </span>
                <p className='mt-1 text-xs text-gray-600'>
                  {segmentationResults.length} frames processed
                </p>
                <p className='mt-2 text-xs text-gray-600'>
                  Current frame: {frameIndex}
                </p>
              </div>
            ) : (
              <div className='text-center'>
                <span className='text-sm text-gray-500'>
                  No segmentation data yet
                </span>
                <p className='mt-1 text-xs text-gray-400'>
                  Use the controls in the sidebar to start segmentation
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </StageWrapper>
  );
};

export const PoseContent = ({
  frameUrl,
  frameIndex,
  poseResults,
}: {
  frameUrl: string;
  frameIndex: number;
  poseResults: FramePoseResult[] | null;
}) => {
  // Calculate frameSize based on a standard 16:9 ratio, limited to a max width
  const frameWidth = Math.min(800, window.innerWidth - 40);
  const frameHeight = (frameWidth * 9) / 16;

  // Get the pose result for the current frame if available
  const currentPoseResult = poseResults
    ? poseResults.find((result) => result.frameIndex === frameIndex)
    : null;

  return (
    <StageWrapper
      title='Pose Detection'
      description='Detect player body positions and movements throughout the video.'
    >
      <div className='mb-4'>
        <p className='text-sm text-gray-600'>
          This stage detects player poses in each frame. Use the video player below
          to review detection results. Use the controls in the sidebar to process.
        </p>
      </div>

      {/* Pose detection results visualization */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        <div>
          <div className='mb-2 text-sm font-medium text-gray-700'>
            Pose Visualization
          </div>
          <div className='relative rounded-lg border border-gray-200 overflow-hidden'>
            <img
              src={frameUrl}
              alt={`Frame ${frameIndex}`}
              style={{ width: frameWidth, height: frameHeight }}
              className='object-cover'
            />
            {currentPoseResult && (
              <div
                className='absolute top-0 left-0'
                style={{ width: frameWidth, height: frameHeight }}
              >
                <PoseOverlay
                  width={frameWidth}
                  height={frameHeight}
                  player1Pose={currentPoseResult.player1Pose}
                  player2Pose={currentPoseResult.player2Pose}
                />
              </div>
            )}
          </div>
        </div>

        <div>
          <div className='mb-2 text-sm font-medium text-gray-700'>
            Pose Detection Results
          </div>
          <div className='rounded-lg border border-gray-200 bg-gray-50 p-4 h-full flex items-center justify-center'>
            {poseResults ? (
              <div className='text-center'>
                <span className='text-sm font-medium text-green-600'>
                  Pose detection complete
                </span>
                <p className='mt-1 text-xs text-gray-600'>
                  {poseResults.length} frames processed
                </p>
                {currentPoseResult && (
                  <p className='mt-2 text-xs text-gray-600'>
                    Current frame: {frameIndex} -
                    {currentPoseResult.player1Pose?.keypoints.length || 0} keypoints for Player 1,{' '}
                    {currentPoseResult.player2Pose?.keypoints.length || 0} keypoints for Player 2
                  </p>
                )}
              </div>
            ) : (
              <div className='text-center'>
                <span className='text-sm text-gray-500'>
                  No pose detection data yet
                </span>
                <p className='mt-1 text-xs text-gray-400'>
                  Use the controls in the sidebar to start pose detection
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </StageWrapper>
  );
};

export const GameStateContent = () => (
  <StageWrapper
    title='Game State Analysis'
    description='Analyze the game state based on player positions and movements.'
  >
    <div className='space-y-4 text-sm'>
      <p className='text-gray-600'>
        This stage analyzes the game state based on detected poses and movements.
        The system will identify key game elements such as:
      </p>

      <ul className='list-disc pl-5 space-y-2 text-gray-600'>
        <li>Rally start and end points</li>
        <li>Player positions and movement patterns</li>
        <li>Shot classifications</li>
        <li>Game flow analysis</li>
      </ul>

      <div className='rounded-lg border border-blue-100 bg-blue-50 p-4'>
        <p className='text-blue-700'>
          <span className='font-medium'>Coming Soon:</span> Game state analysis
          is currently in development and will be available in a future update.
        </p>
      </div>
    </div>
  </StageWrapper>
);

export const ExportContent = () => (
  <StageWrapper
    title='Export Results'
    description='Export the analysis results in various formats.'
  >
    <div className='space-y-4 text-sm'>
      <p className='text-gray-600'>
        Export your analysis results in various formats for further review and
        sharing. Available export options include:
      </p>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
        <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
          <h3 className='font-medium mb-2 text-gray-700'>JSON Data Export</h3>
          <p className='text-xs text-gray-500 mb-3'>
            Raw data export for technical analysis
          </p>
          <button
            className='rounded border border-gray-300 bg-white px-4 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-100'
            disabled
          >
            Export JSON
          </button>
        </div>

        <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
          <h3 className='font-medium mb-2 text-gray-700'>Video Annotation</h3>
          <p className='text-xs text-gray-500 mb-3'>
            Video with overlay of analysis
          </p>
          <button
            className='rounded border border-gray-300 bg-white px-4 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-100'
            disabled
          >
            Generate Video
          </button>
        </div>

        <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
          <h3 className='font-medium mb-2 text-gray-700'>Report PDF</h3>
          <p className='text-xs text-gray-500 mb-3'>
            Detailed analysis report in PDF format
          </p>
          <button
            className='rounded border border-gray-300 bg-white px-4 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-100'
            disabled
          >
            Generate Report
          </button>
        </div>
      </div>

      <div className='rounded-lg border border-blue-100 bg-blue-50 p-4'>
        <p className='text-blue-700'>
          <span className='font-medium'>Coming Soon:</span> Export
          functionality is currently in development and will be available in a
          future update.
        </p>
      </div>
    </div>
  </StageWrapper>
);

interface StageWrapperProps {
  title: string;
  description: string;
  children: ReactNode;
}

export const StageWrapper: React.FC<StageWrapperProps> = ({
  title,
  description,
  children,
}) => {
  return (
    <div className='mb-6 rounded-lg border border-gray-200'>
      <div className='rounded-t-lg border-b border-gray-200 bg-gray-50 p-4'>
        <div className='flex-1'>
          <h2 className='text-lg font-medium text-gray-800'>{title}</h2>
          <p className='text-sm text-gray-500'>{description}</p>
        </div>
      </div>

      <div className='p-4'>{children}</div>
    </div>
  );
};
