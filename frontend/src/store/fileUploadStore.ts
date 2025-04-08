import { create } from 'zustand';
import { getUploadedFiles, FileInfo } from '@/services/api/video';

interface FileUploadState {
  uploadedFiles: FileInfo[];
  isLoading: boolean;
  error: string | null;
  fetchUploadedFiles: () => Promise<void>;
  addUploadedFile: (file: FileInfo) => void;
  clearUploadedFiles: () => void;
}

const useFileUploadStore = create<FileUploadState>((set) => ({
  uploadedFiles: [],
  isLoading: false,
  error: null,
  fetchUploadedFiles: async () => {
    try {
      set({ isLoading: true, error: null });
      const uploads = await getUploadedFiles();
      set({ uploadedFiles: uploads, isLoading: false });
    } catch (error) {
      console.error('Error loading files:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load files',
        isLoading: false,
      });
    }
  },
  addUploadedFile: (file: FileInfo) => {
    set((state) => ({
      uploadedFiles: [file, ...state.uploadedFiles],
    }));
  },
  clearUploadedFiles: () => {
    set({ uploadedFiles: [] });
  },
}));

// Helper selectors for common state access patterns
export const selectUploadedFiles = (state: FileUploadState) => state.uploadedFiles;
export const selectIsLoading = (state: FileUploadState) => state.isLoading;
export const selectError = (state: FileUploadState) => state.error;

export default useFileUploadStore;
