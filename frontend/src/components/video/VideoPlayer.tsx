import React, { useState, useRef } from 'react';
import ReactPlayer from 'react-player';
import MainviewTimeline from './MainviewTimeline';
import { MainviewTimestamp } from '@/services/api/video';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  RotateCcw,
  RotateCw,
} from 'lucide-react';

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
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState({
    playing: false,
    played: 0,
    loaded: 0,
    seeking: false,
    duration: 0,
    volume: 0.5,
    playbackRate: 1.0,
    muted: false,
  });

  // Extract state variables for convenience
  const { playing, played, loaded, duration, volume, playbackRate, muted } =
    state;

  // Calculate current frame based on played percentage and duration
  const currentFrame = Math.round(played * duration * fps);

  // Format time for display (mm:ss)
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
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

  // Toggle mute
  const toggleMute = () => {
    setState((prev) => ({ ...prev, muted: !prev.muted }));
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setState((prev) => ({
      ...prev,
      volume: newVolume,
      muted: newVolume === 0,
    }));
  };

  // Handle playback rate change
  const handleSetPlaybackRate = (rate: number) => {
    setState((prev) => ({ ...prev, playbackRate: rate }));
  };

  // Handle click on progress bar
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const percentage = offsetX / rect.width;

    // Update state and seek to new position
    setState((prev) => ({ ...prev, played: percentage }));
    playerRef.current?.seekTo(percentage);
  };

  return (
    <div className='flex w-full flex-col'>
      {/* Video container */}
      <div className='relative aspect-video max-h-[calc(100vh-350px)] w-full overflow-hidden bg-black'>
        {/* ReactPlayer */}
        <ReactPlayer
          ref={playerRef}
          url={src}
          width='100%'
          height='100%'
          playing={playing}
          volume={volume}
          muted={muted}
          playbackRate={playbackRate}
          onDuration={handleDuration}
          onProgress={handleProgress}
          onPlay={() => setState((prev) => ({ ...prev, playing: true }))}
          onPause={() => setState((prev) => ({ ...prev, playing: false }))}
          progressInterval={100} // Update progress more frequently
          className='absolute top-0 left-0 h-full w-full object-contain'
        />

        {/* Overlay content */}
        {overlay && (
          <div className='pointer-events-none absolute top-0 left-0 h-full w-full'>
            {overlay}
          </div>
        )}

        {/* Play/Pause overlay button */}
        <div
          className='absolute inset-0 flex items-center justify-center'
          onClick={togglePlay}
        >
          {!playing && (
            <div className='bg-opacity-60 hover:bg-opacity-70 flex h-20 w-20 items-center justify-center rounded-full bg-black text-white transition-all'>
              <Play size={36} fill='white' />
            </div>
          )}
        </div>
      </div>

      {/* Progress bar section */}
      <div className='bg-gray-100 px-3 pt-2'>
        <div
          className='relative h-2 w-full cursor-pointer rounded-full bg-gray-200'
          ref={progressBarRef}
          onClick={handleProgressBarClick}
        >
          {/* Buffer indicator */}
          <div
            className='absolute top-0 left-0 h-full rounded-full bg-gray-300'
            style={{ width: `${loaded * 100}%` }}
          ></div>

          {/* Progress indicator */}
          <div
            className='absolute top-0 left-0 h-full rounded-full bg-gray-500'
            style={{ width: `${played * 100}%` }}
          ></div>

          {/* Seek input */}
          <input
            type='range'
            min={0}
            max={0.999999}
            step='any'
            value={played}
            onMouseDown={handleSeekMouseDown}
            onChange={handleSeekChange}
            onMouseUp={handleSeekMouseUp}
            className='absolute top-0 left-0 h-full w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gray-700'
          />
        </div>
      </div>

      {/* Controls section */}
      <div className='bg-gray-100 px-3 pt-1 pb-2'>
        <div className='flex items-center justify-between text-gray-800'>
          <div className='flex items-center space-x-2'>
            {/* Play/Pause button */}
            <button
              onClick={togglePlay}
              className='rounded border border-gray-200 bg-white p-2 transition-colors hover:bg-gray-50'
              title={playing ? 'Pause' : 'Play'}
            >
              {playing ? <Pause size={18} /> : <Play size={18} />}
            </button>

            {/* 5 seconds backward */}
            <button
              onClick={() => seekByTime(-5)}
              className='rounded border border-gray-200 bg-white p-2 transition-colors hover:bg-gray-50'
              title='Back 5 seconds'
            >
              <RotateCcw size={16} />
            </button>

            {/* Frame backward */}
            <button
              onClick={() => seekByFrame(-1)}
              className='rounded border border-gray-200 bg-white p-2 transition-colors hover:bg-gray-50'
              title='Previous frame'
            >
              <SkipBack size={16} />
            </button>

            {/* Frame forward */}
            <button
              onClick={() => seekByFrame(1)}
              className='rounded border border-gray-200 bg-white p-2 transition-colors hover:bg-gray-50'
              title='Next frame'
            >
              <SkipForward size={16} />
            </button>

            {/* 5 seconds forward */}
            <button
              onClick={() => seekByTime(5)}
              className='rounded border border-gray-200 bg-white p-2 transition-colors hover:bg-gray-50'
              title='Forward 5 seconds'
            >
              <RotateCw size={16} />
            </button>
          </div>

          <div className='flex items-center'>
            {/* Time indicator */}
            <div className='mr-4 text-xs font-medium text-gray-600'>
              <span>{formatTime(played * duration)}</span>
              <span className='mx-1'>/</span>
              <span>{formatTime(duration)}</span>
            </div>

            {/* Volume control */}
            <div className='mx-4 flex items-center space-x-2'>
              <button
                onClick={toggleMute}
                className='rounded border border-gray-200 bg-white p-1 transition-colors hover:bg-gray-50'
                title={muted ? 'Unmute' : 'Mute'}
              >
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <div className='relative h-1.5 w-16 rounded-full bg-gray-200'>
                <div
                  className='absolute top-0 left-0 h-full rounded-full bg-gray-500'
                  style={{ width: `${muted ? 0 : volume * 100}%` }}
                ></div>
                <input
                  type='range'
                  min={0}
                  max={1}
                  step='any'
                  value={volume}
                  onChange={handleVolumeChange}
                  className='absolute top-0 left-0 h-full w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gray-700'
                />
              </div>
            </div>

            {/* Playback rate */}
            <div className='flex items-center space-x-1'>
              <button
                onClick={() => handleSetPlaybackRate(0.25)}
                className={`rounded border px-2 py-1 text-xs ${
                  playbackRate === 0.25
                    ? 'border-gray-300 bg-gray-200 text-gray-800'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                } transition-colors`}
                title='Quarter speed'
              >
                0.25x
              </button>
              <button
                onClick={() => handleSetPlaybackRate(0.5)}
                className={`rounded border px-2 py-1 text-xs ${
                  playbackRate === 0.5
                    ? 'border-gray-300 bg-gray-200 text-gray-800'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                } transition-colors`}
                title='Half speed'
              >
                0.5x
              </button>
              <button
                onClick={() => handleSetPlaybackRate(1.0)}
                className={`rounded border px-2 py-1 text-xs ${
                  playbackRate === 1.0
                    ? 'border-gray-300 bg-gray-200 text-gray-800'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                } transition-colors`}
                title='Normal speed'
              >
                1x
              </button>
              <button
                onClick={() => handleSetPlaybackRate(2.0)}
                className={`rounded border px-2 py-1 text-xs ${
                  playbackRate === 2.0
                    ? 'border-gray-300 bg-gray-200 text-gray-800'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                } transition-colors`}
                title='Double speed'
              >
                2x
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mainview timeline section - completely separate */}
      {mainviewTimestamps && mainviewTimestamps.length > 0 && (
        <div className='mt-2 rounded-lg border border-gray-200 bg-gray-50 p-2'>
          <div className='mb-1 text-xs font-medium text-gray-500'>
            Main View Segments
          </div>
          <MainviewTimeline
            timestamps={mainviewTimestamps}
            duration={duration}
            currentTime={played * duration}
            onSeek={(time) => playerRef.current?.seekTo(time / duration)}
          />
        </div>
      )}
    </div>
  );
};

export default ReactPlayerWrapper;
