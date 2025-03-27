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
    <div className='flex items-center justify-center border-b bg-gray-200 py-3'>
      <div className='inline-flex rounded bg-gray-300 p-1'>
        <button
          className={`rounded px-6 py-2 ${
            !isProcessed
              ? 'bg-gray-400 text-gray-700'
              : 'bg-transparent text-gray-600'
          }`}
          onClick={() => onToggle(false)}
        >
          Original
        </button>
        <button
          className={`rounded px-6 py-2 ${
            isProcessed
              ? 'bg-gray-400 text-gray-700'
              : 'bg-transparent text-gray-600'
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
