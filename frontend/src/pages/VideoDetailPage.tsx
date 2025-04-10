import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { BASE_API_URL } from '@/services/api/config';
import VideoPlayerSection, { VideoPlayerSectionRef } from '@/components/video/VideoPlayerSection';
import { getMainviewData, MainviewResponse, generateMainView, createProcessingEventSource } from '@/services/api/video';
import { get_sam2_model_result, getSegmentationStatus, runSegmentation } from '@/services/api/segmentation';
import useSegmentationStore, { Point } from '@/store/segmentationStore';
import { run_yolo_pose_v11, get_yolo_pose_v11, get_yolo_pose_v11_status } from '@/services/api/pose';
import ProcessSidemenu, { ProcessingStage, StageConfig } from '@/components/processSidemenu';
import { relocateMarkerDataToCorrectChunk, isValidMarkerInput } from '@/utils/segmentation';

// Shared stage configuration
const processingStages: StageConfig[] = [
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
    description: 'Generate Exploratory data analysis (EDA) Report for squash game analysis',
  },
  {
    id: 'export',
    label: 'Export Results',
    description: 'Export the analysis results in various formats.',
  },
];

const VideoDetailPage: React.FC = () => {
  const { uuid: urlUUID } = useParams<{ uuid: string }>();
  const [activeStage, setActiveStage] = useState<ProcessingStage>('preprocess');
  const [completedStages, setCompletedStages] = useState<Set<ProcessingStage>>(new Set());
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [showSkipButton, setShowSkipButton] = useState<boolean>(false);
  const videoPlayerRef = useRef<VideoPlayerSectionRef>(null);

  // Video info
  const [modelType, setModelType] = useState<string>('efficientpose'); // Default to efficientpose
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(50);

  // Frame state
  const [frameIndex, setFrameIndex] = useState<number>(0);

  // Maintained for UI display and future integration with ProcessSidemenu
  const [mainviewData, setMainviewData] = useState<MainviewResponse | null>(null);

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

  // State for pose detection

  // Check if stages already completed
  useEffect(() => {
    if (urlUUID) {
      // Fetch mainview data
      getMainviewData(urlUUID)
        .then((mainview_data) => {
          setMainviewData(mainview_data);

          // Save chunks data to sessionStorage for use in segmentationStore
          if (mainview_data.chunks && mainview_data.chunks.length > 0) {
            try {
              sessionStorage.setItem('mainviewChunks', JSON.stringify(mainview_data.chunks));
            } catch (error) {
              console.error('Error saving chunks data to sessionStorage:', error);
            }
          }

          // If mainview segments already exist, mark preprocess as completed
          if (mainview_data.timestamps && mainview_data.timestamps.length > 0) {
            setCompletedStages(new Set(['preprocess']));
          }

          // Chain the get_sam2_model_result call after getMainviewData completes
          return get_sam2_model_result(urlUUID);
        })
        .then((sam_data) => {
          if (sam_data) {
            setCompletedStages((prev) => new Set([...prev, 'segmentation']));
          }
          return get_yolo_pose_v11(urlUUID);
        })
        .then((yolo_data) => {
          if (yolo_data) {
            setCompletedStages((prev) => new Set([...prev, 'pose']));
          }
        })
        .catch((error) => {
          console.error('Failed to fetch data:', error);
        });
    }
  }, [urlUUID, activeStage]);

  // Handle frame updates from the video player
  const handleFrameUpdate = (frame: number) => {
    setFrameIndex(frame);
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
          // Fetch the complete mainview data after processing is complete
          const data = await getMainviewData(videoId);
          setMainviewData(data);
          console.log('Fetched mainview data after completion:', data);

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
          console.error('Error fetching mainview data after completion:', error);
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
    if (!urlUUID) return;

    setIsProcessing(true);
    setProcessingStatus('Starting main view detection...');

    try {
      // Start the main view detection process
      const response = await generateMainView(urlUUID);
      console.log('Started main view detection:', response);

      // Listen for updates using SSE
      const eventSource = listenForProcessingUpdates(urlUUID);

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
    if (!urlUUID) return;

    setIsProcessing(true);
    setProcessingStatus('Starting segmentation...');

    // Use the getMarkerInput method from the store
    const markerInput = useSegmentationStore.getState().getMarkerInput();
    console.log('Marker input:', relocateMarkerDataToCorrectChunk(markerInput, mainviewData?.chunks || []));

    // Check if the marker input is valid
    const isValid = isValidMarkerInput(relocateMarkerDataToCorrectChunk(markerInput, mainviewData?.chunks || []));

    if (!isValid) {
      alert('Please add at least one positive marker for each main view segment before starting segmentation');
      setIsProcessing(false);
      return;
    }

    try {
      // Use the relocated marker input
      const inputToSend = relocateMarkerDataToCorrectChunk(markerInput, mainviewData?.chunks || []);
      console.log('Input:', inputToSend);
      await runSegmentation(urlUUID, inputToSend);

      // Poll for status updates
      const statusCheckInterval = setInterval(async () => {
        try {
          const status = await getSegmentationStatus(urlUUID);

          if (status.status === 'completed') {
            clearInterval(statusCheckInterval);
            setIsProcessing(false);

            // Mark stage as completed
            const updatedCompletedStages = new Set(completedStages);
            updatedCompletedStages.add('segmentation');
            setCompletedStages(updatedCompletedStages);

            // Move to next stage after a delay
            setTimeout(() => moveToNextStage(), 1000);
          } else if (status.status.startsWith('error') || status.status === 'failed') {
            clearInterval(statusCheckInterval);
            setProcessingStatus(`Segmentation failed: ${status.status}`);
            setIsProcessing(false);
            setShowSkipButton(true);
          }
        } catch (error) {
          console.error('Error checking segmentation status:', error);
        }
      }, 60000); // takes a while so every 1 minute

      // Clean up interval if component unmounts
      return () => clearInterval(statusCheckInterval);
    } catch (error) {
      console.error('Error running segmentation:', error);
      setProcessingStatus('Error running segmentation');
      setIsProcessing(false);
    }
  };

  // Handler for pose detection
  const handleStartPoseDetection = async () => {
    if (!urlUUID) return;

    setIsProcessing(true);
    setProcessingStatus('Starting pose detection...');

    try {
      await run_yolo_pose_v11(urlUUID);

      // Poll for status updates
      const statusCheckInterval = setInterval(async () => {
        try {
          const status = await get_yolo_pose_v11_status(urlUUID);
          setProcessingStatus(`Pose detection: ${status.message}`);

          if (status.success && status.message === 'completed') {
            clearInterval(statusCheckInterval);
            setIsProcessing(false);

            // Mark stage as completed
            const updatedCompletedStages = new Set(completedStages);
            updatedCompletedStages.add('pose');
            setCompletedStages(updatedCompletedStages);

            // Move to next stage after a delay
            setTimeout(() => moveToNextStage(), 1000);
          } else if (!status.success || status.message === 'failed') {
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

  // Create a combined map of all marked frames data
  const createCombinedMarkedFramesMap = () => {
    const allFrameIndices = new Set<number>([
      ...player1Points.keys(),
      ...player2Points.keys(),
      ...player1PositivePoints.keys(),
      ...player1NegativePoints.keys(),
      ...player2PositivePoints.keys(),
      ...player2NegativePoints.keys(),
    ]);

    const combinedMap = new Map();

    allFrameIndices.forEach((frameIdx) => {
      const frameData: {
        player1Points?: Point[];
        player2Points?: Point[];
        player1PositivePoints?: Point[];
        player1NegativePoints?: Point[];
        player2PositivePoints?: Point[];
        player2NegativePoints?: Point[];
      } = {};

      const p1Points = player1Points.get(frameIdx);
      if (p1Points && p1Points.length > 0) {
        frameData.player1Points = p1Points;
      }

      const p2Points = player2Points.get(frameIdx);
      if (p2Points && p2Points.length > 0) {
        frameData.player2Points = p2Points;
      }

      const p1Positive = player1PositivePoints.get(frameIdx);
      if (p1Positive && p1Positive.length > 0) {
        frameData.player1PositivePoints = p1Positive;
      }

      const p1Negative = player1NegativePoints.get(frameIdx);
      if (p1Negative && p1Negative.length > 0) {
        frameData.player1NegativePoints = p1Negative;
      }

      const p2Positive = player2PositivePoints.get(frameIdx);
      if (p2Positive && p2Positive.length > 0) {
        frameData.player2PositivePoints = p2Positive;
      }

      const p2Negative = player2NegativePoints.get(frameIdx);
      if (p2Negative && p2Negative.length > 0) {
        frameData.player2NegativePoints = p2Negative;
      }

      combinedMap.set(frameIdx, frameData);
    });

    return combinedMap;
  };

  const handleStartGameStateAnalysis = async () => {
    if (!urlUUID) return;

    setIsProcessing(true);
    setProcessingStatus('Starting game state analysis...');
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
              videoUrl={`${BASE_API_URL}/video/stream/${urlUUID}`}
              stage={activeStage}
              videoId={urlUUID || ''}
              onFrameUpdate={handleFrameUpdate}
              ref={videoPlayerRef}
            />
          </div>
        </div>
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
            onStartGameStateAnalysis={handleStartGameStateAnalysis}
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
            currentFrameIndex={frameIndex}
            markedFrames={createCombinedMarkedFramesMap()}
          />
        </div>
      </div>
    </div>
  );
};

export default VideoDetailPage;
