import React from 'react';
import { Play, Loader } from 'lucide-react';
import MainviewTimeline from '../video/MainviewTimeline';
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
}) => (
  <div className='mb-4'>
    <div className='mb-4 flex items-start justify-between'>
      <div>
        <h1 className='mb-2 text-lg font-medium text-gray-800'>
          Video Preprocessing
        </h1>
        <p className='text-xs text-gray-500'>
          Analyze the video to detect main view angles and prepare it for player
          segmentation.
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

    {isProcessing && (
      <div className='mb-2 flex items-center space-x-2 text-xs text-gray-500'>
        <Loader className='h-3 w-3 animate-spin text-gray-500' />
        <span>{processingStatus}</span>
      </div>
    )}

    {/* MainviewTimeline for preprocessing stage */}
    {mainviewTimestamps && mainviewTimestamps.length > 0 && (
      <div className='mt-2 rounded-lg border border-gray-200 bg-gray-50 p-2'>
        <div className='mb-1 flex items-center justify-between'>
          <div className='text-xs font-medium text-gray-500'>
            Main View Segments
          </div>
          <div className='text-xs text-gray-500'>
            <span className='font-medium'>{mainviewTimestamps.length}</span>{' '}
            segments detected
          </div>
        </div>
        <MainviewTimeline
          timestamps={mainviewTimestamps}
          duration={duration}
          currentTime={currentTime}
          onSeek={onSeek}
        />
      </div>
    )}
  </div>
);

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
