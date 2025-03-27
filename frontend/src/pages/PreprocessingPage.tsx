import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReactPlayerWrapper from '@/components/video/VideoPlayer';
import { getMainviewTimestamps, MainviewTimestamp } from '@/services/api/video';
import { Play, Loader } from 'lucide-react';

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
  const [currentFrame, setCurrentFrame] = useState(0);
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

  return (
    <div className='flex h-full flex-col'>
      <h1 className='mb-3 text-xl font-medium'>Video Preprocessing</h1>
      <p className='mb-4 text-sm text-gray-600'>
        Analyze the video to detect main view angles and prepare it for player segmentation.
      </p>

      <div className='flex flex-1 flex-col overflow-hidden rounded-lg shadow-lg'>
        {/* Video Player Container */}
        <ReactPlayerWrapper
          src={originalVideoUrl}
          onFrameChange={setCurrentFrame}
          mainviewTimestamps={mainviewTimestamps}
        />

        {/* Processing Controls */}
        <div className='mt-4 border border-gray-200 bg-white p-4 rounded-lg'>
          <div className='flex items-center justify-between'>
            <div className='space-y-2'>
              <div className='flex items-center space-x-2'>
                <div className='text-sm text-gray-700'>Current Frame:</div>
                <div className='rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600'>
                  {currentFrame}
                </div>
              </div>

              {isProcessing && (
                <div className='flex items-center space-x-2 text-sm text-gray-600'>
                  <Loader className='h-4 w-4 animate-spin text-blue-500' />
                  <span>{processingStatus}</span>
                </div>
              )}

              {mainviewTimestamps.length > 0 && (
                <div className='text-sm text-gray-600'>
                  <span className='font-medium'>{mainviewTimestamps.length}</span> main view segments detected
                </div>
              )}
            </div>

            <button
              onClick={onProcess}
              disabled={isProcessing}
              className={`flex items-center gap-2 rounded-lg px-5 py-2 font-medium transition-colors ${
                isProcessing
                  ? 'cursor-not-allowed bg-gray-200 text-gray-500'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader className='h-4 w-4 animate-spin' />
                  Processing...
                </>
              ) : (
                <>
                  <Play className='h-4 w-4' />
                  Process Video
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreprocessingPage;
