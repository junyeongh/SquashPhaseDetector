import React, { useState, useRef, useEffect, forwardRef } from 'react';
import ReactPlayer from 'react-player';
import { MainviewResponse } from '@/services/api/video';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, RotateCcw, RotateCw, Check } from 'lucide-react';
import SegmentationMarkerOverlay from '@/components/overlays/SegmentationMarkerOverlay';

interface ReactPlayerWrapperProps {
  src: string;
  onFrameChange?: (frameNumber: number) => void;
  mainviewResponse?: MainviewResponse;
  onPlayerUpdates?: (currentTime: number, duration: number, playing: boolean) => void;
  onSeek?: (frame: number) => void;
  currentStage: string;
}

const VideoPlayer = forwardRef<ReactPlayer, ReactPlayerWrapperProps>(
  ({ src, onFrameChange, onPlayerUpdates, mainviewResponse, onSeek, currentStage }, ref) => {
    const playerRef = useRef<ReactPlayer>(null);
    const progressBarRef = useRef<HTMLDivElement>(null);

    // Get fps from mainviewResponse or use a default value if not available
    const fps = mainviewResponse?.fps || 30;

    // Expose inner ref to parent
    useEffect(() => {
      if (ref) {
        // Forward the ReactPlayer ref to the parent through the forwardedRef
        if (typeof ref === 'function') {
          ref(playerRef.current);
        } else {
          ref.current = playerRef.current;
        }
      }
    }, [ref]);

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
      const newTime = Math.max(0, Math.min(duration, (currentFrame + frameOffset) * frameTime));

      // Calculate new played value
      const newPlayed = newTime / duration;

      // Update state and seek to new position
      setState((prev) => ({ ...prev, played: newPlayed, playing: false }));
      playerRef.current?.seekTo(newPlayed);
    };

    // Seek by time (seconds)
    const seekByTime = (secondsOffset: number) => {
      const newTime = Math.max(0, Math.min(duration, played * duration + secondsOffset));

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

    // Update time-related info
    useEffect(() => {
      if (onPlayerUpdates) {
        onPlayerUpdates(played * duration, duration, playing);
      }
    }, [played, duration, onPlayerUpdates, playing]);

    return (
      <div className='flex w-full flex-col'>
        {/* Video container */}
        <div className='relative aspect-video max-h-[calc(100vh-350px)] w-full overflow-hidden bg-white'>
          {/* ReactPlayer */}
          <div className='absolute inset-0 flex items-center justify-center'>
            <ReactPlayer
              ref={playerRef}
              url={src}
              width='auto'
              height='100%'
              playing={playing}
              volume={volume}
              muted={muted}
              controls={false}
              playbackRate={playbackRate}
              onDuration={handleDuration}
              onProgress={handleProgress}
              onPlay={() => setState((prev) => ({ ...prev, playing: true }))}
              onPause={() => setState((prev) => ({ ...prev, playing: false }))}
              progressInterval={100}
              className='object-contain'
            />
          </div>

          {/* Overlay content */}
          {currentStage === 'segmentation' && (
            <SegmentationMarkerOverlay
              width={playerRef.current?.getInternalPlayer()?.parentElement?.clientWidth || 0}
              height={playerRef.current?.getInternalPlayer()?.parentElement?.clientHeight || 0}
              isPlaying={playing}
              isInMainView={true}
            />
          )}

          {/* Play/Pause overlay button */}
          {currentStage === 'segmentation' ||
            (currentStage === 'pose' && (
              <div
                className='absolute inset-0 z-10 flex items-center justify-center'
                onClick={(e) => {
                  // Only toggle play if the click is directly on this div (not on overlay elements)
                  if (e.currentTarget === e.target) {
                    togglePlay();
                  }
                }}
              >
                {!playing && (
                  <div className='bg-opacity-60 hover:bg-opacity-70 flex h-20 w-20 items-center justify-center rounded-full bg-black text-white transition-all'>
                    <Play size={36} fill='white' />
                  </div>
                )}
              </div>
            ))}
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

              {/* Play/Pause button */}
              <button
                onClick={togglePlay}
                className='rounded border border-gray-200 bg-white p-2 transition-colors hover:bg-gray-50'
                title={playing ? 'Pause' : 'Play'}
              >
                {playing ? <Pause size={18} /> : <Play size={18} />}
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
              {/* Current frame indicator */}
              <div className='mr-4 flex items-center space-x-2'>
                <span className='text-xs text-gray-500'>Frame:</span>
                <span className='rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700'>
                  {currentFrame}
                </span>
              </div>

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

        {/* MainviewTimeline component */}
        <div className='mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3'>
          <div className='mb-3 flex items-center justify-between'>
            <div className='text-sm font-medium text-gray-700'>Main View Segments</div>
            <div className='text-xs text-gray-500'>
              {mainviewResponse && mainviewResponse.timestamps && mainviewResponse.timestamps.length > 0 ? (
                <span className='flex items-center gap-1'>
                  <Check className='h-3 w-3 text-green-500' />
                  <span>
                    <span className='font-medium'>{mainviewResponse.timestamps.length}</span> segments and{' '}
                    <span className='font-medium'>{mainviewResponse.chunks.length}</span> chunks detected
                  </span>
                </span>
              ) : (
                <span>No segments detected yet</span>
              )}
            </div>
          </div>

          <div className='relative h-8 w-full overflow-hidden rounded bg-gray-200'>
            {/* Calculate total frames based on duration and fps */}
            {(() => {
              // Estimate total frames based on duration and fps or use the last frame if available
              const totalFrames =
                mainviewResponse && mainviewResponse.timestamps && mainviewResponse.timestamps.length > 0
                  ? Math.max(...mainviewResponse.timestamps.map((t) => t[3]))
                  : Math.round(duration * fps);

              return (
                <>
                  {/* Timeline segments */}
                  {mainviewResponse && mainviewResponse.timestamps && mainviewResponse.timestamps.length > 0
                    ? mainviewResponse.timestamps.map((segment, index) => {
                        // Calculate position based on frames instead of time
                        const startPercent = (segment[2] / totalFrames) * 100;
                        const widthPercent = ((segment[3] - segment[2]) / totalFrames) * 100;

                        return (
                          <div
                            key={index}
                            className='absolute h-full cursor-pointer bg-blue-300 transition-colors hover:bg-blue-400'
                            style={{
                              left: `${startPercent}%`,
                              width: `${widthPercent}%`,
                            }}
                            onClick={() => {
                              console.log(`Clicked on segment ${index}, start_frame: ${segment[2]}`);
                              if (onSeek) onSeek(segment[2]);
                            }}
                            onDoubleClick={() => {
                              console.log(`Double-clicked on segment ${index}, end_frame: ${segment[3]}`);
                              if (onSeek) onSeek(segment[3]);
                            }}
                            title={`Segment ${index + 1}: ${segment[0].toFixed(2)}s - ${segment[1].toFixed(2)}s (${segment[2]}-${segment[3]})`}
                          />
                        );
                      })
                    : null}

                  {/* Chunks visualization */}
                  {mainviewResponse && mainviewResponse.chunks && mainviewResponse.chunks.length > 0
                    ? mainviewResponse.chunks.map((chunk, chunkIndex) => {
                        // chunk is an array of [start_frame, end_frame] pairs
                        if (!Array.isArray(chunk) || chunk.length === 0) return null;

                        // Get first frame of the first pair and last frame of the last pair in this chunk
                        const firstPair = chunk[0];
                        const lastPair = chunk[chunk.length - 1];

                        if (
                          !Array.isArray(firstPair) ||
                          firstPair.length < 2 ||
                          !Array.isArray(lastPair) ||
                          lastPair.length < 2
                        )
                          return null;

                        const startFrame = firstPair[0];
                        const endFrame = lastPair[1];

                        // Calculate position percentages based on frames
                        const startPercent = (startFrame / totalFrames) * 100;
                        const widthPercent = ((endFrame - startFrame) / totalFrames) * 100;

                        // Only render if we have valid data
                        if (widthPercent <= 0 || startPercent < 0) return null;

                        return (
                          <div
                            key={`chunk-${chunkIndex}`}
                            className='absolute bottom-0 h-4 rounded-full border border-blue-500 bg-blue-200 transition-colors hover:bg-blue-300'
                            style={{
                              left: `${startPercent}%`,
                              width: `${widthPercent}%`,
                            }}
                            onClick={() => {
                              console.log(`Clicked on chunk ${chunkIndex}, startFrame: ${startFrame}`);
                              if (onSeek) onSeek(startFrame);
                            }}
                            onDoubleClick={() => {
                              console.log(`Double-clicked on chunk ${chunkIndex}, endFrame: ${endFrame}`);
                              if (onSeek) onSeek(endFrame);
                            }}
                            title={`Chunk ${chunkIndex + 1}: ${startFrame}-${endFrame}`}
                          >
                            <span className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[0.6rem] font-bold text-black'>
                              {chunkIndex + 1}
                            </span>
                          </div>
                        );
                      })
                    : null}

                  {/* Playhead - calculate position based on current frame rather than played percentage */}
                  {duration > 0 && (
                    <div
                      className='absolute top-0 h-full w-1 bg-gray-600'
                      style={{ left: `${(currentFrame / totalFrames) * 100}%` }}
                    />
                  )}
                </>
              );
            })()}
          </div>

          <div className='mt-2 text-xs text-gray-500'>
            {mainviewResponse && mainviewResponse.timestamps && mainviewResponse.timestamps.length > 0
              ? 'Click on a segment to jump to that position in the video'
              : 'Process the video to detect main view segments'}
          </div>
        </div>
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
