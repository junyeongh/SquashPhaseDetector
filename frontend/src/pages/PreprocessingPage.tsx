import { useState, useEffect } from 'react';
import VideoPlayer from '@/components/video/VideoPlayer';
import VideoToggle from '@/components/video/VideoToggle';

interface ProcessingPageProps {
  originalVideoUrl: string;
  processedVideoUrl?: string;
  isProcessing: boolean;
  onProcess: () => void;
  processingStatus: string;
}

const PreprocessingPage: React.FC<ProcessingPageProps> = ({
  originalVideoUrl,
  processedVideoUrl,
  isProcessing,
  onProcess,
  processingStatus,
}) => {
  const [showProcessed, setShowProcessed] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);

  // Reset to original view if processed video becomes unavailable
  useEffect(() => {
    if (showProcessed && !processedVideoUrl) {
      setShowProcessed(false);
    }
  }, [processedVideoUrl, showProcessed]);

  // Handle video toggle
  const handleToggle = (processed: boolean) => {
    if (processed && !processedVideoUrl) return;
    setShowProcessed(processed);
  };

  return (
    <div className='flex h-full flex-col'>
      <h1 className='mb-3 text-2xl font-bold'>Video Preprocessing</h1>

      <div className='flex flex-1 flex-col overflow-hidden rounded-lg bg-white shadow-md'>
        {/* Video Toggle */}
        <VideoToggle
          isProcessed={showProcessed}
          onToggle={handleToggle}
          isProcessingComplete={!!processedVideoUrl}
        />

        {/* Video Player */}
        <div className='flex flex-1 items-center justify-center bg-gray-50 p-4'>
          <VideoPlayer
            src={
              showProcessed && processedVideoUrl
                ? processedVideoUrl
                : originalVideoUrl
            }
            onFrameChange={setCurrentFrame}
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
                <p className='text-sm text-blue-600'>{processingStatus}</p>
              )}
            </div>

            <button
              onClick={onProcess}
              disabled={isProcessing}
              className={`rounded-md px-5 py-2 font-medium transition-colors ${
                isProcessing
                  ? 'cursor-not-allowed bg-gray-300 text-gray-500'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
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
