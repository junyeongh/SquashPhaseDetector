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
  overlay 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [showControls, setShowControls] = useState(true);
  
  // Convert time to frame number based on FPS
  const timeToFrame = (timeInSeconds: number) => Math.round(timeInSeconds * fps);
  
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
      const newTime = Math.max(0, Math.min(duration, currentTime + frameOffset * frameTime));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      if (onFrameChange) {
        onFrameChange(timeToFrame(newTime));
      }
    }
  };

  return (
    <div 
      className="relative w-full max-w-full bg-black rounded-lg overflow-hidden"
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video element */}
      <video 
        ref={videoRef}
        src={src}
        className="w-full h-auto"
        onClick={togglePlay}
      />
      
      {/* Overlay content (e.g., masks, pose skeletons) */}
      {overlay && (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {overlay}
        </div>
      )}
      
      {/* Controls overlay */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-3 transition-opacity ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress bar */}
        <div className="flex items-center mb-2">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        {/* Control buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Play/Pause button */}
            <button 
              onClick={togglePlay}
              className="p-1 hover:bg-gray-700 rounded"
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            
            {/* Frame by frame controls */}
            <button 
              onClick={() => seekByFrame(-1)}
              className="p-1 hover:bg-gray-700 rounded"
            >
              ⏮️
            </button>
            <button 
              onClick={() => seekByFrame(1)}
              className="p-1 hover:bg-gray-700 rounded"
            >
              ⏭️
            </button>
            
            {/* Time display */}
            <span className="text-sm font-medium">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            
            {/* Frame number display */}
            <span className="text-sm ml-2 font-medium bg-gray-800 px-2 py-1 rounded">
              Frame: {timeToFrame(currentTime)}
            </span>
          </div>
          
          {/* Volume control */}
          <div className="flex items-center space-x-1">
            <span className="text-sm">🔊</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
