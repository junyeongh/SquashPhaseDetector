import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReactPlayerWrapper from '@/components/video/VideoPlayer';
import { getMainviewTimestamps, MainviewTimestamp } from '@/services/api/video';

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
      <h1 className='mb-3 text-2xl font-bold'>Video Preprocessing</h1>

      <div className='flex flex-1 flex-col overflow-hidden rounded-lg bg-white shadow-md'>
        {/* Video Player */}
        <div className='flex flex-1 items-center justify-center bg-gray-50 p-4'>
          <ReactPlayerWrapper
            src={originalVideoUrl}
            onFrameChange={setCurrentFrame}
            mainviewTimestamps={mainviewTimestamps}
          />
        </div>

        {/* Processing Controls */}
        <div className='border-t bg-white p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600'>
                Current Frame: {currentFrame}
              </p>
              {isProcessing && (
                <p className='text-sm text-gray-600'>{processingStatus}</p>
              )}
            </div>

            <button
              onClick={onProcess}
              disabled={isProcessing}
              className={`rounded px-5 py-2 font-medium ${
                isProcessing
                  ? 'cursor-not-allowed bg-gray-300 text-gray-500'
                  : 'bg-gray-500 text-gray-200'
              }`}
            >
              {isProcessing ? 'Processing...' : 'Process Video'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreprocessingPage;
