import React from 'react';
import { Play, Loader, Check } from 'lucide-react';
import { MainviewTimestamp } from '@/services/api/video';

interface PreprocessContentProps {
  onProcess: () => void;
  isProcessing: boolean;
  processingStatus: string;
  mainviewTimestamps: MainviewTimestamp[];
  duration: number;
  currentTime: number;
  onSeek?: (time: number) => void;
  buttonConfig?: { label: string; icon: React.ReactNode };
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
}) => {
  const playheadPosition = (currentTime / duration) * 100;
  const hasMainViewSegments =
    mainviewTimestamps && mainviewTimestamps.length > 0;

  return (
    <div className='mb-4'>
      <div className='mb-4 flex items-start justify-between'>
        <div>
          <h1 className='mb-2 text-lg font-medium text-gray-800'>
            Video Preprocessing
          </h1>
          <p className='text-xs text-gray-500'>
            Analyze the video to detect main view angles and prepare it for
            player segmentation.
          </p>
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
      <div className='mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3'>
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
    </div>
  );
};

export const SegmentationContent = () => (
  <div className='mb-4'>
    <h1 className='mb-2 text-lg font-medium text-gray-800'>
      Player Segmentation
    </h1>
    <p className='text-xs text-gray-500'>
      Segment players from the video for pose estimation.
    </p>
    <div className='mt-4 rounded-lg bg-gray-50 p-4'>
      <h2 className='mb-2 text-sm font-medium text-gray-700'>
        Segmentation Controls
      </h2>
      <div className='space-y-4'>
        <div>
          <label className='mb-1 block text-xs font-medium text-gray-700'>
            Detection Confidence
          </label>
          <input
            type='range'
            min='0'
            max='100'
            className='w-full'
            defaultValue='80'
          />
        </div>
        <div>
          <label className='mb-1 block text-xs font-medium text-gray-700'>
            Tracking Method
          </label>
          <select className='w-full rounded border p-1 text-xs'>
            <option>YOLO</option>
            <option>Faster R-CNN</option>
            <option>SSD</option>
          </select>
        </div>
      </div>
    </div>
  </div>
);

export const PoseContent = () => (
  <div className='mb-4'>
    <h1 className='mb-2 text-lg font-medium text-gray-800'>Pose Detection</h1>
    <p className='text-xs text-gray-500'>Detect player poses and movements.</p>
    <div className='mt-4 rounded-lg bg-gray-50 p-4'>
      <h2 className='mb-2 text-sm font-medium text-gray-700'>
        Pose Detection Settings
      </h2>
      <div className='space-y-4'>
        <div>
          <label className='mb-1 block text-xs font-medium text-gray-700'>
            Model Type
          </label>
          <select className='w-full rounded border p-1 text-xs'>
            <option>BlazePose</option>
            <option>MoveNet</option>
            <option>OpenPose</option>
          </select>
        </div>
        <div>
          <label className='mb-1 block text-xs font-medium text-gray-700'>
            Keypoint Confidence Threshold
          </label>
          <input
            type='range'
            min='0'
            max='100'
            className='w-full'
            defaultValue='70'
          />
        </div>
      </div>
    </div>
  </div>
);

export const GameStateContent = () => (
  <div className='mb-4'>
    <h1 className='mb-2 text-lg font-medium text-gray-800'>
      Game State Analysis
    </h1>
    <p className='text-xs text-gray-500'>
      Analyze game state, shots, and rallies.
    </p>
    <div className='mt-4 rounded-lg bg-gray-50 p-4'>
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
  </div>
);

export const ExportContent = () => (
  <div className='mb-4'>
    <h1 className='mb-2 text-lg font-medium text-gray-800'>Export Results</h1>
    <p className='text-xs text-gray-500'>
      Export processed video and analysis results.
    </p>
    <div className='mt-4 rounded-lg bg-gray-50 p-4'>
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
  </div>
);
