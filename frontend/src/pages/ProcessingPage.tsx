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

const ProcessingPage: React.FC<ProcessingPageProps> = ({
  originalVideoUrl,
  processedVideoUrl,
  isProcessing,
  onProcess,
  processingStatus
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
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-3">Video Preprocessing</h1>

      <div className="flex-1 flex flex-col bg-white rounded-lg shadow-md overflow-hidden">
        {/* Video Toggle */}
        <VideoToggle
          isProcessed={showProcessed}
          onToggle={handleToggle}
          isProcessingComplete={!!processedVideoUrl}
        />

        {/* Video Player */}
        <div className="flex-1 p-4 flex items-center justify-center bg-gray-50">
          <VideoPlayer
            src={showProcessed && processedVideoUrl ? processedVideoUrl : originalVideoUrl}
            onFrameChange={setCurrentFrame}
          />
        </div>

        {/* Processing Controls */}
        <div className="p-4 border-t bg-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Current Frame: {currentFrame}</p>
              {isProcessing && (
                <p className="text-sm text-blue-600">{processingStatus}</p>
              )}
            </div>

            <button
              onClick={onProcess}
              disabled={isProcessing}
              className={`px-5 py-2 rounded-md font-medium transition-colors ${
                isProcessing
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
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

export default ProcessingPage;
