import axios from 'axios';
import { BASE_API_URL } from './config';

// Derive API URL for pose endpoints
const API_URL = `${BASE_API_URL}/pose`;

export interface PoseKeypoint {
  id: number;
  name: string;
  x: number;
  y: number;
  score: number;
}

export interface PlayerPose {
  keypoints: PoseKeypoint[];
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
  score: number;
}

export interface FramePoseResult {
  frameIndex: number;
  timestamp: number;
  player1Pose: PlayerPose | null;
  player2Pose: PlayerPose | null;
}

export interface PoseDetectionStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  results?: FramePoseResult[];
}

/**
 * Start pose detection for a session
 * This will use the segmentation masks to focus on the players
 */
export const startPoseDetection = async (
  sessionId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await axios.post(`${API_URL}/start-detection`, {
      sessionId,
    });
    return response.data;
  } catch (error) {
    console.error('Error starting pose detection:', error);
    throw error;
  }
};

/**
 * Get pose detection status and results for a session
 */
export const getPoseDetectionStatus = async (
  sessionId: string
): Promise<PoseDetectionStatus> => {
  try {
    const response = await axios.get(`${API_URL}/status/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching pose detection status:', error);
    throw error;
  }
};

/**
 * Get pose results for a specific frame
 */
export const getFramePoseResults = async (
  sessionId: string,
  frameIndex: number
): Promise<FramePoseResult> => {
  try {
    const response = await axios.get(
      `${API_URL}/results/${sessionId}/${frameIndex}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching frame pose results:', error);
    throw error;
  }
};

/**
 * Get pose results for all frames in a session
 */
export const getAllPoseResults = async (
  sessionId: string
): Promise<FramePoseResult[]> => {
  try {
    const response = await axios.get(`${API_URL}/results/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching all pose results:', error);
    throw error;
  }
};
