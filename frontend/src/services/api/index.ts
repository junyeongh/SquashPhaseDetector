import axios from 'axios';
import { BASE_API_URL } from './config';

export const fetchRootMessage = async (): Promise<{ message: string }> => {
  try {
    const response = await axios.get(`${BASE_API_URL}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching root message:', error);
    throw error;
  }
};
