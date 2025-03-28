import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import VideoPlayerSection from './video/VideoPlayerSection';
import { BASE_API_URL } from '@/services/api/config';
import { Play, Scissors, Activity, Zap, Download } from 'lucide-react';
import {
  PreprocessContent,
  SegmentationContent,
  PoseContent,
  GameStateContent,
  ExportContent,
} from './stages/StageContent';
import { getMainviewTimestamps, MainviewTimestamp } from '@/services/api/video';
import ProcessingProgressSidebar, { ProcessingStage } from './processing/ProcessingProgressSidebar';

const VideoDetailPage: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const [activeStage, setActiveStage] = useState<ProcessingStage>('preprocess');
  const [completedStages, setCompletedStages] = useState<Set<ProcessingStage>>(
    new Set()
  );
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  // State for video player data
  const [currentFrame, setCurrentFrame] = useState<number>(0); // Still needed for future features or for communicating with backend
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [mainviewTimestamps, setMainviewTimestamps] = useState<
    MainviewTimestamp[]
  >([]);

  // Fetch mainview timestamps when component mounts
  useEffect(() => {
    if (uuid) {
      getMainviewTimestamps(uuid)
        .then((timestamps) => {
          setMainviewTimestamps(timestamps);
        })
        .catch((error) => {
          console.error('Failed to fetch mainview timestamps:', error);
        });
    }
  }, [uuid]);

  // Log frame updates for debugging purposes
  useEffect(() => {
    console.debug(`Current frame updated: ${currentFrame}`);
  }, [currentFrame]);

  // Update frame and player info
  const handleFrameUpdate = (
    frame: number,
    newDuration: number,
    newCurrentTime: number
  ) => {
    setCurrentFrame(frame);
    setDuration(newDuration);
    setCurrentTime(newCurrentTime);
  };

  // Function for processing video
  const handleProcessVideo = () => {
    setIsProcessing(true);
    setProcessingStatus(`${activeStage} in progress...`);

    // Simulate processing with timeout
    setTimeout(() => {
      setProcessingStatus(`${activeStage} processing step 2...`);

      setTimeout(() => {
        setProcessingStatus(`${activeStage} finalizing...`);

        setTimeout(() => {
          setIsProcessing(false);

          // Mark current stage as completed
          const updatedCompletedStages = new Set(completedStages);
          updatedCompletedStages.add(activeStage);
          setCompletedStages(updatedCompletedStages);

          // Move to next stage
          moveToNextStage();
        }, 2000);
      }, 2000);
    }, 2000);
  };

  const moveToNextStage = () => {
    switch (activeStage) {
      case 'preprocess':
        setActiveStage('segmentation');
        break;
      case 'segmentation':
        setActiveStage('pose');
        break;
      case 'pose':
        setActiveStage('game_state');
        break;
      case 'game_state':
        setActiveStage('export');
        break;
      case 'export':
        // This is the final stage
        break;
    }
  };

  // Get button text and icon based on the active stage
  const getButtonConfig = () => {
    switch (activeStage) {
      case 'preprocess':
        return { label: 'Process Video', icon: <Play className='h-3 w-3' /> };
      case 'segmentation':
        return {
          label: 'Run Segmentation',
          icon: <Scissors className='h-3 w-3' />,
        };
      case 'pose':
        return {
          label: 'Detect Poses',
          icon: <Activity className='h-3 w-3' />,
        };
      case 'game_state':
        return { label: 'Analyze Game', icon: <Zap className='h-3 w-3' /> };
      case 'export':
        return {
          label: 'Export Results',
          icon: <Download className='h-3 w-3' />,
        };
      default:
        return { label: 'Process', icon: <Play className='h-3 w-3' /> };
    }
  };

  // Get stage-specific overlay
  const getStageOverlay = () => {
    switch (activeStage) {
      case 'segmentation':
        return (
          <div className='pointer-events-none absolute top-1/4 left-1/4 h-1/2 w-1/2 border-2 border-dashed border-red-500 opacity-50'>
            <div className='absolute -top-6 left-0 rounded bg-red-500 px-2 py-1 text-xs text-white'>
              Segmentation Area
            </div>
          </div>
        );
      case 'pose':
        return (
          <div className='pointer-events-none absolute flex h-full w-full items-center justify-center'>
            <div className='relative h-1/2 w-1/2'>
              <div className='absolute h-full w-full border-2 border-dashed border-blue-500 opacity-50'></div>
              <div className='absolute -top-6 left-0 rounded bg-blue-500 px-2 py-1 text-xs text-white'>
                Pose Detection Area
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Handle seek in the timeline
  const handleSeek = (time: number) => {
    console.log('Seeking to time:', time);
    // This would call the VideoPlayerSection's seekToTime method
    // In a real implementation, we would use a ref to the VideoPlayerSection
  };

  // Render stage-specific content
  const renderStageContent = () => {
    switch (activeStage) {
      case 'preprocess':
        return (
          <PreprocessContent
            onProcess={handleProcessVideo}
            isProcessing={isProcessing}
            processingStatus={processingStatus}
            mainviewTimestamps={mainviewTimestamps}
            duration={duration}
            currentTime={currentTime}
            onSeek={handleSeek}
            buttonConfig={getButtonConfig()}
          />
        );
      case 'segmentation':
        return <SegmentationContent />;
      case 'pose':
        return <PoseContent />;
      case 'game_state':
        return <GameStateContent />;
      case 'export':
        return <ExportContent />;
      default:
        return null;
    }
  };

  return (
    <div className='flex h-full flex-col'>
      {/* Stage-specific content */}
      {renderStageContent()}

      {/* New layout with video player and progress sidebar */}
      <div className='flex-1 flex'>
        {/* Video player section - now with fixed width */}
        <div className='flex-1 max-w-[70%] overflow-hidden'>
          <VideoPlayerSection
            videoUrl={`${BASE_API_URL}/video/stream/${uuid}`}
            stage={activeStage}
            videoId={uuid || ''}
            customOverlay={getStageOverlay()}
            onFrameUpdate={handleFrameUpdate}
          />
        </div>

        {/* Processing progress sidebar */}
        <div className='w-[30%] h-full'>
          <ProcessingProgressSidebar
            activeStage={activeStage}
            completedStages={completedStages}
            isProcessing={isProcessing}
            processingStatus={processingStatus}
          />
        </div>
      </div>
    </div>
  );
};

export default VideoDetailPage;
