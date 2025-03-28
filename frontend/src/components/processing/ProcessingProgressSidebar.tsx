import React from 'react';
import { CheckCircle, Circle, Loader } from 'lucide-react';

// Define the types of processing stages
export type ProcessingStage =
  | 'preprocess'
  | 'segmentation'
  | 'pose'
  | 'game_state'
  | 'export';

interface ProcessingProgressSidebarProps {
  activeStage: ProcessingStage;
  completedStages: Set<ProcessingStage>;
  isProcessing: boolean;
  processingStatus: string;
}

const ProcessingProgressSidebar: React.FC<ProcessingProgressSidebarProps> = ({
  activeStage,
  completedStages,
  isProcessing,
  processingStatus,
}) => {
  // Processing stages definition
  const processingStages = [
    {
      id: 'preprocess' as ProcessingStage,
      label: 'Video Preprocessing',
      description: 'Detect main view angles in the video',
    },
    {
      id: 'segmentation' as ProcessingStage,
      label: 'Player Segmentation',
      description: 'Identify and track player positions',
    },
    {
      id: 'pose' as ProcessingStage,
      label: 'Pose Detection',
      description: 'Detect player body positions and movements',
    },
    {
      id: 'game_state' as ProcessingStage,
      label: 'Game State Analysis',
      description: 'Analyze shots, rallies, and scoring',
    },
    {
      id: 'export' as ProcessingStage,
      label: 'Export Results',
      description: 'Generate final analysis output',
    },
  ];

  return (
    <div className="h-full w-full p-4 border-l border-gray-200">
      <h2 className="text-md font-semibold mb-4">Processing Progress</h2>

      {isProcessing && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-100">
          <div className="flex items-center gap-2 text-blue-700">
            <Loader className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">Processing...</span>
          </div>
          <p className="mt-1 text-xs text-blue-600">{processingStatus}</p>
        </div>
      )}

      <div className="space-y-6">
        {processingStages.map((stage, index) => {
          const isCompleted = completedStages.has(stage.id);
          const isCurrent = activeStage === stage.id;

          return (
            <div key={stage.id} className="relative">
              {/* Connecting line */}
              {index < processingStages.length - 1 && (
                <div
                  className={`absolute left-3 top-6 w-0.5 h-10 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}

              <div className="flex items-start gap-4">
                {/* Status icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {isCompleted ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : isCurrent ? (
                    <div className={`h-6 w-6 rounded-full border-2 ${isProcessing ? 'border-blue-500' : 'border-gray-500'} flex items-center justify-center`}>
                      {isProcessing ? (
                        <Loader className="h-3 w-3 text-blue-500 animate-spin" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-gray-500" />
                      )}
                    </div>
                  ) : (
                    <Circle className="h-6 w-6 text-gray-300" />
                  )}
                </div>

                {/* Stage content */}
                <div className="flex-1">
                  <h3 className={`font-medium text-sm ${
                    isCurrent ? 'text-gray-800' :
                    isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {stage.label}
                  </h3>
                  <p className={`text-xs mt-1 ${
                    isCurrent ? 'text-gray-600' :
                    isCompleted ? 'text-green-500' : 'text-gray-400'
                  }`}>
                    {stage.description}
                  </p>

                  {/* Current stage details */}
                  {isCurrent && !isProcessing && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs border border-gray-100">
                      <p className="text-gray-600">Ready to process.</p>
                      <p className="text-gray-500 mt-1">Click "Process" to begin this stage.</p>
                    </div>
                  )}

                  {/* Completed stage details */}
                  {isCompleted && (
                    <div className="mt-2 text-xs text-green-600">
                      <span className="font-medium">Completed</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProcessingProgressSidebar;
