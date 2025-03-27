import { MainviewTimestamp } from '@/services/api/video';

interface MainviewTimelineProps {
  timestamps: MainviewTimestamp[];
  currentTime: number;
  duration: number;
  onSeek?: (time: number) => void;
}

const MainviewTimeline: React.FC<MainviewTimelineProps> = ({
  timestamps,
  currentTime,
  duration,
  onSeek,
}) => {
  // Calculate position of the playhead
  const playheadPosition = (currentTime / duration) * 100;

  return (
    <div className='relative h-8 w-full overflow-hidden rounded bg-gray-200'>
      {/* Timeline segments */}
      {timestamps.map((segment, index) => {
        const startPercent = (segment.start / duration) * 100;
        const widthPercent = ((segment.end - segment.start) / duration) * 100;

        return (
          <div
            key={index}
            className='absolute h-full bg-blue-200'
            style={{
              left: `${startPercent}%`,
              width: `${widthPercent}%`,
            }}
            onClick={() => onSeek && onSeek(segment.start)}
          />
        );
      })}

      {/* Playhead */}
      <div
        className='absolute top-0 h-full w-1 bg-gray-600'
        style={{ left: `${playheadPosition}%` }}
      />
    </div>
  );
};

export default MainviewTimeline;
