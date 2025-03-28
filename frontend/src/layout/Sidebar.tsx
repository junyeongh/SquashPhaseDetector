import { useState, createContext, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen, Upload, Video } from 'lucide-react';
import { FileInfo } from '@/services/api/video';

export type PipelineStep =
  | 'upload'
  | 'preprocess'
  | 'segmentation'
  | 'pose'
  | 'game_state'
  | 'export';

// Create context for the sidebar state
interface SidebarContextType {
  collapsed: boolean;
  toggleCollapsed: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  toggleCollapsed: () => {},
});

// Hook to use sidebar context
export const useSidebar = () => useContext(SidebarContext);

interface SidebarProps {
  uploadedFiles?: FileInfo[];
}

const Sidebar: React.FC<SidebarProps> = ({ uploadedFiles = [] }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  // Toggle sidebar collapsed state
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <SidebarContext.Provider value={{ collapsed, toggleCollapsed }}>
      <aside
        className='flex h-screen flex-col bg-white shadow-sm transition-all'
        style={{
          width: collapsed
            ? 'var(--spacing-sidebar-collasped)'
            : 'var(--spacing-sidebar)',
        }}
      >
        {/* Collapse button */}
        <div className='flex h-12 items-center justify-end border-b border-gray-200 px-4'>
          <button
            onClick={toggleCollapsed}
            className='group cursor-pointer rounded-full p-1 hover:bg-gray-100'
            aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? (
              <PanelLeftOpen size={18} className='text-gray-500' />
            ) : (
              <PanelLeftClose size={18} className='text-gray-500' />
            )}
          </button>
        </div>

        {/* Sidebar content */}
        <div className='flex flex-1 flex-col overflow-hidden'>
          <div className='scrollable flex-grow overflow-y-auto'>
            {/* Upload New Video Button */}
            <div className='border-b border-gray-200 px-2 py-2'>
              <Link
                to='/'
                className={`flex w-full items-center gap-3 rounded p-2 text-left no-underline transition-colors ${location.pathname === '/' ? 'bg-gray-200 text-gray-900' : 'text-gray-700 hover:bg-gray-100'}`}
                style={{ textDecoration: 'none' }}
              >
                <span className='flex flex-shrink-0 items-center justify-center'>
                  <Upload size={16} className='text-gray-500' />
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
                  <div className='px-4 py-1 text-xs font-medium text-gray-500'>
                    Recent Uploads
                  </div>
                )}
                <div className='space-y-1 px-2'>
                  {uploadedFiles.slice(0, 5).map((file, index) => (
                    <Link
                      key={index}
                      to={`/${file.uuid}`}
                      className={`flex w-full items-center gap-3 rounded p-2 text-left no-underline transition-colors ${location.pathname === `/${file.uuid}` ? 'bg-gray-200 text-gray-900' : 'text-gray-700 hover:bg-gray-100'}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <span className='flex flex-shrink-0 items-center justify-center'>
                        <Video size={14} className='text-gray-500' />
                      </span>
                      {!collapsed && (
                        <div className='flex flex-col overflow-hidden'>
                          <span className='truncate text-xs'>
                            {file.filename}
                          </span>
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
          </div>
        </div>
      </aside>
    </SidebarContext.Provider>
  );
};

export default Sidebar;
