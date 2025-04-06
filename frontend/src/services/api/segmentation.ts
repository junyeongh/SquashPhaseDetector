import axios from 'axios';
import { BASE_API_URL } from './config';

// Derive API URL for segmentation endpoints
const API_URL = `${BASE_API_URL}/segmentation`;

export interface Point {
  x: number;
  y: number;
}

export interface MarkPlayersRequest {
  sessionId: string;
  frameIndex: number;
  player1Points: Point[];
  player2Points: Point[];
}

export interface SAM2MarkersRequest {
  sessionId: string;
  frameIndex: number;
  player1PositivePoints: Point[];
  player1NegativePoints: Point[];
  player2PositivePoints: Point[];
  player2NegativePoints: Point[];
}

export interface SegmentationMask {
  size: [number, number]; // [height, width]
  counts: string; // RLE encoding
}

export interface SegmentationResult {
  frameIndex: number;
  player1Mask: SegmentationMask;
  player2Mask: SegmentationMask;
}

export interface SegmentationStatus {
  status: string; // 'not_started', 'starting', 'processing', 'completed', 'error: {message}'
  video_uuid: string;
}

// New interfaces for updated backend API
export interface MarkerPoint {
  x: number;
  y: number;
}

export interface MarkerInput {
  frame_idx: number;
  player_id: number; // 1 or 2
  points: [number, number][]; // Array of [x, y] coordinates normalized to [0,1]
  labels: number[]; // 1 for positive, 0 for negative
}

export interface RunSegmentationRequest {
  video_uuid: string;
  marker_input: MarkerInput[][];
}

/**
 * Mark players in a specific frame for segmentation
 */
export const markPlayers = async (
  sessionId: string,
  frameIndex: number,
  player1Points: Point[],
  player2Points: Point[]
): Promise<{ success: boolean; markersCount: number }> => {
  try {
    const response = await axios.post(`${API_URL}/mark-players`, {
      sessionId,
      frameIndex,
      player1Points,
      player2Points,
    });
    return response.data;
  } catch (error) {
    console.error('Error marking players:', error);
    throw error;
  }
};

/**
 * Mark players using SAM2 model with positive and negative points
 */
export const markPlayersSAM2 = async (
  sessionId: string,
  frameIndex: number,
  player1PositivePoints: Point[],
  player1NegativePoints: Point[],
  player2PositivePoints: Point[],
  player2NegativePoints: Point[]
): Promise<{ success: boolean; markersCount: number }> => {
  try {
    const response = await axios.post(`${API_URL}/mark-players-sam2`, {
      sessionId,
      frameIndex,
      player1PositivePoints,
      player1NegativePoints,
      player2PositivePoints,
      player2NegativePoints,
    });
    return response.data;
  } catch (error) {
    console.error('Error marking players with SAM2:', error);
    throw error;
  }
};

/**
 * Start the segmentation process for a session
 */
export const startSegmentation = async (
  sessionId: string,
  model: string = 'Basic'
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await axios.post(`${API_URL}/start-segmentation`, {
      sessionId,
      model,
    });
    return response.data;
  } catch (error) {
    console.error('Error starting segmentation:', error);
    throw error;
  }
};

/**
 * NEW API: Run segmentation with the updated backend endpoint
 * This uses the new /segmentation endpoint that accepts a video_uuid and marker_input
 */
export const runSegmentation = async (
  video_uuid: string,
  marker_input: MarkerInput[][]
): Promise<{ status: string; video_uuid: string }> => {
  try {
    const response = await axios.post(`${API_URL}/`, {
      video_uuid,
      marker_input,
    });
    return response.data;
  } catch (error) {
    console.error('Error running segmentation:', error);
    throw error;
  }
};

/**
 * Get segmentation status for a video
 */
export const getSegmentationStatus = async (video_uuid: string): Promise<SegmentationStatus> => {
  try {
    const response = await axios.get(`${API_URL}/${video_uuid}/status`);
    return response.data;
  } catch (error) {
    console.error('Error fetching segmentation status:', error);
    throw error;
  }
};

/**
 * Get segmentation mask for a specific frame
 */
export const getSegmentationMask = async (sessionId: string, frameIndex: number): Promise<SegmentationResult> => {
  try {
    const response = await axios.get(`${API_URL}/mask/${sessionId}/${frameIndex}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching segmentation mask:', error);
    throw error;
  }
};
