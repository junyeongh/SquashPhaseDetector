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
    <div className="flex justify-center items-center bg-gray-200 p-3 rounded-t-lg border-b">
      <div className="flex bg-gray-200 p-1 rounded-full">
        <button
          className={`px-4 py-1 rounded-full transition-colors ${
            !isProcessed 
              ? 'bg-blue-600 text-white font-medium' 
              : 'bg-transparent text-gray-800 hover:bg-gray-300 font-medium'
          }`}
          onClick={() => onToggle(false)}
        >
          Original
        </button>
        <button
          className={`px-4 py-1 rounded-full transition-colors ${
            isProcessed 
              ? 'bg-blue-600 text-white font-medium' 
              : 'bg-transparent text-gray-800 hover:bg-gray-300 font-medium'
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
