import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import VideoPlayerSection, {
  VideoPlayerSectionRef,
} from './video/VideoPlayerSection';
import { BASE_API_URL } from '@/services/api/config';
import { Play, Scissors, Activity, Zap, Download } from 'lucide-react';
import {
  PreprocessContent,
  SegmentationContent,
  PoseContent,
  GameStateContent,
  ExportContent,
} from './stages/StageContent';
import {
  getMainviewTimestamps,
  MainviewTimestamp,
  generateMainView,
  getProcessingStatus,
  createProcessingEventSource,
} from '@/services/api/video';
import ProcessingProgressSidebar, {
  ProcessingStage,
} from './processing/ProcessingProgressSidebar';

const VideoDetailPage: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const [activeStage, setActiveStage] = useState<ProcessingStage>('preprocess');
  const [completedStages, setCompletedStages] = useState<Set<ProcessingStage>>(
    new Set()
  );
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const videoPlayerRef = useRef<VideoPlayerSectionRef>(null);

  // State for video player data
  const [currentFrame, setCurrentFrame] = useState<number>(0); // Still needed for future features or for communicating with backend
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [mainviewTimestamps, setMainviewTimestamps] = useState<
    MainviewTimestamp[]
  >([]);

  // Fetch mainview timestamps when component mounts or video changes
  useEffect(() => {
    // Clear timestamps immediately when video changes to prevent showing stale data
    setMainviewTimestamps([]);

    if (uuid) {
      getMainviewTimestamps(uuid)
        .then((timestamps) => {
          setMainviewTimestamps(timestamps);
          console.log(
            'VideoDetail: Loaded timestamps for video:',
            uuid,
            timestamps.length
          );
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

  // Replace polling with SSE for processing updates
  const listenForProcessingUpdates = (videoId: string) => {
    // Clean up any existing event sources
    let eventSource: EventSource | null = null;

    try {
      // Create new event source
      eventSource = createProcessingEventSource(videoId);

      // Handle connection established
      eventSource.addEventListener('connected', (event) => {
        console.log('SSE connection established:', event.data);
      });

      // Handle status updates
      eventSource.addEventListener('status', (event) => {
        const status = event.data;
        setProcessingStatus(`Main view detection: ${status}`);
        console.log('Processing status update:', status);
      });

      // Handle processing completion
      eventSource.addEventListener('complete', async () => {
        console.log('Processing complete event received');
        setProcessingStatus('Main view detection complete!');

        try {
          // Fetch the timestamps after processing is complete
          const timestamps = await getMainviewTimestamps(videoId);
          setMainviewTimestamps(timestamps);
          console.log(
            'Fetched timestamps after completion:',
            timestamps.length
          );

          // Mark current stage as completed
          const updatedCompletedStages = new Set(completedStages);
          updatedCompletedStages.add(activeStage);
          setCompletedStages(updatedCompletedStages);

          // Clean up
          if (eventSource) {
            eventSource.close();
            console.log('SSE connection closed after completion');
          }

          setIsProcessing(false);

          // Move to next stage after a short delay
          setTimeout(() => {
            moveToNextStage();
          }, 1000);
        } catch (error) {
          console.error('Error fetching results after completion:', error);
          setProcessingStatus(
            `Error fetching results: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
          if (eventSource) eventSource.close();
          setIsProcessing(false);
        }
      });

      // Handle errors
      eventSource.addEventListener('error', (event) => {
        console.error('SSE error:', event);
        setProcessingStatus('Connection error. Please try again.');
        if (eventSource) eventSource.close();
        setIsProcessing(false);
      });

      // Standard error event
      eventSource.onerror = () => {
        console.error('SSE connection error');
        setProcessingStatus('Lost connection to server. Please try again.');
        if (eventSource) eventSource.close();
        setIsProcessing(false);
      };
    } catch (error) {
      console.error('Error setting up SSE:', error);
      setProcessingStatus(
        `Error: ${error instanceof Error ? error.message : 'Failed to connect to server'}`
      );
      if (eventSource) eventSource.close();
      setIsProcessing(false);
    }

    // Return cleanup function
    return () => {
      if (eventSource) {
        console.log('Cleaning up SSE connection');
        eventSource.close();
      }
    };
  };

  // Function for processing video
  const handleProcessVideo = async () => {
    // Prevent starting if already processing
    if (isProcessing) {
      console.log('Already processing, ignoring request');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus(`${activeStage} in progress...`);

    try {
      // Execute different processing based on the current stage
      if (activeStage === 'preprocess') {
        setProcessingStatus('Starting main view detection...');

        if (!uuid) {
          throw new Error('Video UUID is missing');
        }

        // Check if video is already being processed or has results
        try {
          const statusResponse = await getProcessingStatus(uuid);

          if (statusResponse.is_processing) {
            // If already processing, just start listening for updates
            setProcessingStatus(
              `Main view detection already in progress: ${statusResponse.status}`
            );
            console.log(
              'Video already being processed, starting SSE connection'
            );
          } else if (statusResponse.has_mainview) {
            // If already has results, load them
            const timestamps = await getMainviewTimestamps(uuid);
            setMainviewTimestamps(timestamps);
            setProcessingStatus('Main view detection already complete!');

            // Mark current stage as completed
            const updatedCompletedSteps = new Set(completedStages);
            updatedCompletedSteps.add(activeStage);
            setCompletedStages(updatedCompletedSteps);

            setIsProcessing(false);
            return;
          } else {
            // If not processing and no results, start a new processing task
            await generateMainView(uuid);
            setProcessingStatus('Detecting main view segments...');
          }
        } catch (statusError) {
          // If status endpoint doesn't exist yet, proceed with normal flow
          console.log(
            'Status endpoint not available, proceeding with processing',
            statusError
          );
          await generateMainView(uuid);
          setProcessingStatus('Detecting main view segments...');
        }

        // Start listening for updates with SSE
        listenForProcessingUpdates(uuid);
      } else {
        // Simulate processing with timeout for other stages
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
      }
    } catch (error) {
      console.error(`Error during ${activeStage} processing:`, error);
      setProcessingStatus(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      setIsProcessing(false);
    }
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
    if (videoPlayerRef.current) {
      videoPlayerRef.current.seekToTime(time);
    }
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
      <div className='flex flex-1'>
        {/* Video player section - now with fixed width */}
        <div className='max-w-[70%] flex-1 overflow-hidden'>
          <VideoPlayerSection
            videoUrl={`${BASE_API_URL}/video/stream/${uuid}`}
            stage={activeStage}
            videoId={uuid || ''}
            customOverlay={getStageOverlay()}
            onFrameUpdate={handleFrameUpdate}
            ref={videoPlayerRef}
          />
        </div>

        {/* Processing progress sidebar */}
        <div className='h-full w-[30%]'>
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
