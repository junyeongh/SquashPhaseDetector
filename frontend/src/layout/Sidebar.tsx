import { useState, createContext, useContext } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Upload,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';
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
        className='h-screen flex-shrink-0 transition-all duration-300 ease-in-out'
        style={{
          width: collapsed
            ? 'var(--spacing-sidebar-collasped)'
            : 'var(--spacing-sidebar)',
        }}
      >
        <div className='flex h-full flex-col bg-gradient-to-b from-gray-800 to-gray-900 text-gray-100 shadow-lg'>
          {/* Sidebar Header */}
          <div className='flex items-center justify-between border-b border-gray-700 bg-gray-900 p-4'>
            <button
              onClick={toggleCollapsed}
              className='rounded p-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors'
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            </button>
            {!collapsed && (
              <span className='text-sm font-semibold uppercase tracking-wider'>
                Squash Analyzer
              </span>
            )}
          </div>

          <div className='flex-grow overflow-y-auto'>
            {/* Upload New Video Button */}
            <div className='border-b border-gray-700 px-2 py-4'>
              <Link
                to='/'
                className={`flex w-full items-center gap-3 rounded-lg p-3 text-left text-gray-200 no-underline transition-colors
                  ${location.pathname === '/' ? 'bg-blue-600 shadow-md' : 'hover:bg-gray-700'}`}
                style={{ textDecoration: 'none' }}
              >
                <span
                  className={`flex items-center justify-center flex-shrink-0 ${collapsed ? 'w-full' : ''}`}
                >
                  <Upload size={20} className="text-blue-300" />
                </span>
                {!collapsed && (
                  <span className='truncate font-medium'>Upload New Video</span>
                )}
              </Link>
            </div>

            {/* Recent Uploads Section */}
            {uploadedFiles.length > 0 && (
              <div className='py-3'>
                {!collapsed && (
                  <h3 className='mb-2 px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider'>
                    Recent Uploads
                  </h3>
                )}
                <div className='space-y-1 px-2'>
                  {uploadedFiles.slice(0, 5).map((file, index) => (
                    <Link
                      key={index}
                      to={`/${file.uuid}`}
                      className={`flex w-full items-center gap-3 rounded-lg p-3 text-left text-gray-300 no-underline transition-colors
                        ${location.pathname === `/${file.uuid}` ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <span
                        className={`text-xl ${collapsed ? 'flex w-full justify-center' : 'flex-shrink-0'}`}
                      >
                        🎬
                      </span>
                      {!collapsed && (
                        <div className="flex flex-col overflow-hidden">
                          <span className='truncate text-sm'>{file.filename}</span>
                          <span className='truncate text-xs text-gray-400'>
                            {new Date(file.created * 1000).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Processing Stages - Only show when on a video detail page */}
            {isVideoDetailPage && (
              <div className='py-3'>
                {!collapsed && (
                  <h3 className='mb-2 px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider'>
                    Processing Steps
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
                        className={`flex w-full items-center gap-3 rounded-lg p-3 text-left text-gray-300 transition-colors
                          ${isActive
                            ? 'bg-blue-600 shadow-md'
                            : isCompleted
                              ? 'bg-gray-700 border-l-4 border-green-500'
                              : !canBeActive
                                ? 'cursor-not-allowed opacity-50 hover:bg-gray-800/50'
                                : 'hover:bg-gray-700'}`}
                      >
                        <span
                          className={`flex items-center justify-center text-xl ${collapsed ? 'w-full' : 'flex-shrink-0'}`}
                        >
                          {stage.icon}
                        </span>

                        {!collapsed && (
                          <>
                            <span className='flex-grow truncate'>{stage.label}</span>
                            {isCompleted && (
                              <CheckCircle size={16} className="text-green-400" />
                            )}
                            {!isCompleted && isActive && (
                              <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse"></div>
                            )}
                            {!isCompleted && !isActive && canBeActive && (
                              <ChevronRight size={16} className="text-gray-400" />
                            )}
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-gray-700 bg-gray-900/50">
            <div className="flex items-center justify-center text-xs text-gray-400">
              {!collapsed ? 'Squash Phase Detector v1.0' : 'v1.0'}
            </div>
          </div>
        </div>
      </div>
    </SidebarContext.Provider>
  );
};

export default Sidebar;
