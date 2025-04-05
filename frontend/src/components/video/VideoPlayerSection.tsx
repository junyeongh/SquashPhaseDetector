import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import VideoPlayer from './VideoPlayer';
import { getMainviewData, MainviewResponse } from '@/services/api/video';
import ReactPlayer from 'react-player';

interface VideoPlayerSectionProps {
  videoUrl: string;
  videoId?: string;
  onFrameUpdate?: (frame: number, duration: number, currentTime: number, playing: boolean) => void;
  stage: string;
}

export interface VideoPlayerSectionRef {
  seekToTime: (time: number) => void;
}

const VideoPlayerSection = forwardRef<VideoPlayerSectionRef, VideoPlayerSectionProps>(
  ({ videoUrl, videoId, onFrameUpdate, stage }, ref) => {
    const [currentFrame, setCurrentFrame] = useState(0);
    const [mainviewData, setMainviewData] = useState<MainviewResponse | null>(null);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [playing, setPlaying] = useState(false);
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

    // Handle seeking to specific frame (used by MainviewTimeline)
    const handleSeek = (frame: number) => {
      if (playerRef.current && duration > 0) {
        // Convert frame to time based on fps from mainviewData or fallback to default fps
        const fps = mainviewData?.fps || 30;
        const timeInSeconds = frame / fps;
        playerRef.current.seekTo(timeInSeconds, 'seconds');
        console.log(`Seeking to frame ${frame}, time ${timeInSeconds}s using fps ${fps}`);
      }
    };

    // Fetch mainview data when component mounts or videoId changes
    useEffect(() => {
      // Reset data immediately when videoId changes to prevent displaying wrong data
      setMainviewData(null);

      if (videoId) {
        getMainviewData(videoId)
          .then((data) => {
            setMainviewData(data);
            console.log('Loaded main view data for video:', videoId, data);
          })
          .catch((error) => {
            console.error('Failed to fetch mainview data:', error);
          });
      }
    }, [videoId]);

    // Refresh main view data when stage changes to preprocess
    useEffect(() => {
      // Only refresh if we're on the preprocess stage
      if (stage === 'preprocess' && videoId) {
        console.log('Stage changed to preprocess, refreshing mainview data for video:', videoId);

        getMainviewData(videoId)
          .then((data) => {
            // Only update if we get back data that belongs to the current video
            setMainviewData(data);
            console.log('Refreshed mainview data on stage change:', data);
          })
          .catch((error) => {
            console.error('Failed to refresh mainview data:', error);
          });
      }
    }, [stage, videoId]);

    // Handle frame change
    const handleFrameChange = (frame: number) => {
      setCurrentFrame(frame);
      if (onFrameUpdate) {
        onFrameUpdate(frame, duration, currentTime, playing);
      }
    };

    // Handle updates to duration and current time
    const handlePlayerUpdates = (currentTime: number, duration: number, isPlaying: boolean) => {
      setCurrentTime(currentTime);
      setDuration(duration);
      setPlaying(isPlaying);
      if (onFrameUpdate) {
        onFrameUpdate(currentFrame, duration, currentTime, isPlaying);
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
          <VideoPlayer
            src={videoUrl}
            onFrameChange={handleFrameChange}
            mainviewResponse={mainviewData || undefined}
            onPlayerUpdates={handlePlayerUpdates}
            ref={setPlayerRef}
            onSeek={handleSeek}
            currentStage={stage}
          />
        </div>
      </div>
    );
  }
);

VideoPlayerSection.displayName = 'VideoPlayerSection';

export default VideoPlayerSection;
