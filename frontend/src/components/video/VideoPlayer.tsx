import { useRef, useState, useEffect } from 'react';

interface VideoPlayerProps {
  src: string;
  onFrameChange?: (frameNumber: number) => void;
  fps?: number;
  overlay?: React.ReactNode;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  onFrameChange,
  fps = 30,
  overlay,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [showControls, setShowControls] = useState(true);

  // Convert time to frame number based on FPS
  const timeToFrame = (timeInSeconds: number) =>
    Math.round(timeInSeconds * fps);

  // Function to show controls temporarily when moving mouse over video
  const showControlsTemporarily = () => {
    setShowControls(true);
    // Hide controls after 3 seconds of inactivity
    const timeout = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  };

  // Update current time and notify about frame changes
  useEffect(() => {
    if (videoRef.current) {
      const updateTime = () => {
        setCurrentTime(videoRef.current?.currentTime || 0);
        if (onFrameChange) {
          onFrameChange(timeToFrame(videoRef.current?.currentTime || 0));
        }
      };

      videoRef.current.addEventListener('timeupdate', updateTime);
      return () => {
        videoRef.current?.removeEventListener('timeupdate', updateTime);
      };
    }
  }, [videoRef, onFrameChange, fps]);

  // Update duration when metadata is loaded
  useEffect(() => {
    if (videoRef.current) {
      const updateDuration = () => {
        setDuration(videoRef.current?.duration || 0);
      };

      videoRef.current.addEventListener('loadedmetadata', updateDuration);
      return () => {
        videoRef.current?.removeEventListener('loadedmetadata', updateDuration);
      };
    }
  }, [videoRef]);

  // Play/pause function
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Format time for display (mm:ss)
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle seeking
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      if (onFrameChange) {
        onFrameChange(timeToFrame(newTime));
      }
    }
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  };

  // Seek by frame (forward or backward)
  const seekByFrame = (frameOffset: number) => {
    if (videoRef.current) {
      const frameTime = 1 / fps;
      const newTime = Math.max(
        0,
        Math.min(duration, currentTime + frameOffset * frameTime)
      );
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      if (onFrameChange) {
        onFrameChange(timeToFrame(newTime));
      }
    }
  };

  return (
    <div
      className='relative aspect-video max-h-[calc(100vh-200px)] w-full overflow-hidden rounded-lg bg-black'
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={src}
        className='h-full w-full object-contain'
        onClick={togglePlay}
      />

      {/* Overlay content (e.g., masks, pose skeletons) */}
      {overlay && (
        <div className='pointer-events-none absolute top-0 left-0 h-full w-full'>
          {overlay}
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={`bg-opacity-70 absolute right-0 bottom-0 left-0 bg-black p-3 text-white transition-opacity ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress bar */}
        <div className='mb-2 flex items-center'>
          <input
            type='range'
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className='h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-600'
          />
        </div>

        {/* Control buttons */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            {/* Play/Pause button */}
            <button
              onClick={togglePlay}
              className='rounded p-1.5 hover:bg-gray-700'
            >
              {isPlaying ? (
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

            {/* Frame by frame controls */}
            <button
              onClick={() => seekByFrame(-1)}
              className='rounded p-1.5 hover:bg-gray-700'
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
            <button
              onClick={() => seekByFrame(1)}
              className='rounded p-1.5 hover:bg-gray-700'
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

            {/* Time display */}
            <span className='text-sm'>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Frame number display */}
            <span className='ml-2 text-sm'>
              Frame: {timeToFrame(currentTime)}
            </span>
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
    </div>
  );
};

export default VideoPlayer;
