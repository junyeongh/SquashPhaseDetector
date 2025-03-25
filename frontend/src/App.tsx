import { useState, useEffect } from 'react';
import { fetchRootMessage, uploadVideo } from './services/api';
import './App.css';

function App() {
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // New states for file upload
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedVideo, setUploadedVideo] = useState<any | null>(null);

  useEffect(() => {
    const getApiMessage = async () => {
      try {
        setLoading(true);
        const data = await fetchRootMessage();
        setMessage(data.message);
        setError(null);
      } catch (err) {
        setError('Failed to connect to the API server. Please ensure the backend is running.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    getApiMessage();
  }, []);

  // New handler for file upload
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Basic validation
    if (!file.type.startsWith('video/')) {
      setUploadError('Please select a valid video file');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const response = await uploadVideo(file);
      setUploadedVideo(response);
      console.log('Upload successful:', response);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">Squash Game Phase Detector</h1>

        {loading ? (
          <div className="text-center py-4">
            <p className="text-gray-600">Loading message from backend...</p>
          </div>
        ) : error ? (
          <div className="text-center py-4 bg-red-100 text-red-700 px-4 rounded">
            <p>{error}</p>
          </div>
        ) : (
          <div className="text-center py-4 bg-green-100 text-green-700 px-4 rounded">
            <p className="text-lg font-medium">Backend message: "{message}"</p>
          </div>
        )}

        {/* New Upload Section */}
        <div className="mt-8 border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Upload Squash Video</h2>

          <div className="flex flex-col items-center">
            <label htmlFor="fileInput" className="block mb-2 text-sm font-medium text-gray-700">
              Select Video File:
            </label>
            <input
              type="file"
              id="fileInput"
              accept="video/*"
              onChange={handleFileChange}
              disabled={isUploading}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>

          {isUploading && (
            <div className="mt-4 text-center">
              <p className="text-blue-600">Uploading video...</p>
            </div>
          )}

          {uploadError && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
              <p>{uploadError}</p>
            </div>
          )}

          {uploadedVideo && (
            <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-md">
              <p className="font-medium">Upload successful!</p>
              <p className="text-sm mt-1">Original filename: {uploadedVideo.original_filename}</p>
              <p className="text-sm">Stored as: {uploadedVideo.filename}</p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>This component demonstrates communication with the FastAPI backend</p>
        </div>
      </div>
    </div>
  );
}

export default App;