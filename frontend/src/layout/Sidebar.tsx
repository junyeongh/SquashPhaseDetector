import { useState, useEffect, createContext, useContext } from 'react';

export type PipelineStep =
  | 'upload'
  | 'preprocess'
  | 'segmentation'
  | 'pose'
  | 'game_state'
  | 'export';

interface SidebarContextType {
  collapsed: boolean;
  toggleCollapsed: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  toggleCollapsed: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

interface SidebarProps {
  activeStep: PipelineStep;
  onStepChange: (step: PipelineStep) => void;
  completedSteps: Set<PipelineStep>;
}

const SIDEBAR_WIDTH = '240px';
const SIDEBAR_COLLAPSED_WIDTH = '60px';

const Sidebar: React.FC<SidebarProps> = ({
  activeStep,
  onStepChange,
  completedSteps,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  // Toggle sidebar collapsed state
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const steps: { id: PipelineStep; label: string; icon: string }[] = [
    { id: 'upload', label: 'Upload Video', icon: '📤' },
    { id: 'preprocess', label: 'Preprocessing', icon: '🔍' },
    { id: 'segmentation', label: 'Player Segmentation', icon: '👥' },
    { id: 'pose', label: 'Pose Detection', icon: '🏃' },
    { id: 'game_state', label: 'Game State Analysis', icon: '🎮' },
    { id: 'export', label: 'Export Results', icon: '📊' },
  ];

  return (
    <SidebarContext.Provider value={{ collapsed, toggleCollapsed }}>
      <div
        className='h-screen flex-shrink-0 transition-all duration-300 ease-in-out'
        style={{
          width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
        }}
      >
        <div className='flex h-full flex-col bg-gray-800 text-white'>
          <div className='flex items-center justify-between border-b border-gray-700 p-4'>
            {/* {!collapsed && <h1 className="font-bold text-lg">Squash Analyzer</h1>} */}
            <button
              onClick={toggleCollapsed}
              className='rounded p-2 text-gray-400 hover:bg-gray-700 hover:text-white'
            >
              {collapsed ? '→' : '←'}
            </button>
          </div>

          <div className='flex-grow overflow-y-auto'>
            <div className='py-4'>
              {steps.map((step) => {
                const isCompleted = completedSteps.has(step.id);
                const isActive = activeStep === step.id;

                // Determine if this step should be enabled - either it's completed, active, or the next available step
                const canBeActive =
                  isCompleted ||
                  isActive ||
                  steps.findIndex((s) => s.id === step.id) ===
                    Math.min(
                      steps.findIndex((s) => s.id === activeStep) + 1,
                      steps.length - 1
                    );

                return (
                  <button
                    key={step.id}
                    onClick={() => canBeActive && onStepChange(step.id)}
                    disabled={!canBeActive}
                    className={`flex w-full items-center gap-3 p-4 text-left transition-colors ${
                      isActive
                        ? 'bg-blue-600'
                        : isCompleted
                          ? 'bg-opacity-20 hover:bg-opacity-30 bg-green-700 hover:bg-green-700'
                          : !canBeActive
                            ? 'cursor-not-allowed opacity-50'
                            : 'hover:bg-gray-700'
                    }`}
                  >
                    <span className='flex-shrink-0 text-xl'>{step.icon}</span>
                    {!collapsed && (
                      <div className='flex items-center gap-2 overflow-hidden'>
                        <span className='truncate'>{step.label}</span>
                        {isCompleted && (
                          <span className='flex-shrink-0 text-green-400'>
                            ✓
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </SidebarContext.Provider>
  );
};

export default Sidebar;
