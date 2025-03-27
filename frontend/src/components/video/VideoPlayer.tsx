import React, { useState, useRef, useCallback } from 'react';
import ReactPlayer from 'react-player';
import MainviewTimeline from './MainviewTimeline';
import { MainviewTimestamp } from '@/services/api/video';

interface ReactPlayerWrapperProps {
  src: string;
  onFrameChange?: (frameNumber: number) => void;
  fps?: number;
  overlay?: React.ReactNode;
  mainviewTimestamps?: MainviewTimestamp[];
}

const ReactPlayerWrapper: React.FC<ReactPlayerWrapperProps> = ({
  src,
  onFrameChange,
  fps = 30,
  overlay,
  mainviewTimestamps = [],
}) => {
  const playerRef = useRef<ReactPlayer>(null);

  const [state, setState] = useState({
    playing: false,
    played: 0,
    loaded: 0,
    seeking: false,
    duration: 0,
    volume: 0.5,
    playbackRate: 1.0,
  });

  // Extract state variables for convenience
  const { playing, played, loaded, duration, volume, playbackRate } = state;

  // Calculate current frame based on played percentage and duration
  const currentFrame = Math.round(played * duration * fps);

  // Format time for display (mm:ss)
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Callbacks for ReactPlayer
  const handleDuration = (duration: number) => {
    setState((prev) => ({ ...prev, duration }));
  };

  const handleProgress = (progress: { played: number; loaded: number }) => {
    if (!state.seeking) {
      setState((prev) => ({ ...prev, ...progress }));
      if (onFrameChange) {
        onFrameChange(currentFrame);
      }
    }
  };

  // Seeking handlers
  const handleSeekMouseDown = () => {
    setState((prev) => ({ ...prev, seeking: true }));
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState((prev) => ({ ...prev, played: parseFloat(e.target.value) }));
  };

  const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    setState((prev) => ({ ...prev, seeking: false }));
    const value = (e.target as HTMLInputElement).value;
    playerRef.current?.seekTo(parseFloat(value));
  };

  // Frame navigation
  const seekByFrame = (frameOffset: number) => {
    const frameTime = 1 / fps;
    const newTime = Math.max(
      0,
      Math.min(duration, (currentFrame + frameOffset) * frameTime)
    );

    // Calculate new played value
    const newPlayed = newTime / duration;

    // Update state and seek to new position
    setState((prev) => ({ ...prev, played: newPlayed, playing: false }));
    playerRef.current?.seekTo(newPlayed);
  };

  // Seek by time (seconds)
  const seekByTime = (secondsOffset: number) => {
    const newTime = Math.max(
      0,
      Math.min(duration, played * duration + secondsOffset)
    );

    // Calculate new played value
    const newPlayed = newTime / duration;

    // Update state and seek to new position
    setState((prev) => ({ ...prev, played: newPlayed }));
    playerRef.current?.seekTo(newPlayed);
  };

  // Toggle play/pause
  const togglePlay = () => {
    setState((prev) => ({ ...prev, playing: !prev.playing }));
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setState((prev) => ({ ...prev, volume: newVolume }));
  };

  // Handle playback rate change
  const handleSetPlaybackRate = (rate: number) => {
    setState((prev) => ({ ...prev, playbackRate: rate }));
  };

  return (
    <div className='flex w-full flex-col'>
      {/* Video container */}
      <div className='relative aspect-video max-h-[calc(100vh-250px)] w-full overflow-hidden rounded-t bg-gray-900'>
        {/* Debug info */}
        {/* <div className="absolute top-0 left-0 bg-black bg-opacity-50 text-white p-2 z-10 text-xs">
          Video URL: {src}
        </div> */}

        {/* ReactPlayer */}
        <ReactPlayer
          ref={playerRef}
          url={src}
          width='100%'
          height='100%'
          playing={playing}
          volume={volume}
          playbackRate={playbackRate}
          onDuration={handleDuration}
          onProgress={handleProgress}
          onPlay={() => setState((prev) => ({ ...prev, playing: true }))}
          onPause={() => setState((prev) => ({ ...prev, playing: false }))}
          progressInterval={100} // Update progress more frequently
          className='h-full w-full object-contain'
        />

        {/* Overlay content */}
        {overlay && (
          <div className='pointer-events-none absolute top-0 left-0 h-full w-full'>
            {overlay}
          </div>
        )}
      </div>

      {/* Controls section */}
      <div className='rounded-b bg-gray-800 p-3 text-gray-300'>
        {/* Control buttons */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            {/* 5 seconds backward */}
            <button
              onClick={() => seekByTime(-5)}
              className='rounded p-1.5'
              title='Back 5 seconds'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='20'
                height='20'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <path d='m12 19-7-7 7-7'></path>
                <path d='M19 12H5'></path>
                <text x='7' y='16' fontSize='8' fill='currentColor'>
                  5s
                </text>
              </svg>
            </button>

            {/* Frame backward */}
            <button
              onClick={() => seekByFrame(-1)}
              className='rounded p-1.5'
              title='Previous frame'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='20'
                height='20'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <path d='m12 19-7-7 7-7'></path>
                <path d='M19 12H5'></path>
              </svg>
            </button>

            {/* Play/Pause button */}
            <button onClick={togglePlay} className='rounded p-1.5'>
              {playing ? (
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='24'
                  height='24'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <rect x='6' y='4' width='4' height='16'></rect>
                  <rect x='14' y='4' width='4' height='16'></rect>
                </svg>
              ) : (
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='24'
                  height='24'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <polygon points='5 3 19 12 5 21 5 3'></polygon>
                </svg>
              )}
            </button>

            {/* Frame forward */}
            <button
              onClick={() => seekByFrame(1)}
              className='rounded p-1.5'
              title='Next frame'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='20'
                height='20'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <path d='m12 5 7 7-7 7'></path>
                <path d='M5 12h14'></path>
              </svg>
            </button>

            {/* 5 seconds forward */}
            <button
              onClick={() => seekByTime(5)}
              className='rounded p-1.5'
              title='Forward 5 seconds'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='20'
                height='20'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <path d='m12 5 7 7-7 7'></path>
                <path d='M5 12h14'></path>
                <text x='7' y='16' fontSize='8' fill='currentColor'>
                  5s
                </text>
              </svg>
            </button>

            {/* Time display */}
            <span className='text-sm'>
              {formatTime(played * duration)} / {formatTime(duration)}
            </span>

            {/* Frame number display */}
            <span className='ml-2 text-sm'>Frame: {currentFrame}</span>
          </div>

          <div className='flex items-center space-x-3'>
            {/* Playback Rate */}
            <div className='flex items-center space-x-1'>
              <span className='text-xs'>Speed:</span>
              <button
                onClick={() => handleSetPlaybackRate(1.0)}
                className={`rounded px-1 py-0.5 text-xs ${playbackRate === 1.0 ? 'bg-blue-500' : 'bg-gray-600'}`}
              >
                1x
              </button>
              <button
                onClick={() => handleSetPlaybackRate(1.5)}
                className={`rounded px-1 py-0.5 text-xs ${playbackRate === 1.5 ? 'bg-blue-500' : 'bg-gray-600'}`}
              >
                1.5x
              </button>
              <button
                onClick={() => handleSetPlaybackRate(2.0)}
                className={`rounded px-1 py-0.5 text-xs ${playbackRate === 2.0 ? 'bg-blue-500' : 'bg-gray-600'}`}
              >
                2x
              </button>
            </div>

            {/* Volume control */}
            <div className='flex items-center space-x-1'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='18'
                height='18'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <polygon points='11 5 6 9 2 9 2 15 6 15 11 19 11 5'></polygon>
                <path d='M15.54 8.46a5 5 0 0 1 0 7.07'></path>
                <path d='M19.07 4.93a10 10 0 0 1 0 14.14'></path>
              </svg>
              <span className='w-8 text-xs'>{Math.round(volume * 100)}%</span>
              <input
                type='range'
                min={0}
                max={1}
                step={0.1}
                value={volume}
                onChange={handleVolumeChange}
                className='h-1.5 w-20 cursor-pointer appearance-none rounded-lg bg-gray-600'
              />
            </div>
          </div>
        </div>
        {/* Progress bar with played and loaded indicators */}
        <div className='mb-2 flex items-center'>
          <div className='relative h-2 w-full'>
            {/* Background */}
            <div className='absolute h-2 w-full rounded bg-gray-600'></div>

            {/* Loaded progress */}
            <div
              className='absolute h-2 rounded bg-gray-400'
              style={{ width: `${loaded * 100}%` }}
            />

            {/* Played progress */}
            <div
              className='absolute h-2 rounded bg-blue-500'
              style={{ width: `${played * 100}%` }}
            />

            {/* Seek control */}
            <input
              type='range'
              min={0}
              max={0.999999}
              step='any'
              value={played}
              onMouseDown={handleSeekMouseDown}
              onChange={handleSeekChange}
              onMouseUp={handleSeekMouseUp}
              className='absolute h-2 w-full cursor-pointer opacity-0'
            />
          </div>
        </div>

        {/* Mainview timeline */}
        {mainviewTimestamps.length > 0 && (
          <div className='mb-2'>
            <MainviewTimeline
              timestamps={mainviewTimestamps}
              currentTime={played * duration}
              duration={duration}
              onSeek={(time) => {
                const newPlayed = time / duration;
                setState((prev) => ({ ...prev, played: newPlayed }));
                playerRef.current?.seekTo(newPlayed);
              }}
            />
          </div>
        )}
        {/* Progress display */}
        <div className='mt-2 flex items-center space-x-4 text-xs'>
          <div className='flex items-center'>
            <span className='mr-2'>Played:</span>
            <div className='h-2 w-24 rounded bg-gray-600'>
              <div
                className='h-full rounded bg-blue-500'
                style={{ width: `${played * 100}%` }}
              />
            </div>
            <span className='ml-1'>{(played * 100).toFixed(1)}%</span>
          </div>
          <div className='flex items-center'>
            <span className='mr-2'>Loaded:</span>
            <div className='h-2 w-24 rounded bg-gray-600'>
              <div
                className='h-full rounded bg-gray-400'
                style={{ width: `${loaded * 100}%` }}
              />
            </div>
            <span className='ml-1'>{(loaded * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReactPlayerWrapper;
