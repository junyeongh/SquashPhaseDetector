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
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  results?: SegmentationResult[];
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
 * Get segmentation status and results for a session
 */
export const getSegmentationStatus = async (
  sessionId: string
): Promise<SegmentationStatus> => {
  try {
    const response = await axios.get(`${API_URL}/status/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching segmentation status:', error);
    throw error;
  }
};

/**
 * Get segmentation mask for a specific frame
 */
export const getSegmentationMask = async (
  sessionId: string,
  frameIndex: number
): Promise<SegmentationResult> => {
  try {
    const response = await axios.get(
      `${API_URL}/mask/${sessionId}/${frameIndex}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching segmentation mask:', error);
    throw error;
  }
};
