import { ReactNode } from 'react';
import { useSidebar } from '@/layout/Sidebar';

interface MainContentProps {
  children: ReactNode;
}

const MainContent: React.FC<MainContentProps> = ({ children }) => {
  const { collapsed } = useSidebar();

  return (
    <div className="flex-1 h-screen overflow-auto bg-gray-100">
      <div className="p-6 h-full">
        {children}
      </div>
    </div>
  );
};

export default MainContent;
