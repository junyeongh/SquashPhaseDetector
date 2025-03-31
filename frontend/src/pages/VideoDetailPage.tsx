import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { BASE_API_URL } from '@/services/api/config';
import VideoPlayerSection, { VideoPlayerSectionRef } from '@/components/video/VideoPlayerSection';
import {
  getMainviewTimestamps,
  MainviewTimestamp,
  generateMainView,
  getProcessingStatus,
  createProcessingEventSource,
} from '@/services/api/video';
import {
  Point,
  SegmentationResult,
  markPlayers,
  markPlayersSAM2,
  startSegmentation,
  getSegmentationStatus,
} from '@/services/api/segmentation';
import { FramePoseResult, startPoseDetection, getPoseDetectionStatus } from '@/services/api/pose';
import ProcessSidemenu, { ProcessingStage, StageConfig } from '@/components/ProcessSidemenu';
import SegmentationOverlay from '@/components/video/SegmentationOverlay';

// Shared stage configuration
export const processingStages: StageConfig[] = [
  {
    id: 'preprocess',
    label: 'Video Preprocessing',
    description: 'Analyze the video to detect main view angles and prepare it for player segmentation.',
  },
  {
    id: 'segmentation',
    label: 'Player Segmentation',
    description: 'Mark players in the frame and generate segmentation masks for tracking.',
  },
  {
    id: 'pose',
    label: 'Pose Detection',
    description: 'Detect player body positions and movements throughout the video.',
  },
  {
    id: 'game_state',
    label: 'Game State Analysis',
    description: 'Analyze the game state based on player positions and movements.',
  },
  {
    id: 'export',
    label: 'Export Results',
    description: 'Export the analysis results in various formats.',
  },
];

const VideoDetailPage: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const [activeStage, setActiveStage] = useState<ProcessingStage>('preprocess');
  const [completedStages, setCompletedStages] = useState<Set<ProcessingStage>>(new Set());
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [showSkipButton, setShowSkipButton] = useState<boolean>(false);
  const videoPlayerRef = useRef<VideoPlayerSectionRef>(null);

  // State for video player data
  const [currentFrame, setCurrentFrame] = useState<number>(0);

  // These values are updated by handleFrameUpdate and are used by the VideoPlayerSection component
  // They provide time-based information for UI components that need to know the video position
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [duration, setDuration] = useState<number>(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Maintained for UI display and future integration with ProcessSidemenu
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [mainviewTimestamps, setMainviewTimestamps] = useState<MainviewTimestamp[]>([]);

  // State for segmentation
  // Used by the ProcessSidemenu component
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [frameUrl, setFrameUrl] = useState<string>('');
  const [frameIndex, setFrameIndex] = useState<number>(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [player1Points, setPlayer1Points] = useState<Point[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [player2Points, setPlayer2Points] = useState<Point[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [segmentationResults, setSegmentationResults] = useState<SegmentationResult[] | null>(null);

  // SAM2 specific state
  const [segmentationModel, setSegmentationModel] = useState<string>('SAM2');
  const [activeMarkerType, setActiveMarkerType] = useState<'positive' | 'negative'>('positive');
  const [player1PositivePoints, setPlayer1PositivePoints] = useState<Point[]>([]);
  const [player1NegativePoints, setPlayer1NegativePoints] = useState<Point[]>([]);
  const [player2PositivePoints, setPlayer2PositivePoints] = useState<Point[]>([]);
  const [player2NegativePoints, setPlayer2NegativePoints] = useState<Point[]>([]);
  const [activePlayer, setActivePlayer] = useState<1 | 2>(1);

  // State for pose detection
  const [modelType, setModelType] = useState<string>('YOLOv8');
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(70);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [poseResults, setPoseResults] = useState<FramePoseResult[] | null>(null);

  // Set a default frame URL for the current video
  useEffect(() => {
    if (uuid) {
      // Generate a URL to fetch a frame from the current video
      setFrameUrl(`${BASE_API_URL}/video/${uuid}/frame/${frameIndex}`);
    }
  }, [uuid, frameIndex]);

  // Check if main view segments already exist and auto-advance if they do
  useEffect(() => {
    if (uuid && activeStage === 'preprocess') {
      getMainviewTimestamps(uuid)
        .then((timestamps) => {
          setMainviewTimestamps(timestamps);
          console.log('VideoDetail: Loaded timestamps for video:', uuid, timestamps.length);

          // If mainview segments already exist, mark preprocess as completed and advance to segmentation
          if (timestamps && timestamps.length > 0) {
            console.log('Main view segments already exist, advancing to segmentation stage');

            const updatedCompletedStages = new Set(completedStages);
            updatedCompletedStages.add('preprocess');
            setCompletedStages(updatedCompletedStages);

            // Auto-advance to next stage
            if (activeStage === 'preprocess') {
              setActiveStage('segmentation');
            }
          }
        })
        .catch((error) => {
          console.error('Failed to fetch mainview timestamps:', error);
        });
    }
  }, [uuid, activeStage]);

  // Log frame updates for debugging purposes
  useEffect(() => {
    console.debug(`Current frame updated: ${currentFrame}`);
  }, [currentFrame]);

  // Update frame and player info
  const handleFrameUpdate = (frame: number, newDuration: number, newCurrentTime: number) => {
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
          console.log('Fetched timestamps after completion:', timestamps.length);

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
          setProcessingStatus(`Error fetching results: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      setProcessingStatus(`Error: ${error instanceof Error ? error.message : 'Failed to connect to server'}`);
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

  const skipCurrentStage = () => {
    if (isProcessing) {
      // Close any ongoing connections
      setIsProcessing(false);
      setProcessingStatus('Skipped current stage');
    }

    // Mark current stage as completed (even though it was skipped)
    const updatedCompletedStages = new Set(completedStages);
    updatedCompletedStages.add(activeStage);
    setCompletedStages(updatedCompletedStages);

    // Move to the next stage
    moveToNextStage();
    setShowSkipButton(false);
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

    // Show skip button after a delay for preprocess stage
    if (activeStage === 'preprocess') {
      setShowSkipButton(false);
      setTimeout(() => {
        setShowSkipButton(true);
      }, 5000); // Show skip button after 5 seconds
    } else {
      // For other stages, don't show skip button initially
      setShowSkipButton(false);
      // But show it after a longer delay
      setTimeout(() => {
        setShowSkipButton(true);
      }, 15000); // Show skip button after 15 seconds for other stages
    }

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
            setProcessingStatus(`Main view detection already in progress: ${statusResponse.status}`);
            console.log('Video already being processed, starting SSE connection');
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
          console.log('Status endpoint not available, proceeding with processing', statusError);
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
      setProcessingStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsProcessing(false);

      // Show skip button immediately on error for preprocess stage
      if (activeStage === 'preprocess') {
        setShowSkipButton(true);
      }
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

  const moveToPreviousStage = () => {
    switch (activeStage) {
      case 'segmentation':
        setActiveStage('preprocess');
        break;
      case 'pose':
        setActiveStage('segmentation');
        break;
      case 'game_state':
        setActiveStage('pose');
        break;
      case 'export':
        setActiveStage('game_state');
        break;
      case 'preprocess':
        // This is the first stage
        break;
    }
  };

  // Function to handle direct stage selection from the sidebar
  const handleStageSelect = (stage: ProcessingStage) => {
    if (isProcessing) return; // Don't allow changing stages during processing
    setActiveStage(stage);
  };

  // Handle seek in the timeline
  // This function may be called by components that need to control video position
  // It's kept for component communication between UI elements and the video player
  //   const handleSeek = (time: number) => {
  //     console.log('Seeking to time:', time);
  //     if (videoPlayerRef.current) {
  //       videoPlayerRef.current.seekToTime(time);
  //     }
  //   };

  // Handler for player marking
  const handleMarkPlayers = async () => {
    if (!uuid) return;

    try {
      await markPlayers(uuid, frameIndex, player1Points, player2Points);
      console.log('Players marked successfully');
    } catch (error) {
      console.error('Error marking players:', error);
    }
  };

  // Handler for SAM2 marking and segmentation
  const handleStartSegmentation = async () => {
    if (!uuid) return;

    setIsProcessing(true);
    setProcessingStatus('Starting segmentation...');

    try {
      // If using SAM2 model, send SAM2 markers
      if (segmentationModel === 'SAM2') {
        try {
          // First mark the players with SAM2 points
          await markPlayersSAM2(
            uuid,
            frameIndex,
            player1PositivePoints,
            player1NegativePoints,
            player2PositivePoints,
            player2NegativePoints
          );
          console.log('SAM2 markers set successfully');
        } catch (error) {
          console.error('Error setting SAM2 markers:', error);
          setProcessingStatus('Error setting SAM2 markers');
          setIsProcessing(false);
          return;
        }
      }

      // Start segmentation with selected model
      await startSegmentation(uuid, segmentationModel);

      // Poll for status updates
      const statusCheckInterval = setInterval(async () => {
        try {
          const status = await getSegmentationStatus(uuid);
          setProcessingStatus(`Segmentation: ${status.message}`);

          if (status.status === 'completed') {
            clearInterval(statusCheckInterval);
            setSegmentationResults(status.results || []);
            setIsProcessing(false);

            // Mark stage as completed
            const updatedCompletedStages = new Set(completedStages);
            updatedCompletedStages.add('segmentation');
            setCompletedStages(updatedCompletedStages);

            // Move to next stage after a delay
            setTimeout(() => moveToNextStage(), 1000);
          } else if (status.status === 'failed') {
            clearInterval(statusCheckInterval);
            setProcessingStatus(`Segmentation failed: ${status.message}`);
            setIsProcessing(false);
            setShowSkipButton(true);
          }
        } catch (error) {
          console.error('Error checking segmentation status:', error);
        }
      }, 2000);

      // Clean up interval if component unmounts
      return () => clearInterval(statusCheckInterval);
    } catch (error) {
      console.error('Error starting segmentation:', error);
      setProcessingStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsProcessing(false);
      setShowSkipButton(true);
    }
  };

  // Handler for pose detection
  const handleStartPoseDetection = async () => {
    if (!uuid) return;

    setIsProcessing(true);
    setProcessingStatus('Starting pose detection...');

    try {
      await startPoseDetection(uuid);

      // Poll for status updates
      const statusCheckInterval = setInterval(async () => {
        try {
          const status = await getPoseDetectionStatus(uuid);
          setProcessingStatus(`Pose detection: ${status.message}`);

          if (status.status === 'completed') {
            clearInterval(statusCheckInterval);
            setPoseResults(status.results || []);
            setIsProcessing(false);

            // Mark stage as completed
            const updatedCompletedStages = new Set(completedStages);
            updatedCompletedStages.add('pose');
            setCompletedStages(updatedCompletedStages);

            // Move to next stage after a delay
            setTimeout(() => moveToNextStage(), 1000);
          } else if (status.status === 'failed') {
            clearInterval(statusCheckInterval);
            setProcessingStatus(`Pose detection failed: ${status.message}`);
            setIsProcessing(false);
            setShowSkipButton(true);
          }
        } catch (error) {
          console.error('Error checking pose detection status:', error);
        }
      }, 2000);

      // Clean up interval if component unmounts
      return () => clearInterval(statusCheckInterval);
    } catch (error) {
      console.error('Error starting pose detection:', error);
      setProcessingStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsProcessing(false);
      setShowSkipButton(true);
    }
  };

  // Update frame navigation
  const handleNextFrame = () => {
    setFrameIndex((prev) => prev + 1);
  };

  const handlePreviousFrame = () => {
    setFrameIndex((prev) => Math.max(0, prev - 1));
  };

  // Add marker points based on active player and marker type
  const handleAddMarkerPoint = (point: Point) => {
    if (segmentationModel === 'SAM2') {
      if (activePlayer === 1) {
        if (activeMarkerType === 'positive') {
          setPlayer1PositivePoints((prev) => [...prev, point]);
        } else {
          setPlayer1NegativePoints((prev) => [...prev, point]);
        }
      } else {
        if (activeMarkerType === 'positive') {
          setPlayer2PositivePoints((prev) => [...prev, point]);
        } else {
          setPlayer2NegativePoints((prev) => [...prev, point]);
        }
      }
    } else {
      // Legacy player point handling
      if (activePlayer === 1) {
        setPlayer1Points((prev) => [...prev, point]);
      } else {
        setPlayer2Points((prev) => [...prev, point]);
      }
    }
  };

  // Clear marker points for a specific player and marker type
  const handleClearPlayerMarkerPoints = (player: 1 | 2, markerType: 'positive' | 'negative') => {
    if (player === 1) {
      if (markerType === 'positive') {
        setPlayer1PositivePoints([]);
      } else {
        setPlayer1NegativePoints([]);
      }
    } else {
      if (markerType === 'positive') {
        setPlayer2PositivePoints([]);
      } else {
        setPlayer2NegativePoints([]);
      }
    }
  };

  // Clear all points for a specific player
  const handleClearPlayerPoints = (player: 1 | 2) => {
    if (player === 1) {
      setPlayer1Points([]);
    } else {
      setPlayer2Points([]);
    }
  };

  return (
    <div className='flex h-full flex-col'>
      {/* New layout with content, video player and progress sidebar */}
      <div className='flex h-full flex-1'>
        {/* Main content area with stage content and video player */}
        <div className='flex flex-1 flex-col overflow-hidden'>
          {/* Stage content - shows only stage-specific information */}
          <div className='mb-2 rounded-lg border border-gray-200'>
            <div className='rounded-t-lg border-b border-gray-200 bg-gray-50 p-4'>
              <div className='flex-1'>
                <h2 className='text-lg font-medium text-gray-800'>
                  {processingStages.find((stage) => stage.id === activeStage)?.label || ''}
                </h2>
                <p className='text-sm text-gray-500'>
                  {processingStages.find((stage) => stage.id === activeStage)?.description || ''}
                </p>
              </div>
            </div>
          </div>

          {/* Video player section */}
          <div className='flex-1 overflow-hidden'>
            <VideoPlayerSection
              videoUrl={`${BASE_API_URL}/video/stream/${uuid}`}
              stage={activeStage}
              videoId={uuid || ''}
              onFrameUpdate={handleFrameUpdate}
              ref={videoPlayerRef}
              customOverlay={
                activeStage === 'segmentation' ? (
                  <SegmentationOverlay
                    width={1280}
                    height={720}
                    activePlayer={activePlayer}
                    activeMarkerType={activeMarkerType}
                    player1PositivePoints={player1PositivePoints}
                    player1NegativePoints={player1NegativePoints}
                    player2PositivePoints={player2PositivePoints}
                    player2NegativePoints={player2NegativePoints}
                    player1Points={player1Points}
                    player2Points={player2Points}
                    segmentationModel={segmentationModel}
                    onAddPoint={handleAddMarkerPoint}
                  />
                ) : null
              }
            />
          </div>
        </div>

        {/* Processing progress sidebar - now includes processing interfaces */}
        <div className='h-full w-[480px]'>
          <ProcessSidemenu
            activeStage={activeStage}
            completedStages={completedStages}
            isProcessing={isProcessing}
            processingStatus={processingStatus}
            onStageSelect={handleStageSelect}
            stageConfig={processingStages}
            // Process buttons
            onProcess={handleProcessVideo}
            onMarkPlayers={handleMarkPlayers}
            onStartSegmentation={handleStartSegmentation}
            onStartPoseDetection={handleStartPoseDetection}
            // Skip controls
            showSkipButton={showSkipButton}
            onSkipStage={skipCurrentStage}
            // Stage-specific controls
            modelType={modelType}
            confidenceThreshold={confidenceThreshold}
            setModelType={setModelType}
            setConfidenceThreshold={setConfidenceThreshold}
            // Navigation controls
            onPreviousFrame={handlePreviousFrame}
            onNextFrame={handleNextFrame}
            onPreviousStage={moveToPreviousStage}
            onNextStage={moveToNextStage}
            // Player points for segmentation stage
            player1Points={player1Points}
            player2Points={player2Points}
            // SAM2 specific controls
            segmentationModel={segmentationModel}
            activeMarkerType={activeMarkerType}
            setSegmentationModel={setSegmentationModel}
            setActiveMarkerType={setActiveMarkerType}
            player1PositivePoints={player1PositivePoints}
            player1NegativePoints={player1NegativePoints}
            player2PositivePoints={player2PositivePoints}
            player2NegativePoints={player2NegativePoints}
            activePlayer={activePlayer}
            setActivePlayer={setActivePlayer}
            onClearPlayerMarkerPoints={handleClearPlayerMarkerPoints}
            onClearPlayerPoints={handleClearPlayerPoints}
          />
        </div>
      </div>
    </div>
  );
};

export default VideoDetailPage;
