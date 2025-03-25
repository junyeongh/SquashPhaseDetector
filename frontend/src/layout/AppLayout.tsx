import Sidebar, { PipelineStep } from '@/layout/Sidebar';
import MainContent from '@/layout/MainContent';

interface AppLayoutProps {
  children: React.ReactNode;
  activeStep: PipelineStep;
  onStepChange: (step: PipelineStep) => void;
  completedSteps: Set<PipelineStep>;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  activeStep,
  onStepChange,
  completedSteps
}) => {
  return (
    <div className="flex w-full h-screen overflow-hidden">
      <Sidebar
        activeStep={activeStep}
        onStepChange={onStepChange}
        completedSteps={completedSteps}
      />
      <MainContent>
        {children}
      </MainContent>
    </div>
  );
};

export default AppLayout;
