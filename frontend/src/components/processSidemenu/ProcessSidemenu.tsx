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
  segmentationModel,
  setSegmentationModel,
  activeMarkerType,
  setActiveMarkerType,
  player1Points,
  player2Points,
  player1PositivePoints,
  player1NegativePoints,
  player2PositivePoints,
  player2NegativePoints,
  activePlayer,
  setActivePlayer,
  onClearPlayerPoints,
  onClearPlayerMarkerPoints,
  onStartSegmentation,

  // Pose props
  modelType,
  confidenceThreshold,
  setModelType,
  setConfidenceThreshold,
  onStartPoseDetection,

  // Export props
  onExportJson,
  onExportVideo,
  onExportReport,
}) => {
  // Get previous and next stage based on current stage
  const getPreviousStage = (): ProcessingStage | null => {
    const stageIds = stageConfig.map((s) => s.id);
    const currentIndex = stageIds.indexOf(activeStage);
    return currentIndex > 0 ? (stageIds[currentIndex - 1] as ProcessingStage) : null;
  };

  const getNextStage = (): ProcessingStage | null => {
    const stageIds = stageConfig.map((s) => s.id);
    const currentIndex = stageIds.indexOf(activeStage);
    return currentIndex < stageIds.length - 1 ? (stageIds[currentIndex + 1] as ProcessingStage) : null;
  };

  const prevStage = getPreviousStage();
  const nextStage = getNextStage();

  // Get current stage details
  const currentStage = stageConfig.find((stage) => stage.id === activeStage);

  // Find current stage index
  const currentStageIndex = stageConfig.findIndex((stage) => stage.id === activeStage);
  const totalStages = stageConfig.length;

  // Render the appropriate stage component based on the active stage
  const renderStageComponent = () => {
    switch (activeStage) {
      case 'preprocess':
        return (
          <PreprocessStage
            isProcessing={isProcessing}
            processingStatus={processingStatus}
            showSkipButton={showSkipButton}
            onSkipStage={onSkipStage}
            onProcess={onProcess!}
            onPreviousFrame={onPreviousFrame}
            onNextFrame={onNextFrame}
          />
        );

      case 'segmentation':
        return (
          <SegmentationStage
            isProcessing={isProcessing}
            processingStatus={processingStatus}
            showSkipButton={showSkipButton}
            onSkipStage={onSkipStage}
            segmentationModel={segmentationModel}
            setSegmentationModel={setSegmentationModel}
            activeMarkerType={activeMarkerType}
            setActiveMarkerType={setActiveMarkerType}
            player1Points={player1Points}
            player2Points={player2Points}
            player1PositivePoints={player1PositivePoints}
            player1NegativePoints={player1NegativePoints}
            player2PositivePoints={player2PositivePoints}
            player2NegativePoints={player2NegativePoints}
            activePlayer={activePlayer}
            setActivePlayer={setActivePlayer}
            onClearPlayerPoints={onClearPlayerPoints}
            onClearPlayerMarkerPoints={onClearPlayerMarkerPoints}
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
            onStartPoseDetection={onStartPoseDetection}
            onPreviousFrame={onPreviousFrame}
            onNextFrame={onNextFrame}
          />
        );

      case 'game_state':
        return (
          <GameStateStage
            isProcessing={isProcessing}
            processingStatus={processingStatus}
            showSkipButton={showSkipButton}
            onSkipStage={onSkipStage}
            onProcess={onProcess!}
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
    <div className='flex h-full w-full flex-col border-l border-gray-200'>
      {/* Main content area with scrolling */}
      <div className='flex flex-1 flex-col overflow-auto p-4'>
        <h2 className='text-md mb-4 font-semibold'>Processing Progress</h2>

        {/* Stage header with overview and current stage info */}
        {currentStage && (
          <StageHeader
            currentStage={currentStage}
            currentStageIndex={currentStageIndex}
            totalStages={totalStages}
            activeStage={activeStage}
            completedStages={completedStages}
            isProcessing={isProcessing}
            onStageSelect={onStageSelect}
            allStages={stageConfig}
          />
        )}

        {/* Stage-specific controls */}
        <div className='flex-1'>{renderStageComponent()}</div>
      </div>

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
            disabled={isProcessing || (player1PositivePoints?.length === 0 && player2PositivePoints?.length === 0)}
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

        {activeStage === 'game_state' && onProcess && (
          <button
            onClick={onProcess}
            disabled={isProcessing}
            className='flex w-full items-center justify-center gap-2 rounded border border-blue-300 bg-blue-100 px-4 py-2 text-sm text-blue-700 transition-colors hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-50'
          >
            <Play className='h-3.5 w-3.5' />
            Run Game Analysis
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
