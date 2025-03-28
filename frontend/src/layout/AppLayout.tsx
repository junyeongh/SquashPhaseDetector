import Sidebar from '@/layout/Sidebar';
import MainContent from '@/layout/MainContent';
import { FileInfo } from '@/services/api/video';

interface AppLayoutProps {
  children: React.ReactNode;
  uploadedFiles?: FileInfo[];
}

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  uploadedFiles = [],
}) => {
  return (
    <div className='flex h-screen w-full flex-row overflow-hidden'>
      <Sidebar
        uploadedFiles={uploadedFiles}
      />
      <MainContent>{children}</MainContent>
    </div>
  );
};

export default AppLayout;
