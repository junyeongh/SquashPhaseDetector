import { ReactNode } from 'react';

interface MainContentProps {
  children: ReactNode;
}

const MainContent: React.FC<MainContentProps> = ({ children }) => {
  return (
    <div className="flex-1 bg-gray-100 p-8 overflow-auto h-screen w-full max-w-full">
      {children}
    </div>
  );
};

export default MainContent;
