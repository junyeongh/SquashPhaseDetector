import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '@/layout/Sidebar';
import MainContent from '@/layout/MainContent';
import { getUploadedFiles, FileInfo } from '@/services/api/video';
import VideoDetailPage from '@/pages/VideoDetailPage';
import UploadPage from '@/pages/UploadPage';
import './App.css';

function App() {
  // API connection state
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pipeline state - needed for marking the upload step as completed
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // File upload states
  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([]);

  useEffect(() => {
    const getApiMessage = async () => {
      try {
        setLoading(true);
        setError(null);
      } catch (err) {
        setError(
          'Failed to connect to the API server. Please ensure the backend is running.'
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    getApiMessage();
    fetchUploadedFiles();
  }, []);

  // Function to fetch both uploaded and gallery files
  const fetchUploadedFiles = async () => {
    try {
      const uploads = await getUploadedFiles();
      setUploadedFiles(uploads);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  // Show loading screen if checking API connection
  if (loading) {
    return (
      <div className='flex h-screen items-center justify-center bg-gray-200'>
        <div className='rounded bg-gray-100 p-8 text-center'>
          <p className='text-xl text-gray-600'>
            Connecting to backend server...
          </p>
        </div>
      </div>
    );
  }

  // Show error screen if API connection failed
  if (error) {
    return (
      <div className='flex h-screen items-center justify-center bg-gray-200'>
        <div className='max-w-2xl rounded bg-gray-100 p-8'>
          <h1 className='mb-4 text-2xl font-bold text-gray-700'>
            Connection Error
          </h1>
          <p className='mb-4 text-gray-600'>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className='rounded bg-gray-500 px-4 py-2 text-gray-200'
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='app'>
      {error && (
        <div className='flex h-screen w-screen items-center justify-center bg-gray-100'>
          <div className='mx-auto max-w-md rounded-lg border border-red-200 bg-white p-6 shadow-sm'>
            <div className='mb-2 text-red-600'>Connection Error</div>
            <p className='text-sm text-gray-700'>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className='mt-4 rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600'
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {!error && (
        <div className='flex h-screen w-full flex-row overflow-hidden'>
          <Sidebar uploadedFiles={uploadedFiles} />
          <MainContent>
            <Routes>
              <Route
                path='/'
                element={
                  <UploadPage
                    uploadedFiles={uploadedFiles}
                    setCompletedSteps={setCompletedSteps}
                    completedSteps={completedSteps}
                    fetchUploadedFiles={fetchUploadedFiles}
                  />
                }
              />
              <Route path='/:uuid' element={<VideoDetailPage />} />
            </Routes>
          </MainContent>
        </div>
      )}
    </div>
  );
}

export default App;
