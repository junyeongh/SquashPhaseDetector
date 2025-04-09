import React from 'react';
import { Play } from 'lucide-react';
import { ProcessSidemenuProps, ProcessingStage } from './types';
import { StageHeader, StageNavigator } from './ui';
import { PreprocessStage, SegmentationStage, PoseStage, GameStateStage, ExportStage } from './stages';

const ProcessSidemenu: React.FC<ProcessSidemenuProps> = ({
  activeStage,
  completedStages,
  isProcessing,
  processingStatus,
  stageConfig,

  // Stage selection
  onStageSelect,

  // Skip button props
  showSkipButton,
  onSkipStage,

  // Navigation controls
  onPreviousStage,
  onNextStage,
  onPreviousFrame,
  onNextFrame,

  // Preprocess props
  onProcess,

  // Segmentation props
  onStartSegmentation,
  currentFrameIndex,

  // Pose props
  modelType,
  confidenceThreshold,
  setModelType,
  setConfidenceThreshold,
  onStartPoseDetection,

  // Game state props
  onStartGameStateAnalysis,

  // Export props
  onExportJson,
  onExportVideo,
  onExportReport,
}) => {
  const availableStages = stageConfig.map((stage) => stage.id as ProcessingStage);
  const currentStageIndex = availableStages.findIndex((stage) => stage === activeStage);
  const totalStages = availableStages.length;

  const getPreviousStage = (): ProcessingStage | null => {
    if (currentStageIndex > 0) {
      return availableStages[currentStageIndex - 1];
    }
    return null;
  };

  const getNextStage = (): ProcessingStage | null => {
    if (currentStageIndex < availableStages.length - 1) {
      return availableStages[currentStageIndex + 1];
    }
    return null;
  };

  // Get the previous stage if available, accounting for stage completion
  const prevStage = getPreviousStage();

  // Get the next stage if available, accounting for stage completion
  const nextStage = getNextStage();

  const renderStageComponent = () => {
    switch (activeStage) {
      case 'preprocess':
        return (
          <PreprocessStage
            isProcessing={isProcessing}
            processingStatus={processingStatus}
            showSkipButton={showSkipButton}
            onSkipStage={onSkipStage}
            onProcess={onProcess}
          />
        );
      case 'segmentation':
        return (
          <SegmentationStage
            isProcessing={isProcessing}
            processingStatus={processingStatus}
            showSkipButton={showSkipButton}
            onSkipStage={onSkipStage}
            currentFrameIndex={currentFrameIndex}
          />
        );
      case 'pose':
        return (
          <PoseStage
            isProcessing={isProcessing}
            processingStatus={processingStatus}
            showSkipButton={showSkipButton}
            onSkipStage={onSkipStage}
            modelType={modelType}
            confidenceThreshold={confidenceThreshold}
            setModelType={setModelType}
            setConfidenceThreshold={setConfidenceThreshold}
            onPreviousFrame={onPreviousFrame}
            onNextFrame={onNextFrame}
            onStartPoseDetection={onStartPoseDetection}
          />
        );
      case 'game_state':
        return (
          <GameStateStage
            isProcessing={isProcessing}
            processingStatus={processingStatus}
            showSkipButton={showSkipButton}
            onSkipStage={onSkipStage}
            onStartGameStateAnalysis={onStartGameStateAnalysis}
          />
        );
      case 'export':
        return (
          <ExportStage
            isProcessing={isProcessing}
            processingStatus={processingStatus}
            showSkipButton={showSkipButton}
            onSkipStage={onSkipStage}
            onExportJson={onExportJson}
            onExportVideo={onExportVideo}
            onExportReport={onExportReport}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className='flex h-full flex-col bg-gray-50 shadow-md'>
      {/* Stage header */}
      <StageHeader
        currentStage={stageConfig.find((stage) => stage.id === activeStage) || stageConfig[0]}
        currentStageIndex={currentStageIndex}
        totalStages={totalStages}
        activeStage={activeStage}
        completedStages={completedStages}
        onStageSelect={onStageSelect}
        allStages={stageConfig}
        isProcessing={isProcessing}
      />

      {/* Stage content - flex-1 to expand */}
      <div className='flex-1 overflow-y-auto p-2'>{renderStageComponent()}</div>

      {/* Process button */}
      <div className='px-4 pb-2'>
        {activeStage === 'preprocess' && onProcess && (
          <button
            onClick={onProcess}
            disabled={isProcessing}
            className='flex w-full items-center justify-center gap-2 rounded border border-blue-300 bg-blue-100 px-4 py-2 text-sm text-blue-700 transition-colors hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-50'
          >
            <Play className='h-3.5 w-3.5' />
            Process Video
          </button>
        )}

        {activeStage === 'segmentation' && onStartSegmentation && (
          <button
            onClick={onStartSegmentation}
            disabled={isProcessing}
            className='flex w-full items-center justify-center gap-2 rounded border border-blue-300 bg-blue-100 px-4 py-2 text-sm text-blue-700 transition-colors hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-50'
          >
            Start Segmentation
          </button>
        )}

        {activeStage === 'pose' && onStartPoseDetection && (
          <button
            onClick={onStartPoseDetection}
            disabled={isProcessing}
            className='flex w-full items-center justify-center gap-2 rounded border border-blue-300 bg-blue-100 px-4 py-2 text-sm text-blue-700 transition-colors hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-50'
          >
            Start Pose Detection
          </button>
        )}

        {activeStage === 'game_state' && onStartGameStateAnalysis && (
          <button
            onClick={onStartGameStateAnalysis}
            disabled={isProcessing}
            className='flex w-full items-center justify-center gap-2 rounded border border-blue-300 bg-blue-100 px-4 py-2 text-sm text-blue-700 transition-colors hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-50'
          >
            <Play className='h-3.5 w-3.5' />
            Generate Exploratory data analysis (EDA) Report
          </button>
        )}
      </div>

      {/* Navigation footer */}
      <StageNavigator
        currentStageIndex={currentStageIndex}
        totalStages={totalStages}
        prevStage={prevStage}
        nextStage={nextStage}
        onPreviousStage={onPreviousStage}
        onNextStage={onNextStage}
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default ProcessSidemenu;
