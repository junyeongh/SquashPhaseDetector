import { useState, useEffect } from 'react';
import VideoPlayer from '../components/video/VideoPlayer';
import VideoToggle from '../components/video/VideoToggle';

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
    <div className="h-full w-full flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Video Preprocessing</h1>
      
      <div className="flex-1 flex flex-col bg-white rounded-lg shadow-lg overflow-hidden w-full">
        {/* Section A: Video Toggle */}
        <VideoToggle 
          isProcessed={showProcessed}
          onToggle={handleToggle}
          isProcessingComplete={!!processedVideoUrl}
        />
        
        {/* Video Player */}
        <div className="flex-1 p-6">
          <VideoPlayer 
            src={showProcessed && processedVideoUrl ? processedVideoUrl : originalVideoUrl}
            onFrameChange={setCurrentFrame}
          />
        </div>
        
        {/* Processing Controls */}
        <div className="p-4 border-t">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-base text-gray-700 font-medium">Current Frame: {currentFrame}</p>
              {isProcessing && (
                <p className="text-base text-blue-700 font-medium">{processingStatus}</p>
              )}
            </div>
            
            <button
              onClick={onProcess}
              disabled={isProcessing}
              className={`px-4 py-2 rounded ${
                isProcessing
                  ? 'bg-gray-400 cursor-not-allowed text-gray-700'
                  : 'bg-blue-600 hover:bg-blue-700 text-white font-medium'
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
