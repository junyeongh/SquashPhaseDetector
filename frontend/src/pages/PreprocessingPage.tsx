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
      <h1 className='mb-2 text-lg font-medium text-gray-800'>
        Video Preprocessing
      </h1>
      <p className='mb-4 text-xs text-gray-500'>
        Analyze the video to detect main view angles and prepare it for player
        segmentation.
      </p>

      <div className='flex flex-1 flex-col overflow-hidden'>
        {/* Video Player Container */}
        <div className='overflow-hidden rounded-md border border-gray-200 bg-white'>
          <ReactPlayerWrapper
            src={originalVideoUrl}
            onFrameChange={setCurrentFrame}
            mainviewTimestamps={mainviewTimestamps}
          />
        </div>

        {/* Processing Controls */}
        <div className='mt-4 rounded-md border border-gray-200 bg-white p-3'>
          <div className='flex items-center justify-between'>
            <div className='space-y-1'>
              <div className='flex items-center space-x-2'>
                <div className='text-xs text-gray-500'>Current Frame:</div>
                <div className='rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700'>
                  {currentFrame}
                </div>
              </div>

              {isProcessing && (
                <div className='flex items-center space-x-2 text-xs text-gray-500'>
                  <Loader className='h-3 w-3 animate-spin text-gray-500' />
                  <span>{processingStatus}</span>
                </div>
              )}

              {mainviewTimestamps.length > 0 && (
                <div className='text-xs text-gray-500'>
                  <span className='font-medium'>
                    {mainviewTimestamps.length}
                  </span>{' '}
                  main view segments detected
                </div>
              )}
            </div>

            <button
              onClick={onProcess}
              disabled={isProcessing}
              className={`flex items-center gap-2 rounded px-4 py-1.5 text-sm transition-colors ${
                isProcessing
                  ? 'cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400'
                  : 'border border-gray-300 bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader className='h-3 w-3 animate-spin' />
                  Processing...
                </>
              ) : (
                <>
                  <Play className='h-3 w-3' />
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
