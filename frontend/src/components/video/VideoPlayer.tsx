import React, { useState, useRef, useEffect } from 'react';
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
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isSeeking, setIsSeeking] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimer, setControlsTimer] = useState<NodeJS.Timeout | null>(null);

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
  const { playing, played, loaded, duration, volume, playbackRate, muted } = state;

  // Calculate current frame based on played percentage and duration
  const currentFrame = Math.round(played * duration * fps);

  // Format time for display (mm:ss)
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle mouse movement to show/hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);

      // Clear any existing timer
      if (controlsTimer) {
        clearTimeout(controlsTimer);
      }

      // Set a new timer to hide controls after 3 seconds of inactivity
      if (playing && !isSeeking) {
        const timer = setTimeout(() => {
          setShowControls(false);
        }, 3000);
        setControlsTimer(timer);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimer) {
        clearTimeout(controlsTimer);
      }
    };
  }, [playing, isSeeking, controlsTimer]);

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
    setIsSeeking(true);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState((prev) => ({ ...prev, played: parseFloat(e.target.value) }));
  };

  const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    setState((prev) => ({ ...prev, seeking: false }));
    setIsSeeking(false);
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
    setState((prev) => ({ ...prev, volume: newVolume, muted: newVolume === 0 }));
  };

  // Handle playback rate change
  const handleSetPlaybackRate = (rate: number) => {
    setState((prev) => ({ ...prev, playbackRate: rate }));
  };

  // Handle click on progress bar
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const percentage = offsetX / rect.width;

    // Update state and seek to new position
    setState((prev) => ({ ...prev, played: percentage }));
    playerRef.current?.seekTo(percentage);
  };

  return (
    <div className='flex w-full flex-col'>
      {/* Video container */}
      <div
        className='relative aspect-video max-h-[calc(100vh-250px)] w-full overflow-hidden rounded-lg bg-black'
        onMouseEnter={() => setShowControls(true)}
      >
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
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
            showControls || !playing ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={togglePlay}
        >
          {!playing && (
            <div className='flex h-20 w-20 items-center justify-center rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all'>
              <Play size={36} fill="white" />
            </div>
          )}
        </div>

        {/* Video controls overlay */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Progress bar with buffer indicator */}
          <div
            className='relative mb-2 h-2 w-full cursor-pointer rounded-full bg-gray-700'
            ref={timelineRef}
            onClick={handleProgressBarClick}
          >
            {/* Buffer indicator */}
            <div
              className='absolute top-0 left-0 h-full rounded-full bg-gray-500'
              style={{ width: `${loaded * 100}%` }}
            ></div>

            {/* Progress indicator */}
            <div
              className='absolute top-0 left-0 h-full rounded-full bg-blue-500'
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
              className='absolute top-0 left-0 h-full w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white'
            />

            {/* Mainview timeline indicators */}
            {mainviewTimestamps && mainviewTimestamps.length > 0 && (
              <MainviewTimeline
                timestamps={mainviewTimestamps}
                duration={duration}
                currentTime={played * duration}
                onSeek={(time) => playerRef.current?.seekTo(time / duration)}
              />
            )}
          </div>

          {/* Controls section */}
          <div className='flex items-center justify-between text-white'>
            <div className='flex items-center space-x-3'>
              {/* Play/Pause button */}
              <button
                onClick={togglePlay}
                className='rounded p-1.5 hover:bg-gray-700/50 transition-colors'
                title={playing ? 'Pause' : 'Play'}
              >
                {playing ? <Pause size={20} /> : <Play size={20} />}
              </button>

              {/* 5 seconds backward */}
              <button
                onClick={() => seekByTime(-5)}
                className='rounded p-1.5 hover:bg-gray-700/50 transition-colors'
                title='Back 5 seconds'
              >
                <RotateCcw size={16} />
              </button>

              {/* Frame backward */}
              <button
                onClick={() => seekByFrame(-1)}
                className='rounded p-1.5 hover:bg-gray-700/50 transition-colors'
                title='Previous frame'
              >
                <SkipBack size={18} />
              </button>

              {/* Frame counter */}
              <div className='rounded bg-gray-800 px-2 py-1 text-xs font-medium'>
                Frame: {currentFrame}
              </div>

              {/* Frame forward */}
              <button
                onClick={() => seekByFrame(1)}
                className='rounded p-1.5 hover:bg-gray-700/50 transition-colors'
                title='Next frame'
              >
                <SkipForward size={18} />
              </button>

              {/* 5 seconds forward */}
              <button
                onClick={() => seekByTime(5)}
                className='rounded p-1.5 hover:bg-gray-700/50 transition-colors'
                title='Forward 5 seconds'
              >
                <RotateCw size={16} />
              </button>
            </div>

            <div className='flex items-center'>
              {/* Time indicator */}
              <div className='mr-3 text-sm'>
                <span>{formatTime(played * duration)}</span>
                <span className='mx-1'>/</span>
                <span>{formatTime(duration)}</span>
              </div>

              {/* Volume control */}
              <div className='flex items-center space-x-1'>
                <button
                  onClick={toggleMute}
                  className='rounded p-1.5 hover:bg-gray-700/50 transition-colors'
                  title={muted ? 'Unmute' : 'Mute'}
                >
                  {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <div className='relative h-1 w-16 rounded-full bg-gray-700'>
                  <div
                    className='absolute top-0 left-0 h-full rounded-full bg-blue-500'
                    style={{ width: `${muted ? 0 : volume * 100}%` }}
                  ></div>
                  <input
                    type='range'
                    min={0}
                    max={1}
                    step='any'
                    value={volume}
                    onChange={handleVolumeChange}
                    className='absolute top-0 left-0 h-full w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white'
                  />
                </div>
              </div>

              {/* Playback rate */}
              <div className='ml-3 flex items-center space-x-1'>
                <button
                  onClick={() => handleSetPlaybackRate(1.0)}
                  className={`rounded px-1.5 py-0.5 text-xs ${
                    playbackRate === 1.0 ? 'bg-blue-500' : 'hover:bg-gray-700/50'
                  } transition-colors`}
                  title='Normal speed'
                >
                  1x
                </button>
                <button
                  onClick={() => handleSetPlaybackRate(0.5)}
                  className={`rounded px-1.5 py-0.5 text-xs ${
                    playbackRate === 0.5 ? 'bg-blue-500' : 'hover:bg-gray-700/50'
                  } transition-colors`}
                  title='Half speed'
                >
                  0.5x
                </button>
                <button
                  onClick={() => handleSetPlaybackRate(0.25)}
                  className={`rounded px-1.5 py-0.5 text-xs ${
                    playbackRate === 0.25 ? 'bg-blue-500' : 'hover:bg-gray-700/50'
                  } transition-colors`}
                  title='Quarter speed'
                >
                  0.25x
                </button>
                <button
                  onClick={() => handleSetPlaybackRate(2.0)}
                  className={`rounded px-1.5 py-0.5 text-xs ${
                    playbackRate === 2.0 ? 'bg-blue-500' : 'hover:bg-gray-700/50'
                  } transition-colors`}
                  title='Double speed'
                >
                  2x
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReactPlayerWrapper;
