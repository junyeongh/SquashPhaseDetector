import { useState, useEffect, createContext, useContext } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen, Upload, Home } from 'lucide-react';
import { FileInfo } from '@/services/api/video';

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
  uploadedFiles?: FileInfo[];
}

const Sidebar: React.FC<SidebarProps> = ({
  activeStep,
  onStepChange,
  completedSteps,
  uploadedFiles = [],
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const { uuid } = useParams<{ uuid?: string }>();
  const location = useLocation();

  // Toggle sidebar collapsed state
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  // Processing stages for the video detail page
  const processingStages = [
    {
      id: 'preprocess' as PipelineStep,
      label: 'Preprocessing',
      icon: '🔍',
    },
    {
      id: 'segmentation' as PipelineStep,
      label: 'Player Segmentation',
      icon: '👥',
    },
    {
      id: 'pose' as PipelineStep,
      label: 'Pose Detection',
      icon: '🏃',
    },
    {
      id: 'game_state' as PipelineStep,
      label: 'Game State Analysis',
      icon: '🎮',
    },
    {
      id: 'export' as PipelineStep,
      label: 'Export Results',
      icon: '📊',
    },
  ];

  // Check if we're on a video detail page
  const isVideoDetailPage = !!uuid;

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
          {/* Sidebar Header */}
          <div className='flex items-center justify-between border-b border-gray-600 p-4'>
            <button
              onClick={toggleCollapsed}
              className='rounded p-2 text-gray-400'
            >
              {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            </button>
          </div>

          <div className='flex-grow overflow-y-auto'>
            {/* Upload New Video Button */}
            <div className='border-b border-gray-600 px-2 py-2'>
              <Link
                to='/'
                className='flex w-full items-center gap-3 rounded bg-gray-600 p-3 text-left text-gray-300 no-underline hover:bg-gray-500'
                style={{ textDecoration: 'none' }}
              >
                <span
                  className={`text-xl ${collapsed ? 'flex w-full justify-center' : 'flex-shrink-0'}`}
                >
                  <Upload size={20} />
                </span>
                {!collapsed && (
                  <span className='truncate'>Upload New Video</span>
                )}
              </Link>
            </div>

            {/* Recent Uploads Section */}
            {uploadedFiles.length > 0 && (
              <div className='py-2'>
                {!collapsed && (
                  <h3 className='px-4 py-2 text-sm font-semibold text-gray-400 uppercase'>
                    Recent Uploads
                  </h3>
                )}
                <div className='space-y-1 px-2'>
                  {uploadedFiles.slice(0, 5).map((file, index) => (
                    <Link
                      key={index}
                      to={`/${file.uuid}`}
                      className={`flex w-full items-center gap-3 rounded p-3 text-left text-gray-300 no-underline hover:bg-gray-600 ${
                        location.pathname === `/${file.uuid}`
                          ? 'bg-gray-500'
                          : ''
                      }`}
                      style={{ textDecoration: 'none' }}
                    >
                      <span
                        className={`text-xl ${collapsed ? 'flex w-full justify-center' : 'flex-shrink-0'}`}
                      >
                        🎬
                      </span>
                      {!collapsed && (
                        <span className='truncate'>{file.filename}</span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Processing Stages - Only show when on a video detail page */}
            {isVideoDetailPage && (
              <div className='py-2'>
                {!collapsed && (
                  <h3 className='px-4 py-2 text-sm font-semibold text-gray-400 uppercase'>
                    Processing Stages
                  </h3>
                )}
                <div className='space-y-1 px-2'>
                  {processingStages.map((stage) => {
                    const isCompleted = completedSteps.has(stage.id);
                    const isActive = activeStep === stage.id;

                    // Determine if this stage should be enabled
                    const canBeActive =
                      isCompleted ||
                      isActive ||
                      processingStages.findIndex((s) => s.id === stage.id) ===
                        Math.min(
                          processingStages.findIndex(
                            (s) => s.id === activeStep
                          ) + 1,
                          processingStages.length - 1
                        );

                    return (
                      <button
                        key={stage.id}
                        onClick={() => {
                          if (canBeActive) {
                            onStepChange(stage.id);
                          }
                        }}
                        disabled={!canBeActive}
                        className={`flex w-full items-center gap-3 rounded p-3 text-left text-gray-300 ${
                          isActive
                            ? 'bg-gray-500'
                            : isCompleted
                              ? 'bg-gray-600'
                              : !canBeActive
                                ? 'cursor-not-allowed opacity-50'
                                : 'hover:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`text-xl ${collapsed ? 'flex w-full justify-center' : 'flex-shrink-0'}`}
                        >
                          {stage.icon}
                        </span>
                        {!collapsed && (
                          <div className='flex items-center gap-2 overflow-hidden'>
                            <span className='truncate'>{stage.label}</span>
                            {isCompleted && (
                              <span className='flex-shrink-0 text-gray-400'>
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
            )}
          </div>
        </div>
      </div>
    </SidebarContext.Provider>
  );
};

export default Sidebar;
