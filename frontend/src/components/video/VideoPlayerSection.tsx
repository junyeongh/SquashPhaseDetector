import { useState, useEffect, useRef } from 'react';
import ReactPlayerWrapper from './VideoPlayer';
import { getMainviewTimestamps, MainviewTimestamp } from '@/services/api/video';
import ReactPlayer from 'react-player';

interface VideoPlayerSectionProps {
  videoUrl: string;
  stage: string;
  videoId: string;
  customOverlay?: React.ReactNode;
  // These props will be passed to the PreprocessContent
  onFrameUpdate?: (
    frame: number,
    duration: number,
    currentTime: number
  ) => void;
}

const VideoPlayerSection: React.FC<VideoPlayerSectionProps> = ({
  videoUrl,
  stage,
  videoId,
  customOverlay,
  onFrameUpdate,
}) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [mainviewTimestamps, setMainviewTimestamps] = useState<
    MainviewTimestamp[]
  >([]);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const playerRef = useRef<ReactPlayer | null>(null);

  // Fetch mainview timestamps when component mounts
  useEffect(() => {
    if (videoId) {
      getMainviewTimestamps(videoId)
        .then((timestamps) => {
          setMainviewTimestamps(timestamps);
        })
        .catch((error) => {
          console.error('Failed to fetch mainview timestamps:', error);
        });
    }
  }, [videoId]);

  // Handle frame change
  const handleFrameChange = (frame: number) => {
    setCurrentFrame(frame);
    if (onFrameUpdate) {
      onFrameUpdate(frame, duration, currentTime);
    }
  };

  // Handle updates to duration and current time
  const handlePlayerUpdates = (currentTime: number, duration: number) => {
    setCurrentTime(currentTime);
    setDuration(duration);
    if (onFrameUpdate) {
      onFrameUpdate(currentFrame, duration, currentTime);
    }
  };

  // Method to get the ReactPlayer ref from the wrapper
  const setPlayerRef = (ref: ReactPlayer | null) => {
    playerRef.current = ref;
  };

  // Method to seek to a specific time (would be exported through ref in a complete implementation)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const seekToTime = (time: number) => {
    if (playerRef.current && duration > 0) {
      // Calculate the position as a percentage of the duration
      const position = time / duration;
      playerRef.current.seekTo(position);
    }
  };

  return (
    <div className='flex flex-1 flex-col overflow-hidden'>
      {/* Video Player Container */}
      <div className='overflow-hidden rounded-md border border-gray-200 bg-white'>
        <ReactPlayerWrapper
          src={videoUrl}
          onFrameChange={handleFrameChange}
          mainviewTimestamps={stage === 'preprocess' ? mainviewTimestamps : []}
          overlay={customOverlay}
          onPlayerUpdates={handlePlayerUpdates}
          ref={setPlayerRef}
        />
      </div>
    </div>
  );
};

export default VideoPlayerSection;
