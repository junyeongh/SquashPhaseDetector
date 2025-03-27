import { useState, createContext, useContext } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Upload,
  CheckCircle,
  ChevronRight,
  Video,
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
    },
    {
      id: 'segmentation' as PipelineStep,
      label: 'Player Segmentation',
    },
    {
      id: 'pose' as PipelineStep,
      label: 'Pose Detection',
    },
    {
      id: 'game_state' as PipelineStep,
      label: 'Game State Analysis',
    },
    {
      id: 'export' as PipelineStep,
      label: 'Export Results',
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
        <div className='flex h-full flex-col bg-gray-900 text-gray-100'>
          {/* Sidebar Header */}
          <div className='flex items-center justify-between border-b border-gray-800 p-4'>
            <button
              onClick={toggleCollapsed}
              className='rounded p-2 text-gray-400 hover:bg-gray-800 hover:text-gray-300 transition-colors'
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            </button>
            {!collapsed && (
              <span className='text-sm font-medium text-gray-300'>
                Squash Analyzer
              </span>
            )}
          </div>

          <div className='flex-grow scrollable overflow-y-auto'>
            {/* Upload New Video Button */}
            <div className='border-b border-gray-800 px-2 py-3'>
              <Link
                to='/'
                className={`flex w-full items-center gap-3 rounded p-3 text-left text-gray-300 no-underline transition-colors
                  ${location.pathname === '/' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
                style={{ textDecoration: 'none' }}
              >
                <span className='flex items-center justify-center flex-shrink-0'>
                  <Upload size={18} className="text-gray-400" />
                </span>
                {!collapsed && (
                  <span className='truncate text-sm'>Upload Video</span>
                )}
              </Link>
            </div>

            {/* Recent Uploads Section */}
            {uploadedFiles.length > 0 && (
              <div className='py-2'>
                {!collapsed && (
                  <div className='px-4 py-2 text-xs text-gray-500'>
                    Recent Uploads
                  </div>
                )}
                <div className='space-y-1 px-2'>
                  {uploadedFiles.slice(0, 5).map((file, index) => (
                    <Link
                      key={index}
                      to={`/${file.uuid}`}
                      className={`flex w-full items-center gap-3 rounded p-2 text-left text-gray-300 no-underline transition-colors
                        ${location.pathname === `/${file.uuid}` ? 'bg-gray-800' : 'hover:bg-gray-800'}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <span className='flex items-center justify-center flex-shrink-0'>
                        <Video size={16} className="text-gray-400" />
                      </span>
                      {!collapsed && (
                        <div className="flex flex-col overflow-hidden">
                          <span className='truncate text-xs'>{file.filename}</span>
                          <span className='truncate text-xs text-gray-500'>
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
              <div className='py-2'>
                {!collapsed && (
                  <div className='px-4 py-2 text-xs text-gray-500'>
                    Processing Steps
                  </div>
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
                        className={`flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm text-gray-300 transition-colors
                          ${isActive
                            ? 'bg-blue-600'
                            : isCompleted
                              ? 'bg-gray-800 border-l-2 border-gray-600'
                              : !canBeActive
                                ? 'cursor-not-allowed opacity-40'
                                : 'hover:bg-gray-800'}`}
                      >
                        {!collapsed && (
                          <>
                            <span className='flex-grow truncate text-xs'>{stage.label}</span>
                            {isCompleted && (
                              <CheckCircle size={14} className="text-gray-400" />
                            )}
                            {!isCompleted && !isActive && canBeActive && (
                              <ChevronRight size={14} className="text-gray-500" />
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
          <div className="p-3 border-t border-gray-800">
            <div className="flex items-center justify-center text-xs text-gray-500">
              {!collapsed ? 'v1.0' : 'v1.0'}
            </div>
          </div>
        </div>
      </div>
    </SidebarContext.Provider>
  );
};

export default Sidebar;
