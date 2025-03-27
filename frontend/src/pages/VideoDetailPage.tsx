import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PreprocessingPage from './PreprocessingPage';
import { BASE_API_URL } from '@/services/api/config';

// Define the types of processing stages
type ProcessingStage =
  | 'preprocess'
  | 'segmentation'
  | 'pose'
  | 'game_state'
  | 'export';

const VideoDetailPage: React.FC = () => {
  // Get the UUID from the URL
  const { uuid } = useParams<{ uuid: string }>();

  // State for the current active stage
  const [activeStage, setActiveStage] = useState<ProcessingStage>('preprocess');
  const [completedStages, setCompletedStages] = useState<Set<ProcessingStage>>(
    new Set()
  );

  // Mock states for video processing (these would be replaced with actual API calls)
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [processedVideoUrl, setProcessedVideoUrl] = useState<
    string | undefined
  >(undefined);

  // Mock function for processing video (simulate API call)
  const handleProcessVideo = () => {
    setIsProcessing(true);
    setProcessingStatus('Preprocessing video...');

    // Simulate processing with timeout
    setTimeout(() => {
      setProcessingStatus('Detecting main camera angle...');

      setTimeout(() => {
        setProcessingStatus('Filtering frames...');

        setTimeout(() => {
          setIsProcessing(false);
          // Use the uuid parameter for API calls
          setProcessedVideoUrl(
            `${BASE_API_URL}/video/stream/${uuid}/processed`
          );

          // Mark preprocess stage as completed
          const updatedCompletedStages = new Set(completedStages);
          updatedCompletedStages.add('preprocess');
          setCompletedStages(updatedCompletedStages);

          // Move to next stage
          setActiveStage('segmentation');
        }, 2000);
      }, 2000);
    }, 2000);
  };

  // Render the appropriate content based on the active stage
  const renderContent = () => {
    switch (activeStage) {
      case 'preprocess':
        return (
          <PreprocessingPage
            originalVideoUrl={`${BASE_API_URL}/video/stream/${uuid}`}
            processedVideoUrl={processedVideoUrl}
            isProcessing={isProcessing}
            onProcess={handleProcessVideo}
            processingStatus={processingStatus}
          />
        );
      case 'segmentation':
        return (
          <div className='flex h-full items-center justify-center'>
            <p className='text-gray-500'>
              Segmentation page - Under development
            </p>
          </div>
        );
      case 'pose':
        return (
          <div className='flex h-full items-center justify-center'>
            <p className='text-gray-500'>
              Pose detection page - Under development
            </p>
          </div>
        );
      case 'game_state':
        return (
          <div className='flex h-full items-center justify-center'>
            <p className='text-gray-500'>
              Game state analysis page - Under development
            </p>
          </div>
        );
      case 'export':
        return (
          <div className='flex h-full items-center justify-center'>
            <p className='text-gray-500'>Export page - Under development</p>
          </div>
        );
      default:
        return <div>Unknown stage</div>;
    }
  };

  return (
    <div className='flex h-full flex-col'>
      <p className='mb-4 text-base font-bold'>Video Processing: {uuid}</p>
      {renderContent()}
    </div>
  );
};

export default VideoDetailPage;
