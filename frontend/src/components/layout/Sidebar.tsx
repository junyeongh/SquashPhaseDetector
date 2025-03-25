import { useState } from 'react';

export type PipelineStep = 'upload' | 'preprocess' | 'segmentation' | 'pose' | 'gamestate' | 'export';

interface SidebarProps {
  activeStep: PipelineStep;
  onStepChange: (step: PipelineStep) => void;
  completedSteps: Set<PipelineStep>;
}

const Sidebar: React.FC<SidebarProps> = ({ activeStep, onStepChange, completedSteps }) => {
  const [collapsed, setCollapsed] = useState(false);

  const steps: { id: PipelineStep; label: string; icon: string }[] = [
    { id: 'upload', label: 'Upload Video', icon: '📤' },
    { id: 'preprocess', label: 'Preprocessing', icon: '🔍' },
    { id: 'segmentation', label: 'Player Segmentation', icon: '👥' },
    { id: 'pose', label: 'Pose Detection', icon: '🏃' },
    { id: 'gamestate', label: 'Game State Analysis', icon: '🎮' },
    { id: 'export', label: 'Export Results', icon: '📊' },
  ];

  return (
    <div
      className={`bg-gray-800 text-black transition-all duration-300 h-screen ${
        collapsed ? 'w-16' : 'w-72'
      }`}
    >
      <div className="p-4 flex justify-between items-center border-b border-gray-700">
        {/* {!collapsed && <h1 className="font-bold text-lg">Squash Analyzer</h1>} */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded hover:bg-gray-700"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <div className="py-4">
        {steps.map((step) => {
          const isCompleted = completedSteps.has(step.id);
          const isActive = activeStep === step.id;
          const isDisabled = !isCompleted && !isActive && step.id !== 'upload';

          // Determine if this step should be enabled - either it's completed, active, or the next available step
          const canBeActive = isCompleted || isActive ||
            steps.findIndex(s => s.id === step.id) ===
            Math.min(
              steps.findIndex(s => s.id === activeStep) + 1,
              steps.length - 1
            );

          return (
            <button
              key={step.id}
              onClick={() => canBeActive && onStepChange(step.id)}
              disabled={!canBeActive}
              className={`w-full text-left p-4 flex items-center gap-3 ${
                isActive
                  ? 'bg-blue-600'
                  : isCompleted
                  ? 'bg-green-700 bg-opacity-20 hover:bg-green-700 hover:bg-opacity-30'
                  : isDisabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-700'
              } transition-colors`}
            >
              <span className="text-xl">{step.icon}</span>
              {!collapsed && (
                <div className="flex items-center gap-2">
                  <span>{step.label}</span>
                  {isCompleted && <span className="text-green-400">✓</span>}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
