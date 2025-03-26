import { useState, useEffect, createContext, useContext } from 'react';
import { Link } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

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

  const steps: {
    id: PipelineStep;
    label: string;
    icon: string;
    path: string;
  }[] = [
    { id: 'upload', label: 'Upload Video', icon: '📤', path: '/' },
    {
      id: 'preprocess',
      label: 'Preprocessing',
      icon: '🔍',
      path: '/preprocess',
    },
    {
      id: 'segmentation',
      label: 'Player Segmentation',
      icon: '👥',
      path: '/segmentation',
    },
    { id: 'pose', label: 'Pose Detection', icon: '🏃', path: '/pose' },
    {
      id: 'game_state',
      label: 'Game State Analysis',
      icon: '🎮',
      path: '/game_state',
    },
    { id: 'export', label: 'Export Results', icon: '📊', path: '/export' },
  ];

  return (
    <SidebarContext.Provider value={{ collapsed, toggleCollapsed }}>
      <div
        className='h-screen flex-shrink-0'
        style={{
          width: collapsed
            ? 'var(--spacing-sidebar-collasped)'
            : 'var(--spacing-sidebar)',
        }}
      >
        <div className='flex h-full flex-col bg-gray-700 text-gray-300'>
          <div className='flex items-center justify-between border-b border-gray-600 p-4'>
            {/* {!collapsed && <h1 className="font-bold text-lg">Squash Analyzer</h1>} */}
            <button
              onClick={toggleCollapsed}
              className='text-gray-400 rounded p-2'
            >
              {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
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
                  <Link
                    key={step.id}
                    to={canBeActive ? step.path : '#'}
                    onClick={(e) => {
                      if (!canBeActive) {
                        e.preventDefault();
                        return;
                      }
                      onStepChange(step.id);
                    }}
                    className={`flex w-full items-center gap-3 p-4 text-left text-gray-300 no-underline ${
                      isActive
                        ? 'bg-gray-500'
                        : isCompleted
                          ? 'bg-gray-600'
                          : !canBeActive
                            ? 'cursor-not-allowed opacity-50'
                            : ''
                    }`}
                    style={{ textDecoration: 'none' }}
                  >
                    <span
                      className={`text-xl ${collapsed ? 'flex w-full justify-center' : 'flex-shrink-0'}`}
                    >
                      {step.icon}
                    </span>
                    {!collapsed && (
                      <div className='flex items-center gap-2 overflow-hidden'>
                        <span className='truncate'>{step.label}</span>
                        {isCompleted && (
                          <span className='flex-shrink-0 text-gray-400'>
                            ✓
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
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
