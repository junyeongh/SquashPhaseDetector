interface VideoToggleProps {
  isProcessed: boolean;
  onToggle: (showProcessed: boolean) => void;
  isProcessingComplete: boolean;
}

const VideoToggle: React.FC<VideoToggleProps> = ({
  isProcessed,
  onToggle,
  isProcessingComplete,
}) => {
  return (
    <div className='flex items-center justify-center border-b bg-gray-100 py-3'>
      <div className='inline-flex rounded-full bg-gray-200 p-1 shadow-sm'>
        <button
          className={`rounded-full px-6 py-2 font-medium transition-colors ${
            !isProcessed
              ? 'bg-white text-gray-800 shadow'
              : 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-700'
          }`}
          onClick={() => onToggle(false)}
        >
          Original
        </button>
        <button
          className={`rounded-full px-6 py-2 font-medium transition-colors ${
            isProcessed
              ? 'bg-white text-gray-800 shadow'
              : 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-700'
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
