interface VideoToggleProps {
  isProcessed: boolean;
  onToggle: (showProcessed: boolean) => void;
  isProcessingComplete: boolean;
}

const VideoToggle: React.FC<VideoToggleProps> = ({ 
  isProcessed, 
  onToggle, 
  isProcessingComplete 
}) => {
  return (
    <div className="flex justify-center items-center bg-gray-100 py-3 border-b">
      <div className="inline-flex bg-gray-200 p-1 rounded-full shadow-sm">
        <button
          className={`px-6 py-2 rounded-full font-medium transition-colors ${
            !isProcessed 
              ? 'bg-white text-gray-800 shadow' 
              : 'bg-transparent text-gray-600 hover:text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => onToggle(false)}
        >
          Original
        </button>
        <button
          className={`px-6 py-2 rounded-full font-medium transition-colors ${
            isProcessed 
              ? 'bg-white text-gray-800 shadow' 
              : 'bg-transparent text-gray-600 hover:text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => onToggle(true)}
          disabled={!isProcessingComplete}
        >
          Processed
        </button>
      </div>
    </div>
  );
};

export default VideoToggle;
