import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle, Circle, Loader, ListChecks, ChevronDown } from 'lucide-react';
import { ProcessingStage, StageConfig } from '../types';

interface StageHeaderProps {
  currentStage: StageConfig;
  currentStageIndex: number;
  totalStages: number;
  activeStage: ProcessingStage;
  completedStages: Set<ProcessingStage>;
  isProcessing: boolean;
  onStageSelect?: (stage: ProcessingStage) => void;
  allStages?: StageConfig[];
}

const StageHeader: React.FC<StageHeaderProps> = ({
  currentStage,
  currentStageIndex,
  totalStages,
  activeStage,
  completedStages,
  isProcessing,
  onStageSelect,
  allStages = [],
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStageSelect = (stage: ProcessingStage) => {
    onStageSelect?.(stage);
    setIsDropdownOpen(false);
  };

  return (
    <>
      {/* Stages dropdown */}
      <div className='relative mb-3' ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={isProcessing}
          className='flex w-full items-center justify-between gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100'
          aria-expanded={isDropdownOpen}
          aria-haspopup='true'
        >
          <div className='flex items-center gap-2'>
            <ListChecks className='h-4 w-4' />
            <span>View All Stages</span>
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown menu */}
        {isDropdownOpen && (
          <div className='absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white py-1 shadow-lg'>
            {allStages.map((stage, index) => (
              <button
                key={stage.id}
                onClick={() => handleStageSelect(stage.id)}
                disabled={isProcessing}
                className='flex w-full items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-100'
              >
                <div className='flex items-center gap-2'>
                  <div className='flex h-5 w-5 items-center justify-center rounded-full border border-gray-300'>
                    <span className='text-xs'>{index + 1}</span>
                  </div>
                  <span>{stage.label}</span>
                </div>
                {completedStages.has(stage.id) ? (
                  <CheckCircle className='h-4 w-4 text-green-500' />
                ) : stage.id === activeStage ? (
                  <div className='h-2 w-2 rounded-full bg-blue-500'></div>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Current stage information */}
      <div className='mb-2'>
        <div className='mb-1 flex items-center gap-2'>
          <div className='flex h-6 w-6 items-center justify-center rounded-full bg-blue-100'>
            <span className='text-xs font-medium text-blue-700'>{currentStageIndex + 1}</span>
          </div>
          <span className='text-sm font-medium'>
            Stage {currentStageIndex + 1}/{totalStages}: {currentStage.label}
          </span>
        </div>

        <div className='ml-8'>
          <p className='mb-3 text-xs text-gray-600'>{currentStage.description}</p>

          {/* Stage status */}
          <div className='mb-4 flex items-center gap-2 text-xs text-gray-500'>
            {completedStages.has(activeStage) ? (
              <>
                <CheckCircle className='h-3.5 w-3.5 text-green-500' />
                <span className='text-green-600'>Completed</span>
              </>
            ) : isProcessing ? (
              <>
                <Loader className='h-3.5 w-3.5 animate-spin text-blue-500' />
                <span className='text-blue-600'>Processing</span>
              </>
            ) : (
              <>
                <Circle className='h-3.5 w-3.5 text-gray-400' />
                <span>Ready to process</span>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default StageHeader;
