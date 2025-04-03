import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { BASE_API_URL } from '@/services/api/config';
import VideoPlayerSection, { VideoPlayerSectionRef } from '@/components/video/VideoPlayerSection';
import {
  getMainviewTimestamps,
  MainviewTimestamp,
  generateMainView,
  createProcessingEventSource,
} from '@/services/api/video';
import {
  Point,
  SegmentationResult,
  SegmentationMask,
  markPlayers,
  markPlayersSAM2,
  startSegmentation,
  getSegmentationStatus,
  getSegmentationMask,
} from '@/services/api/segmentation';
import { FramePoseResult, startPoseDetection, getPoseDetectionStatus } from '@/services/api/pose';
import ProcessSidemenu, { ProcessingStage, StageConfig } from '@/components/ProcessSidemenu';
import SegmentationOverlay from '@/components/video/SegmentationOverlay';
import MaskLayer from '@/components/video/MaskLayer';
import { MarkerType } from '@/components/ProcessSidemenu';

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
  const { uuid: urlUuid } = useParams<{ uuid: string }>();
  const [activeStage, setActiveStage] = useState<ProcessingStage>('preprocess');
  const [completedStages, setCompletedStages] = useState<Set<ProcessingStage>>(new Set());
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [showSkipButton, setShowSkipButton] = useState<boolean>(false);
  const videoPlayerRef = useRef<VideoPlayerSectionRef>(null);

  // Video info
  const [uuid, setUuid] = useState<string | null>(null);
  const [modelType, setModelType] = useState<string>('efficientpose'); // Default to efficientpose
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.5);

  // Frame state
  const [frameIndex, setFrameIndex] = useState<number>(0);

  // State for current video duration, time and frame
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Maintained for UI display and future integration with ProcessSidemenu
  const [mainviewTimestamps, setMainviewTimestamps] = useState<MainviewTimestamp[]>([]);

  // State for segmentation
  // Used by the ProcessSidemenu component
  const [frameUrl, setFrameUrl] = useState<string>('');

  const [segmentationResults, setSegmentationResults] = useState<SegmentationResult[] | null>(null);

  // SAM2 specific state
  const [segmentationModel, setSegmentationModel] = useState<string>('SAM2');
  const [activeMarkerType, setActiveMarkerType] = useState<'positive' | 'negative'>('positive');
  const [player1PositivePoints, setPlayer1PositivePoints] = useState<Map<number, Point[]>>(new Map());
  const [player1NegativePoints, setPlayer1NegativePoints] = useState<Map<number, Point[]>>(new Map());
  const [player2PositivePoints, setPlayer2PositivePoints] = useState<Map<number, Point[]>>(new Map());
  const [player2NegativePoints, setPlayer2NegativePoints] = useState<Map<number, Point[]>>(new Map());
  const [player1Points, setPlayer1Points] = useState<Map<number, Point[]>>(new Map());
  const [player2Points, setPlayer2Points] = useState<Map<number, Point[]>>(new Map());
  const [activePlayer, setActivePlayer] = useState<1 | 2>(1);

  // Mask state for current frame
  const [player1Mask, setPlayer1Mask] = useState<SegmentationMask | null>(null);
  const [player2Mask, setPlayer2Mask] = useState<SegmentationMask | null>(null);

  // State for pose detection
  const [poseResults, setPoseResults] = useState<FramePoseResult[] | null>(null);

  // Set a default frame URL for the current video
  useEffect(() => {
    if (urlUuid) {
      // Generate a URL to fetch a frame from the current video
      setUuid(urlUuid);
      setFrameUrl(`${BASE_API_URL}/video/${urlUuid}/frame/${frameIndex}`);
    }
  }, [urlUuid, frameIndex]);

  // Check if main view segments already exist and auto-advance if they do
  useEffect(() => {
    if (urlUuid && activeStage === 'preprocess') {
      getMainviewTimestamps(urlUuid)
        .then((timestamps) => {
          setMainviewTimestamps(timestamps);
          console.log('VideoDetail: Loaded timestamps for video:', urlUuid, timestamps.length);

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
  }, [urlUuid, activeStage]);

  // Fetch segmentation masks when frame changes
  useEffect(() => {
    if (urlUuid && activeStage === 'segmentation' && completedStages.has('segmentation')) {
      // Try to fetch masks for the current frame
      fetchFrameMasks();
    } else {
      // Clear masks when changing frames before segmentation is completed
      setPlayer1Mask(null);
      setPlayer2Mask(null);
    }
  }, [urlUuid, frameIndex, activeStage, completedStages]);

  // Fetch masks for the current frame
  const fetchFrameMasks = async () => {
    if (!urlUuid) return;

    try {
      const result = await getSegmentationMask(urlUuid, frameIndex);
      console.log('Fetched masks for frame:', frameIndex, result);
      setPlayer1Mask(result.player1Mask);
      setPlayer2Mask(result.player2Mask);
    } catch (error) {
      console.error('Error fetching segmentation masks:', error);
      setPlayer1Mask(null);
      setPlayer2Mask(null);
    }
  };

  // Log frame updates for debugging purposes
  useEffect(() => {
    console.debug(`Current frame updated: ${frameIndex}`);
  }, [frameIndex]);

  // Handle frame updates from the video player
  const handleFrameUpdate = (frame: number, newDuration: number, newCurrentTime: number, playing: boolean) => {
    setFrameIndex(frame);
    setDuration(newDuration);
    setCurrentTime(newCurrentTime);
    setIsPlaying(playing);

    // If we're on the segmentation stage, fetch masks for the current frame
    if (activeStage === 'segmentation' && urlUuid) {
      fetchFrameMasks();
    }
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
          console.error('Error fetching timestamps after completion:', error);
          setIsProcessing(false);
        }
      });

      // Handle errors
      eventSource.addEventListener('error', (event) => {
        console.error('SSE error:', event);
        if (eventSource) {
          eventSource.close();
        }
        setIsProcessing(false);
        setShowSkipButton(true);
      });

      // Return the event source for cleanup
      return eventSource;
    } catch (error) {
      console.error('Error creating SSE connection:', error);
      return null;
    }
  };

  const skipCurrentStage = () => {
    // Reset skip button state
    setShowSkipButton(false);

    // Mark current stage as completed even though we're skipping it
    const updatedCompletedStages = new Set(completedStages);
    updatedCompletedStages.add(activeStage);
    setCompletedStages(updatedCompletedStages);

    // Move to next stage
    moveToNextStage();
  };

  // Handler for processing video (main view detection)
  const handleProcessVideo = async () => {
    if (!urlUuid) return;

    setIsProcessing(true);
    setProcessingStatus('Starting main view detection...');

    try {
      // Start the main view detection process
      const response = await generateMainView(urlUuid);
      console.log('Started main view detection:', response);

      // Listen for updates using SSE
      const eventSource = listenForProcessingUpdates(urlUuid);

      // Set up cleanup function to close the event source if component unmounts
      return () => {
        if (eventSource) {
          eventSource.close();
        }
      };
    } catch (error) {
      console.error('Error starting main view detection:', error);
      setProcessingStatus('Error starting main view detection. Try again or skip this step.');
      setIsProcessing(false);
      setShowSkipButton(true);
    }
  };

  // Move to next stage in the processing pipeline
  const moveToNextStage = () => {
    const currentIndex = processingStages.findIndex((stage) => stage.id === activeStage);
    if (currentIndex < processingStages.length - 1) {
      const nextStage = processingStages[currentIndex + 1].id as ProcessingStage;
      setActiveStage(nextStage);
      setIsProcessing(false);

      // Reset stage-specific state when moving to next stage
      if (nextStage === 'segmentation') {
        // Reset segmentation state
        setPlayer1Points(new Map());
        setPlayer2Points(new Map());
        setPlayer1PositivePoints(new Map());
        setPlayer1NegativePoints(new Map());
        setPlayer2PositivePoints(new Map());
        setPlayer2NegativePoints(new Map());
      }
    }
  };

  // Move to previous stage in the processing pipeline
  const moveToPreviousStage = () => {
    const currentIndex = processingStages.findIndex((stage) => stage.id === activeStage);
    if (currentIndex > 0) {
      const previousStage = processingStages[currentIndex - 1].id as ProcessingStage;
      setActiveStage(previousStage);
      setIsProcessing(false);

      // Reset stage-specific state when moving to previous stage
      if (previousStage === 'segmentation') {
        // Reset segmentation state but keep any completed work
        // Do not clear points or results that might be useful
      }
    }
  };

  // Handler for selecting a specific stage
  const handleStageSelect = (stage: ProcessingStage) => {
    // Only allow selecting stages that are either completed or the next one to do
    const currentIndex = processingStages.findIndex((s) => s.id === activeStage);
    const targetIndex = processingStages.findIndex((s) => s.id === stage);
    const isCompleted = completedStages.has(stage);
    const isNextStage = targetIndex === currentIndex + 1;

    if (isCompleted || isNextStage || stage === activeStage) {
      setActiveStage(stage);
    }
  };

  // Handler for SAM2 marking and segmentation
  const handleStartSegmentation = async () => {
    if (!urlUuid) return;

    setIsProcessing(true);
    setProcessingStatus('Starting segmentation...');

    try {
      // If using SAM2 model, send SAM2 markers
      if (segmentationModel === 'SAM2') {
        try {
          // Get the points for the current frame
          const p1Positive = player1PositivePoints.get(frameIndex) || [];
          const p1Negative = player1NegativePoints.get(frameIndex) || [];
          const p2Positive = player2PositivePoints.get(frameIndex) || [];
          const p2Negative = player2NegativePoints.get(frameIndex) || [];

          // First mark the players with SAM2 points
          await markPlayersSAM2(urlUuid, frameIndex, p1Positive, p1Negative, p2Positive, p2Negative);
          console.log('SAM2 markers set successfully');
        } catch (error) {
          console.error('Error setting SAM2 markers:', error);
          setProcessingStatus('Error setting SAM2 markers');
          setIsProcessing(false);
          return;
        }
      } else {
        // Handle legacy model
        try {
          const p1Points = player1Points.get(frameIndex) || [];
          const p2Points = player2Points.get(frameIndex) || [];

          await markPlayers(urlUuid, frameIndex, p1Points, p2Points);
          console.log('Players marked successfully');
        } catch (error) {
          console.error('Error marking players:', error);
          setProcessingStatus('Error marking players');
          setIsProcessing(false);
          return;
        }
      }

      // Start segmentation with selected model
      await startSegmentation(urlUuid, segmentationModel);

      // Poll for status updates
      const statusCheckInterval = setInterval(async () => {
        try {
          const status = await getSegmentationStatus(urlUuid);
          setProcessingStatus(`Segmentation: ${status.message} (${Math.round(status.progress)}%)`);

          if (status.status === 'completed') {
            clearInterval(statusCheckInterval);
            setSegmentationResults(status.results || []);
            setIsProcessing(false);

            // Mark stage as completed
            const updatedCompletedStages = new Set(completedStages);
            updatedCompletedStages.add('segmentation');
            setCompletedStages(updatedCompletedStages);

            // Fetch masks for the current frame
            await fetchFrameMasks();

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
    if (!urlUuid) return;

    setIsProcessing(true);
    setProcessingStatus('Starting pose detection...');

    try {
      await startPoseDetection(urlUuid);

      // Poll for status updates
      const statusCheckInterval = setInterval(async () => {
        try {
          const status = await getPoseDetectionStatus(urlUuid);
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
          setPlayer1PositivePoints((prev) => {
            const newMap = new Map(prev);
            const currentPoints = prev.get(frameIndex) || [];
            newMap.set(frameIndex, [...currentPoints, point]);
            return newMap;
          });
        } else {
          setPlayer1NegativePoints((prev) => {
            const newMap = new Map(prev);
            const currentPoints = prev.get(frameIndex) || [];
            newMap.set(frameIndex, [...currentPoints, point]);
            return newMap;
          });
        }
      } else {
        if (activeMarkerType === 'positive') {
          setPlayer2PositivePoints((prev) => {
            const newMap = new Map(prev);
            const currentPoints = prev.get(frameIndex) || [];
            newMap.set(frameIndex, [...currentPoints, point]);
            return newMap;
          });
        } else {
          setPlayer2NegativePoints((prev) => {
            const newMap = new Map(prev);
            const currentPoints = prev.get(frameIndex) || [];
            newMap.set(frameIndex, [...currentPoints, point]);
            return newMap;
          });
        }
      }
    } else {
      // Legacy player point handling
      if (activePlayer === 1) {
        setPlayer1Points((prev) => {
          const newMap = new Map(prev);
          const currentPoints = prev.get(frameIndex) || [];
          newMap.set(frameIndex, [...currentPoints, point]);
          return newMap;
        });
      } else {
        setPlayer2Points((prev) => {
          const newMap = new Map(prev);
          const currentPoints = prev.get(frameIndex) || [];
          newMap.set(frameIndex, [...currentPoints, point]);
          return newMap;
        });
      }
    }
  };

  // Remove marker point at a specific index
  const handleRemoveMarkerPoint = (player: 1 | 2, markerType: MarkerType, index: number) => {
    if (player === 1) {
      if (markerType === 'positive') {
        setPlayer1PositivePoints((prev) => {
          const newMap = new Map(prev);
          const currentPoints = prev.get(frameIndex) || [];
          newMap.set(
            frameIndex,
            currentPoints.filter((_, i) => i !== index)
          );
          return newMap;
        });
      } else {
        setPlayer1NegativePoints((prev) => {
          const newMap = new Map(prev);
          const currentPoints = prev.get(frameIndex) || [];
          newMap.set(
            frameIndex,
            currentPoints.filter((_, i) => i !== index)
          );
          return newMap;
        });
      }
    } else {
      if (markerType === 'positive') {
        setPlayer2PositivePoints((prev) => {
          const newMap = new Map(prev);
          const currentPoints = prev.get(frameIndex) || [];
          newMap.set(
            frameIndex,
            currentPoints.filter((_, i) => i !== index)
          );
          return newMap;
        });
      } else {
        setPlayer2NegativePoints((prev) => {
          const newMap = new Map(prev);
          const currentPoints = prev.get(frameIndex) || [];
          newMap.set(
            frameIndex,
            currentPoints.filter((_, i) => i !== index)
          );
          return newMap;
        });
      }
    }
  };

  // Clear marker points for a specific player and marker type
  const handleClearPlayerMarkerPoints = (player: 1 | 2, markerType: 'positive' | 'negative') => {
    if (player === 1) {
      if (markerType === 'positive') {
        setPlayer1PositivePoints((prev) => {
          const newMap = new Map(prev);
          newMap.delete(frameIndex);
          return newMap;
        });
      } else {
        setPlayer1NegativePoints((prev) => {
          const newMap = new Map(prev);
          newMap.delete(frameIndex);
          return newMap;
        });
      }
    } else {
      if (markerType === 'positive') {
        setPlayer2PositivePoints((prev) => {
          const newMap = new Map(prev);
          newMap.delete(frameIndex);
          return newMap;
        });
      } else {
        setPlayer2NegativePoints((prev) => {
          const newMap = new Map(prev);
          newMap.delete(frameIndex);
          return newMap;
        });
      }
    }
  };

  // Check if the current frame has any markers
  const hasMarkersForCurrentFrame = (): boolean => {
    const hasPlayer1Positive = (player1PositivePoints.get(frameIndex)?.length || 0) > 0;
    const hasPlayer1Negative = (player1NegativePoints.get(frameIndex)?.length || 0) > 0;
    const hasPlayer2Positive = (player2PositivePoints.get(frameIndex)?.length || 0) > 0;
    const hasPlayer2Negative = (player2NegativePoints.get(frameIndex)?.length || 0) > 0;
    const hasLegacyPlayer1 = (player1Points.get(frameIndex)?.length || 0) > 0;
    const hasLegacyPlayer2 = (player2Points.get(frameIndex)?.length || 0) > 0;

    return (
      hasPlayer1Positive ||
      hasPlayer1Negative ||
      hasPlayer2Positive ||
      hasPlayer2Negative ||
      hasLegacyPlayer1 ||
      hasLegacyPlayer2
    );
  };

  // Check if current frame is in a main view segment
  const isCurrentFrameInMainView = (): boolean => {
    // If no timestamps exist, default to true to allow marking
    if (!mainviewTimestamps || mainviewTimestamps.length === 0) return true;

    // Calculate current time in seconds
    const currentTimeInSeconds = currentTime;

    // Check if current time is within any main view segment
    return mainviewTimestamps.some(
      (segment) => currentTimeInSeconds >= segment.start && currentTimeInSeconds <= segment.end
    );
  };

  // Get all frames that have markers
  const getFramesWithMarkers = (): number[] => {
    const frames = new Set<number>();

    // Add frames from all marker collections
    for (const frameIdx of player1PositivePoints.keys()) frames.add(frameIdx);
    for (const frameIdx of player1NegativePoints.keys()) frames.add(frameIdx);
    for (const frameIdx of player2PositivePoints.keys()) frames.add(frameIdx);
    for (const frameIdx of player2NegativePoints.keys()) frames.add(frameIdx);
    for (const frameIdx of player1Points.keys()) frames.add(frameIdx);
    for (const frameIdx of player2Points.keys()) frames.add(frameIdx);

    return Array.from(frames).sort((a, b) => a - b);
  };

  // Clear all points for a specific player
  const handleClearPlayerPoints = (player: 1 | 2) => {
    if (player === 1) {
      setPlayer1Points((prev) => {
        const newMap = new Map(prev);
        newMap.delete(frameIndex);
        return newMap;
      });
    } else {
      setPlayer2Points((prev) => {
        const newMap = new Map(prev);
        newMap.delete(frameIndex);
        return newMap;
      });
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
              videoUrl={`${BASE_API_URL}/video/stream/${urlUuid}`}
              stage={activeStage}
              videoId={urlUuid || ''}
              onFrameUpdate={handleFrameUpdate}
              ref={videoPlayerRef}
              customOverlay={
                activeStage === 'segmentation' ? (
                  <>
                    {/* Render masks first (lower z-index) */}
                    {(player1Mask || player2Mask) && (
                      <MaskLayer
                        width={1280}
                        height={720}
                        player1Mask={player1Mask}
                        player2Mask={player2Mask}
                        player1Color={[255, 0, 0, 0.4]} // Red with 40% opacity
                        player2Color={[0, 0, 255, 0.4]} // Blue with 40% opacity
                      />
                    )}

                    {/* Render interaction points on top (higher z-index) */}
                    <SegmentationOverlay
                      width={1280}
                      height={720}
                      activePlayer={activePlayer}
                      activeMarkerType={activeMarkerType}
                      player1PositivePoints={player1PositivePoints.get(frameIndex) || []}
                      player1NegativePoints={player1NegativePoints.get(frameIndex) || []}
                      player2PositivePoints={player2PositivePoints.get(frameIndex) || []}
                      player2NegativePoints={player2NegativePoints.get(frameIndex) || []}
                      player1Points={player1Points.get(frameIndex) || []}
                      player2Points={player2Points.get(frameIndex) || []}
                      segmentationModel={segmentationModel}
                      onAddPoint={handleAddMarkerPoint}
                      onRemovePoint={handleRemoveMarkerPoint}
                      isPlaying={isPlaying}
                      isInMainView={isCurrentFrameInMainView()}
                    />
                  </>
                ) : null
              }
            />
          </div>
        </div>
        {/* Frame marker indicator */}
        {/* {getFramesWithMarkers().length > 0 && (
          <div className='mt-4 rounded-md bg-gray-100 p-3'>
            <h3 className='mb-2 text-sm font-medium'>
              Frames with markers: {getFramesWithMarkers().length}
              {hasMarkersForCurrentFrame() && ' (Current frame has markers)'}
            </h3>
            <div className='flex flex-wrap gap-2'>
              {getFramesWithMarkers().map((frameIdx) => (
                <button
                  key={frameIdx}
                  className={`rounded-md px-2 py-1 text-xs ${frameIdx === frameIndex ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                  onClick={() => setFrameIndex(frameIdx)}
                >
                  {frameIdx}
                </button>
              ))}
            </div>
          </div>
        )} */}
        {/* Processing progress sidebar - now includes processing interfaces */}
        <div className='h-full w-[480px]'>
          <ProcessSidemenu
            stageConfig={processingStages}
            activeStage={activeStage}
            completedStages={completedStages}
            isProcessing={isProcessing}
            processingStatus={processingStatus}
            onStageSelect={handleStageSelect}
            // Process buttons
            onProcess={handleProcessVideo}
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
            player1Points={player1Points.get(frameIndex) || []}
            player2Points={player2Points.get(frameIndex) || []}
            // SAM2 specific controls
            segmentationModel={segmentationModel}
            activeMarkerType={activeMarkerType}
            setSegmentationModel={setSegmentationModel}
            setActiveMarkerType={setActiveMarkerType}
            player1PositivePoints={player1PositivePoints.get(frameIndex) || []}
            player1NegativePoints={player1NegativePoints.get(frameIndex) || []}
            player2PositivePoints={player2PositivePoints.get(frameIndex) || []}
            player2NegativePoints={player2NegativePoints.get(frameIndex) || []}
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
