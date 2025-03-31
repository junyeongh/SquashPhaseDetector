import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import ReactPlayerWrapper from './VideoPlayer';
import { getMainviewTimestamps, MainviewTimestamp } from '@/services/api/video';
import ReactPlayer from 'react-player';

interface VideoPlayerSectionProps {
  videoUrl: string;
  stage: string;
  videoId: string;
  customOverlay?: React.ReactNode;
  // These props will be passed to the PreprocessContent
  onFrameUpdate?: (frame: number, duration: number, currentTime: number) => void;
}

export interface VideoPlayerSectionRef {
  seekToTime: (time: number) => void;
}

const VideoPlayerSection = forwardRef<VideoPlayerSectionRef, VideoPlayerSectionProps>(
  ({ videoUrl, stage, videoId, customOverlay, onFrameUpdate }, ref) => {
    const [currentFrame, setCurrentFrame] = useState(0);
    const [mainviewTimestamps, setMainviewTimestamps] = useState<MainviewTimestamp[]>([]);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const playerRef = useRef<ReactPlayer | null>(null);

    // Expose the seekToTime method to parent components
    useImperativeHandle(ref, () => ({
      seekToTime: (time: number) => {
        if (playerRef.current && duration > 0) {
          // Calculate the position as a percentage of the duration
          playerRef.current.seekTo(time, 'seconds');
        }
      },
    }));

    // Handle seeking to specific time (used by MainviewTimeline)
    const handleSeek = (time: number) => {
      if (playerRef.current) {
        playerRef.current.seekTo(time, 'seconds');
      }
    };

    // Fetch mainview timestamps when component mounts or videoId changes
    useEffect(() => {
      // Reset timestamps immediately when videoId changes to prevent displaying wrong data
      setMainviewTimestamps([]);

      if (videoId) {
        getMainviewTimestamps(videoId)
          .then((timestamps) => {
            setMainviewTimestamps(timestamps);
            console.log('Loaded main view timestamps for video:', videoId, timestamps);
          })
          .catch((error) => {
            console.error('Failed to fetch mainview timestamps:', error);
          });
      }
    }, [videoId]);

    // Refresh main view timestamps when stage changes to preprocess
    useEffect(() => {
      // Only refresh if we're on the preprocess stage
      if (stage === 'preprocess' && videoId) {
        console.log('Stage changed to preprocess, refreshing timestamps for video:', videoId);

        getMainviewTimestamps(videoId)
          .then((timestamps) => {
            // Only update if we get back data that belongs to the current video
            setMainviewTimestamps(timestamps);
            console.log('Refreshed timestamps on stage change:', timestamps.length);
          })
          .catch((error) => {
            console.error('Failed to refresh mainview timestamps:', error);
          });
      }
    }, [stage, videoId]);

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

    return (
      <div className='flex flex-1 flex-col overflow-hidden'>
        {/* Video Player Container */}
        <div className='overflow-hidden rounded-md border border-gray-200 bg-white'>
          <ReactPlayerWrapper
            src={videoUrl}
            onFrameChange={handleFrameChange}
            mainviewTimestamps={mainviewTimestamps}
            overlay={customOverlay}
            onPlayerUpdates={handlePlayerUpdates}
            ref={setPlayerRef}
            onSeek={handleSeek}
          />
        </div>
      </div>
    );
  }
);

VideoPlayerSection.displayName = 'VideoPlayerSection';

export default VideoPlayerSection;
