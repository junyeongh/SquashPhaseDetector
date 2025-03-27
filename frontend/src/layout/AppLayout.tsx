import Sidebar, { PipelineStep } from '@/layout/Sidebar';
import MainContent from '@/layout/MainContent';
import { FileInfo } from '@/services/api/video';

interface AppLayoutProps {
  children: React.ReactNode;
  activeStep: PipelineStep;
  onStepChange: (step: PipelineStep) => void;
  completedSteps: Set<PipelineStep>;
  uploadedFiles?: FileInfo[];
}

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  activeStep,
  onStepChange,
  completedSteps,
  uploadedFiles = [],
}) => {
  return (
    <div className='flex h-screen w-full flex-row overflow-hidden'>
      <Sidebar
        activeStep={activeStep}
        onStepChange={onStepChange}
        completedSteps={completedSteps}
        uploadedFiles={uploadedFiles}
      />
      <MainContent>{children}</MainContent>
    </div>
  );
};

export default AppLayout;
