import axios from 'axios';
import { BASE_API_URL } from './config';
import { MarkerInput, Point } from '@/store/segmentationStore';
// Derive API URL for segmentation endpoints
const API_URL = `${BASE_API_URL}/segmentation`;

export const get_models = async (): Promise<{ models: string[] }> => {
  try {
    const response = await axios.get(`${API_URL}/models`);
    return response.data;
  } catch (error) {
    console.error('Error fetching models:', error);
    throw error;
  }
};

export const run_sam2_model = async (
  video_uuid: string,
  request: MarkerInput
): Promise<{ status: string; video_uuid: string }> => {
  try {
    const response = await axios.post(`${API_URL}/sam2/${video_uuid}`, {
      marker_input: request.marker_input,
    });
    return response.data;
  } catch (error) {
    console.error('Error running SAM2 model:', error);
    throw error;
  }
};

interface SAM2ModelResult {
  marker_input: MarkerInput;
}

interface SAM2ModelStatus {
  video_uuid: string;
  is_processing: boolean;
  has_segmentation: boolean;
  status: string;
}

export const get_sam2_model_result = async (video_uuid: string): Promise<SAM2ModelResult> => {
  try {
    const response = await axios.get(`${API_URL}/sam2/${video_uuid}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching SAM2 model result:', error);
    throw error;
  }
};

export const get_sam2_model_status = async (video_uuid: string): Promise<SAM2ModelStatus> => {
  try {
    const response = await axios.get(`${API_URL}/sam2/${video_uuid}/status`);
    return response.data;
  } catch (error) {
    console.error('Error fetching SAM2 model status:', error);
    throw error;
  }
};

// LEGACY //

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
    console.log(
      'markPlayersSAM2',
      sessionId,
      frameIndex,
      player1PositivePoints,
      player1NegativePoints,
      player2PositivePoints,
      player2NegativePoints
    );
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
  marker_input: MarkerInput
): Promise<{ status: string; video_uuid: string }> => {
  try {
    console.log(marker_input);
    const response = await axios.post(`${API_URL}/sam2/${video_uuid}`, marker_input);
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
