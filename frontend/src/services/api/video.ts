import axios from 'axios';
import { BASE_API_URL } from './config';

const API_URL = `${BASE_API_URL}/video`;

export interface MainviewTimestamp {
  start: number;
  end: number;
  start_frame: number;
  end_frame: number;
}

export const getMainviewTimestamps = async (
  videoUuid: string
): Promise<MainviewTimestamp[]> => {
  try {
    const response = await axios.get(`${API_URL}/mainview/${videoUuid}`);
    return response.data.timestamps || [];
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('Error fetching mainview timestamps:', error.response.data);
      throw new Error(
        error.response.data.detail || 'Failed to fetch mainview timestamps'
      );
    } else {
      console.error('Error fetching mainview timestamps:', error);
      throw error;
    }
  }
};

export const generateMainView = async (
  videoUuid: string
): Promise<{ status: string; video_uuid: string }> => {
  try {
    const response = await axios.post(`${API_URL}/mainview/${videoUuid}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('Error generating main view:', error.response.data);
      throw new Error(
        error.response.data.detail || 'Failed to generate main view'
      );
    } else {
      console.error('Error generating main view:', error);
      throw error;
    }
  }
};

export interface UploadResponse {
  UUID: string;
  original_filename: string;
  filename: string;
  content_type: string;
}

export async function uploadVideo(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post(`${API_URL}/upload/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('Error uploading video:', error.response.data);
      throw new Error(error.response.data.detail || 'Failed to upload video');
    } else {
      console.error('Error uploading video:', error);
      throw error;
    }
  }
}

export interface FileInfo {
  uuid: string;
  filename: string;
  path: string;
  size: number;
  created: number; // Unix timestamp
}

export const getUploadedFiles = async (): Promise<FileInfo[]> => {
  try {
    const response = await axios.get(`${API_URL}/upload`);
    return response.data.files || [];
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('Error fetching uploaded files:', error.response.data);
      throw new Error(
        error.response.data.detail || 'Failed to fetch uploaded files'
      );
    } else {
      console.error('Error fetching uploaded files:', error);
      throw error;
    }
  }
};

export interface ProcessingStatus {
  status: string;
  is_processing: boolean;
  has_mainview: boolean;
  video_uuid: string;
}

export const getProcessingStatus = async (
  videoUuid: string
): Promise<ProcessingStatus> => {
  try {
    const response = await axios.get(`${API_URL}/mainview/${videoUuid}/status`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('Error checking processing status:', error.response.data);
      throw new Error(
        error.response.data.detail || 'Failed to check processing status'
      );
    } else {
      console.error('Error checking processing status:', error);
      throw error;
    }
  }
};

// Add an SSE function for live processing updates
export const createProcessingEventSource = (videoUuid: string): EventSource => {
  const eventSource = new EventSource(
    `${API_URL}/mainview/${videoUuid}/events`
  );
  console.log(`Created SSE connection for video: ${videoUuid}`);
  return eventSource;
};
