import { useState } from 'react';
import Sidebar, { PipelineStep } from './Sidebar';
import MainContent from './MainContent';

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
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar */}
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
