import { create } from 'zustand';

// Timestamp + Chunks
// Marker data

// Define types for segmentation functionality
export type Label = 0 | 1;

// Updated to match the actual JSON structure
export interface MarkerData {
  frame_idx: number;
  player_id: number;
  points: number[][][]; // Changed from Coordinates[][] to match the JSON format
  labels: number[][]; // Changed from Label[][] to match the JSON format
}

export interface MarkerInput {
  marker_input: MarkerData[][];
}

// legacy
export type MarkerType = 'positive' | 'negative';

export interface Point {
  x: number;
  y: number;
}

// Define the PointData interface with unique ID
export interface PointData {
  id: string;
  frameIdx: number;
  playerId: 1 | 2;
  markerType: MarkerType;
  point: Point;
}

// Define store state type
interface SegmentationState {
  // Current frame index
  currentFrameIndex: number;
  // Active selections
  activePlayer: 1 | 2;
  activeMarkerType: MarkerType;
  segmentationModel: string;
  // Actions
  setActivePlayer: (player: 1 | 2) => void;
  setActiveMarkerType: (markerType: MarkerType) => void;
  setSegmentationModel: (model: string) => void;
  setCurrentFrameIndex: (frameIndex: number) => void; // need to be moved to video related store

  // new marker state
  markerInput: MarkerInput;
  markers: Map<string, PointData>;
  addMarker: (point: Point) => void;
  removeMarker: (pointId: string) => void;
  clearPlayerMarkers: (player: 1 | 2) => void;
  clearPlayerMarkerByType: (player: 1 | 2, markerType: MarkerType) => void;
  getMarkerInput: () => MarkerInput;

  // // legacy: Marker data by frame
  // markedFrames: Map<number, FrameData>;
  // addPoint: (point: Point) => void; // legacy
  // removePoint: (player: 1 | 2, markerType: MarkerType, pointIndex: number) => void; // legacy
  // clearPlayerPoints: (player: 1 | 2) => void; // legacy
  // clearPlayerMarkerPoints: (player: 1 | 2, markerType: MarkerType) => void; // legacy

  // Mask data
  player1Mask: string | null;
  player2Mask: string | null;
  setPlayerMask: (player: 1 | 2, maskData: string | null) => void;
}

// Helper function to generate a unique ID
const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Helper function to rebuild MarkerInput from markers map
const rebuildMarkerInput = (markers: Map<string, PointData>, chunks?: number[][][]): MarkerInput => {
  // If no chunks are provided, return a simple structure
  if (!chunks || chunks.length === 0) {
    // Group points by frame and player
    const framePlayerMap = new Map<number, Map<number, { positive: Point[]; negative: Point[] }>>();

    // Populate the map
    markers.forEach((pointData) => {
      if (!framePlayerMap.has(pointData.frameIdx)) {
        framePlayerMap.set(pointData.frameIdx, new Map());
      }

      const playerMap = framePlayerMap.get(pointData.frameIdx)!;
      if (!playerMap.has(pointData.playerId)) {
        playerMap.set(pointData.playerId, { positive: [], negative: [] });
      }

      const points = playerMap.get(pointData.playerId)!;
      if (pointData.markerType === 'positive') {
        points.positive.push(pointData.point);
      } else {
        points.negative.push(pointData.point);
      }
    });

    const markerData: MarkerData[] = [];

    // Process all frame data
    framePlayerMap.forEach((playerMap, frameIdx) => {
      playerMap.forEach((points, playerId) => {
        // For positive points
        if (points.positive.length > 0) {
          markerData.push({
            frame_idx: frameIdx,
            player_id: playerId,
            points: [points.positive.map((point) => [point.x, point.y])],
            labels: [Array(points.positive.length).fill(1)],
          });
        }

        // For negative points
        if (points.negative.length > 0) {
          markerData.push({
            frame_idx: frameIdx,
            player_id: playerId,
            points: [points.negative.map((point) => [point.x, point.y])],
            labels: [Array(points.negative.length).fill(0)],
          });
        }
      });
    });

    return {
      marker_input: markerData.length > 0 ? [markerData] : [[]],
    };
  }

  // With chunks, organize markers by chunks
  // Initialize empty marker data arrays for each chunk
  const markerByChunks: MarkerData[][] = Array(chunks.length)
    .fill(null)
    .map(() => []);

  // Group points by frame, player, and type
  const framePlayerMap = new Map<number, Map<number, { positive: Point[]; negative: Point[] }>>();

  // Populate the map
  markers.forEach((pointData) => {
    if (!framePlayerMap.has(pointData.frameIdx)) {
      framePlayerMap.set(pointData.frameIdx, new Map());
    }

    const playerMap = framePlayerMap.get(pointData.frameIdx)!;
    if (!playerMap.has(pointData.playerId)) {
      playerMap.set(pointData.playerId, { positive: [], negative: [] });
    }

    const points = playerMap.get(pointData.playerId)!;
    if (pointData.markerType === 'positive') {
      points.positive.push(pointData.point);
    } else {
      points.negative.push(pointData.point);
    }
  });

  // Process all frame data and assign to correct chunk
  framePlayerMap.forEach((playerMap, frameIdx) => {
    // Determine which chunk this frame belongs to
    const chunkIndex = getChunkIndex(frameIdx, chunks);

    playerMap.forEach((points, playerId) => {
      // For positive points
      if (points.positive.length > 0) {
        markerByChunks[chunkIndex].push({
          frame_idx: frameIdx,
          player_id: playerId,
          points: [points.positive.map((point) => [point.x, point.y])],
          labels: [Array(points.positive.length).fill(1)],
        });
      }

      // For negative points
      if (points.negative.length > 0) {
        markerByChunks[chunkIndex].push({
          frame_idx: frameIdx,
          player_id: playerId,
          points: [points.negative.map((point) => [point.x, point.y])],
          labels: [Array(points.negative.length).fill(0)],
        });
      }
    });
  });

  return {
    marker_input: markerByChunks,
  };
};

// Helper function to determine which chunk a frame belongs to
const getChunkIndex = (frameIdx: number, chunks: number[][][]): number => {
  for (let i = 0; i < chunks.length; i++) {
    for (const [start, end] of chunks[i]) {
      if (start <= frameIdx && frameIdx <= end) {
        return i;
      }
    }
  }
  return 0; // Default to first chunk if not found
};

// Create the store
const useSegmentationStore = create<SegmentationState>((set, get) => ({
  // Initial state
  activePlayer: 1,
  activeMarkerType: 'positive',

  segmentationModel: 'SAM2',
  // markedFrames: new Map(),
  currentFrameIndex: 0,

  player1Mask: null,
  player2Mask: null,

  // New marker state
  markerInput: { marker_input: [[]] },
  markers: new Map<string, PointData>(),

  // Actions
  setActivePlayer: (player) => set({ activePlayer: player }),
  setActiveMarkerType: (markerType) => set({ activeMarkerType: markerType }),
  setSegmentationModel: (model) => set({ segmentationModel: model }),
  setCurrentFrameIndex: (frameIndex) => set({ currentFrameIndex: frameIndex }),

  // New marker actions
  addMarker: (point) =>
    set((state) => {
      const id = generateUniqueId();
      const newMarkers = new Map(state.markers);

      const pointData: PointData = {
        id,
        frameIdx: state.currentFrameIndex,
        playerId: state.activePlayer,
        markerType: state.activeMarkerType,
        point,
      };

      newMarkers.set(id, pointData);
      const markerInput = rebuildMarkerInput(newMarkers);

      return {
        markers: newMarkers,
        markerInput,
      };
    }),

  removeMarker: (pointId) =>
    set((state) => {
      const newMarkers = new Map(state.markers);

      if (newMarkers.has(pointId)) {
        newMarkers.delete(pointId);
        const markerInput = rebuildMarkerInput(newMarkers);

        return {
          markers: newMarkers,
          markerInput,
        };
      }

      return state;
    }),

  clearPlayerMarkers: (player) =>
    set((state) => {
      const newMarkers = new Map(state.markers);

      // Filter out markers for the specified player
      state.markers.forEach((marker, id) => {
        if (marker.playerId === player) {
          newMarkers.delete(id);
        }
      });

      const markerInput = rebuildMarkerInput(newMarkers);

      return {
        markers: newMarkers,
        markerInput,
      };
    }),

  clearPlayerMarkerByType: (player, markerType) =>
    set((state) => {
      const newMarkers = new Map(state.markers);

      // Filter out markers for the specified player and type
      state.markers.forEach((marker, id) => {
        if (marker.playerId === player && marker.markerType === markerType) {
          newMarkers.delete(id);
        }
      });

      const markerInput = rebuildMarkerInput(newMarkers);

      return {
        markers: newMarkers,
        markerInput,
      };
    }),

  getMarkerInput: () => {
    // We need to import the chunks data to properly organize markers
    // This would typically come from a service or another store
    // For now, we'll add a placeholder that would be replaced with actual data
    let chunks: number[][][] = [];
    try {
      // Try to get the chunks data from sessionStorage if it was previously saved there
      const chunksData = sessionStorage.getItem('mainviewChunks');
      if (chunksData) {
        chunks = JSON.parse(chunksData);
      }
    } catch (error) {
      console.error('Error retrieving chunks data:', error);
    }

    return rebuildMarkerInput(get().markers, chunks);
  },

  setPlayerMask: (player, maskData) =>
    set(() => ({
      ...(player === 1 ? { player1Mask: maskData } : { player2Mask: maskData }),
    })),
}));

export default useSegmentationStore;
