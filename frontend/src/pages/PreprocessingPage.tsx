import { useParams } from 'react-router-dom';
import VideoPlayerSection from '@/components/video/VideoPlayerSection';

interface ProcessingPageProps {
  originalVideoUrl: string;
  isProcessing: boolean;
  onProcess: () => void;
  processingStatus: string;
}

const PreprocessingPage: React.FC<ProcessingPageProps> = ({
  originalVideoUrl,
  isProcessing,
  onProcess,
  processingStatus,
}) => {
  const { uuid } = useParams<{ uuid: string }>();

  return (
    <div className='flex h-full flex-col'>
      <h1 className='mb-2 text-lg font-medium text-gray-800'>
        Video Preprocessing
      </h1>
      <p className='mb-4 text-xs text-gray-500'>
        Analyze the video to detect main view angles and prepare it for player
        segmentation.
      </p>

      <VideoPlayerSection
        videoUrl={originalVideoUrl}
        stage='preprocess'
        isProcessing={isProcessing}
        onProcess={onProcess}
        processingStatus={processingStatus}
        videoId={uuid || ''}
      />
    </div>
  );
};

export default PreprocessingPage;
