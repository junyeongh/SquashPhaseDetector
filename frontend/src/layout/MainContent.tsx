import { ReactNode } from 'react';
import { useSidebar } from '@/layout/Sidebar';

interface MainContentProps {
  children: ReactNode;
}

const MainContent: React.FC<MainContentProps> = ({ children }) => {
  const { collapsed } = useSidebar();

  return (
    <div
      className='h-screen overflow-auto bg-gray-100'
      style={{
        width: `calc(100vw - ${collapsed ? '60px' : '240px'})`,
      }}
    >
      <div className='h-full p-6'>{children}</div>
    </div>
  );
};

export default MainContent;
