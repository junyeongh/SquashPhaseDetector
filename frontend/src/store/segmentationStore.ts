import { create } from 'zustand';
import { Point, MarkerType, FrameData } from '@/types/segmentation';

// Define store state type
interface SegmentationState {
  // Active selections
  activePlayer: 1 | 2;
  activeMarkerType: MarkerType;
  segmentationModel: string;

  // Marker data by frame
  markedFrames: Map<number, FrameData>;

  // Current frame index
  currentFrameIndex: number;

  // Mask data
  player1Mask: string | null;
  player2Mask: string | null;

  // Actions
  setActivePlayer: (player: 1 | 2) => void;
  setActiveMarkerType: (markerType: MarkerType) => void;
  setSegmentationModel: (model: string) => void;
  setCurrentFrameIndex: (frameIndex: number) => void;

  addPoint: (point: Point) => void;
  removePoint: (player: 1 | 2, markerType: MarkerType, pointIndex: number) => void;
  clearPlayerPoints: (player: 1 | 2) => void;
  clearPlayerMarkerPoints: (player: 1 | 2, markerType: MarkerType) => void;

  setPlayerMask: (player: 1 | 2, maskData: string | null) => void;
}

// Create the store
const useSegmentationStore = create<SegmentationState>((set) => ({
  // Initial state
  activePlayer: 1,
  activeMarkerType: 'positive',

  segmentationModel: 'SAM2',
  markedFrames: new Map(),
  currentFrameIndex: 0,

  player1Mask: null,
  player2Mask: null,

  // Actions
  setActivePlayer: (player) => set({ activePlayer: player }),

  setActiveMarkerType: (markerType) => set({ activeMarkerType: markerType }),

  setSegmentationModel: (model) => set({ segmentationModel: model }),

  setCurrentFrameIndex: (frameIndex) => set({ currentFrameIndex: frameIndex }),

  addPoint: (point) =>
    set((state) => {
      const newMarkedFrames = new Map(state.markedFrames);
      const frameData = newMarkedFrames.get(state.currentFrameIndex) || {
        player1PositivePoints: [],
        player1NegativePoints: [],
        player2PositivePoints: [],
        player2NegativePoints: [],
      };

      // Determine which array to update based on active player and marker type
      let targetArray: Point[];
      if (state.activePlayer === 1) {
        if (state.activeMarkerType === 'positive') {
          targetArray = [...frameData.player1PositivePoints];
        } else {
          targetArray = [...frameData.player1NegativePoints];
        }
      } else {
        if (state.activeMarkerType === 'positive') {
          targetArray = [...frameData.player2PositivePoints];
        } else {
          targetArray = [...frameData.player2NegativePoints];
        }
      }

      // Add the point to the appropriate array
      targetArray.push(point);

      // Update the frame data with the modified array
      if (state.activePlayer === 1) {
        if (state.activeMarkerType === 'positive') {
          frameData.player1PositivePoints = targetArray;
        } else {
          frameData.player1NegativePoints = targetArray;
        }
      } else {
        if (state.activeMarkerType === 'positive') {
          frameData.player2PositivePoints = targetArray;
        } else {
          frameData.player2NegativePoints = targetArray;
        }
      }

      // Update the map with the modified frame data
      newMarkedFrames.set(state.currentFrameIndex, frameData);

      return { markedFrames: newMarkedFrames };
    }),

  removePoint: (player, markerType, pointIndex) =>
    set((state) => {
      const newMarkedFrames = new Map(state.markedFrames);
      const frameData = newMarkedFrames.get(state.currentFrameIndex);

      if (!frameData) return { markedFrames: newMarkedFrames };

      // Create a copy of the frame data
      const updatedFrameData = { ...frameData };

      // Remove the point from the appropriate array
      if (player === 1) {
        if (markerType === 'positive') {
          updatedFrameData.player1PositivePoints = [
            ...frameData.player1PositivePoints.slice(0, pointIndex),
            ...frameData.player1PositivePoints.slice(pointIndex + 1),
          ];
        } else {
          updatedFrameData.player1NegativePoints = [
            ...frameData.player1NegativePoints.slice(0, pointIndex),
            ...frameData.player1NegativePoints.slice(pointIndex + 1),
          ];
        }
      } else {
        if (markerType === 'positive') {
          updatedFrameData.player2PositivePoints = [
            ...frameData.player2PositivePoints.slice(0, pointIndex),
            ...frameData.player2PositivePoints.slice(pointIndex + 1),
          ];
        } else {
          updatedFrameData.player2NegativePoints = [
            ...frameData.player2NegativePoints.slice(0, pointIndex),
            ...frameData.player2NegativePoints.slice(pointIndex + 1),
          ];
        }
      }

      // Update the map with the modified frame data
      newMarkedFrames.set(state.currentFrameIndex, updatedFrameData);

      return { markedFrames: newMarkedFrames };
    }),

  clearPlayerPoints: (player) =>
    set((state) => {
      const newMarkedFrames = new Map(state.markedFrames);

      // If the current frame doesn't have data, there's nothing to clear
      if (!newMarkedFrames.has(state.currentFrameIndex)) return { markedFrames: newMarkedFrames };

      const frameData = newMarkedFrames.get(state.currentFrameIndex)!;
      const updatedFrameData = { ...frameData };

      // Clear points for the specified player
      if (player === 1) {
        updatedFrameData.player1PositivePoints = [];
        updatedFrameData.player1NegativePoints = [];
      } else {
        updatedFrameData.player2PositivePoints = [];
        updatedFrameData.player2NegativePoints = [];
      }

      // Update the map
      newMarkedFrames.set(state.currentFrameIndex, updatedFrameData);

      return { markedFrames: newMarkedFrames };
    }),

  clearPlayerMarkerPoints: (player, markerType) =>
    set((state) => {
      const newMarkedFrames = new Map(state.markedFrames);

      // If the current frame doesn't have data, there's nothing to clear
      if (!newMarkedFrames.has(state.currentFrameIndex)) return { markedFrames: newMarkedFrames };

      const frameData = newMarkedFrames.get(state.currentFrameIndex)!;
      const updatedFrameData = { ...frameData };

      // Clear points for the specified player and marker type
      if (player === 1) {
        if (markerType === 'positive') {
          updatedFrameData.player1PositivePoints = [];
        } else {
          updatedFrameData.player1NegativePoints = [];
        }
      } else {
        if (markerType === 'positive') {
          updatedFrameData.player2PositivePoints = [];
        } else {
          updatedFrameData.player2NegativePoints = [];
        }
      }

      // Update the map
      newMarkedFrames.set(state.currentFrameIndex, updatedFrameData);

      return { markedFrames: newMarkedFrames };
    }),

  setPlayerMask: (player, maskData) =>
    set(() => ({
      ...(player === 1 ? { player1Mask: maskData } : { player2Mask: maskData }),
    })),
}));

export default useSegmentationStore;
