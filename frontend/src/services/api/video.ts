import axios from 'axios';
import { BASE_API_URL } from './config';

const API_URL = `${BASE_API_URL}/video`;

export async function uploadVideo(file: File): Promise<any> {
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
