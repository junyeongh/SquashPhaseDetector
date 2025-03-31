import { Point } from '@/services/api/segmentation';

// Define the types of processing stages
export type ProcessingStage = 'preprocess' | 'segmentation' | 'pose' | 'game_state' | 'export';

// Stage configuration type
export interface StageConfig {
  id: ProcessingStage;
  label: string;
  description: string;
}

// Define marker type for SAM2 model
export type MarkerType = 'positive' | 'negative';

// Base props shared across all stage components
export interface BaseStageProps {
  isProcessing: boolean;
  processingStatus: string;
  showSkipButton?: boolean;
  onSkipStage?: () => void;
  onProcess?: () => void;
  onPreviousFrame?: () => void;
  onNextFrame?: () => void;
}

// Preprocess stage specific props
export interface PreprocessStageProps extends Omit<BaseStageProps, 'onProcess'> {
  onProcess: () => void;
}

// Segmentation stage specific props
export interface SegmentationStageProps extends BaseStageProps {
  segmentationModel?: string;
  setSegmentationModel?: (model: string) => void;
  activeMarkerType?: MarkerType;
  setActiveMarkerType?: (type: MarkerType) => void;

  player1Points?: Point[];
  player2Points?: Point[];

  player1PositivePoints?: Point[];
  player1NegativePoints?: Point[];
  player2PositivePoints?: Point[];
  player2NegativePoints?: Point[];

  activePlayer?: 1 | 2;
  setActivePlayer?: (player: 1 | 2) => void;

  onClearPlayerPoints?: (player: 1 | 2) => void;
  onClearPlayerMarkerPoints?: (player: 1 | 2, markerType: MarkerType) => void;

  onMarkPlayers?: () => void;
  onStartSegmentation?: () => void;
}

// Pose detection stage specific props
export interface PoseStageProps extends BaseStageProps {
  modelType?: string;
  confidenceThreshold?: number;
  setModelType?: (type: string) => void;
  setConfidenceThreshold?: (threshold: number) => void;

  onStartPoseDetection?: () => void;
}

// Game state analysis stage specific props
export interface GameStateStageProps extends Omit<BaseStageProps, 'onProcess'> {
  onProcess: () => void;
}

// Export stage specific props
export interface ExportStageProps extends BaseStageProps {
  onExportJson?: () => void;
  onExportVideo?: () => void;
  onExportReport?: () => void;
}

// Main sidemenu props combining all stage props
export interface ProcessSidemenuProps {
  activeStage: ProcessingStage;
  completedStages: Set<ProcessingStage>;
  isProcessing: boolean;
  processingStatus: string;

  // Stage configuration
  stageConfig: StageConfig[];

  // Stage selection
  onStageSelect?: (stage: ProcessingStage) => void;

  // Skip button props
  showSkipButton?: boolean;
  onSkipStage?: () => void;

  // Navigation controls
  onPreviousStage?: (stage?: ProcessingStage) => void;
  onNextStage?: (stage?: ProcessingStage) => void;

  // Include all stage specific props
  // Preprocess props
  onProcess?: () => void;

  // Segmentation props
  segmentationModel?: string;
  setSegmentationModel?: (model: string) => void;
  activeMarkerType?: MarkerType;
  setActiveMarkerType?: (type: MarkerType) => void;
  player1Points?: Point[];
  player2Points?: Point[];
  player1PositivePoints?: Point[];
  player1NegativePoints?: Point[];
  player2PositivePoints?: Point[];
  player2NegativePoints?: Point[];
  activePlayer?: 1 | 2;
  setActivePlayer?: (player: 1 | 2) => void;
  onClearPlayerPoints?: (player: 1 | 2) => void;
  onClearPlayerMarkerPoints?: (player: 1 | 2, markerType: MarkerType) => void;
  onMarkPlayers?: () => void;
  onStartSegmentation?: () => void;

  // Pose props
  modelType?: string;
  confidenceThreshold?: number;
  setModelType?: (type: string) => void;
  setConfidenceThreshold?: (threshold: number) => void;
  onStartPoseDetection?: () => void;

  // Frame navigation
  onPreviousFrame?: () => void;
  onNextFrame?: () => void;

  // Export props
  onExportJson?: () => void;
  onExportVideo?: () => void;
  onExportReport?: () => void;
}
