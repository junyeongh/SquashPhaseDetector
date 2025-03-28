import { useParams } from 'react-router-dom';
import VideoPlayerSection from '@/components/video/VideoPlayerSection';
import { Scissors } from 'lucide-react';

interface SegmentationPageProps {
  videoUrl: string;
  isProcessing: boolean;
  onProcess: () => void;
  processingStatus: string;
}

const SegmentationPage: React.FC<SegmentationPageProps> = ({
  videoUrl,
  isProcessing,
  onProcess,
  processingStatus,
}) => {
  const { uuid } = useParams<{ uuid: string }>();

  return (
    <div className='flex h-full flex-col'>
      <h1 className='mb-2 text-lg font-medium text-gray-800'>
        Player Segmentation
      </h1>
      <p className='mb-4 text-xs text-gray-500'>
        Segment players from the video for pose estimation.
      </p>

      <VideoPlayerSection
        videoUrl={videoUrl}
        stage='segmentation'
        isProcessing={isProcessing}
        onProcess={onProcess}
        processingStatus={processingStatus}
        videoId={uuid || ''}
        buttonLabel='Run Segmentation'
        buttonIcon={<Scissors className='h-3 w-3' />}
        customOverlay={
          <div className='pointer-events-none absolute top-1/4 left-1/4 h-1/2 w-1/2 border-2 border-dashed border-red-500 opacity-50'>
            <div className='absolute -top-6 left-0 rounded bg-red-500 px-2 py-1 text-xs text-white'>
              Segmentation Area
            </div>
          </div>
        }
      />
    </div>
  );
};

export default SegmentationPage;
