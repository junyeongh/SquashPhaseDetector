import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const fetchRootMessage = async (): Promise<{message: string}> => {
  try {
    const response = await axios.get(`${API_URL}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching root message:', error);
    throw error;
  }
};