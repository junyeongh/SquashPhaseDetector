import { useState, useEffect } from 'react';
import { fetchRootMessage } from './services/api';
import { uploadVideo, getUploadedFiles, getGalleryFiles, FileInfo } from './services/api/video';
import './App.css';

function App() {
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // File upload states
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedVideo, setUploadedVideo] = useState<any | null>(null);

  // File listing states
  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([]);
  const [galleryFiles, setGalleryFiles] = useState<FileInfo[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
  const [fileListError, setFileListError] = useState<string | null>(null);

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
    fetchAllFiles();
  }, []);

  // Function to fetch both uploaded and gallery files
  const fetchAllFiles = async () => {
    setIsLoadingFiles(true);
    setFileListError(null);

    try {
      const [uploads, gallery] = await Promise.all([
        getUploadedFiles(),
        getGalleryFiles()
      ]);

      setUploadedFiles(uploads);
      setGalleryFiles(gallery);
    } catch (error) {
      setFileListError(error instanceof Error ? error.message : 'Failed to load files');
      console.error('Error loading files:', error);
    } finally {
      setIsLoadingFiles(false);
    }
  };

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

      // Refresh file lists after successful upload
      fetchAllFiles();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Function to render file list
  const renderFileList = (files: FileInfo[], title: string) => {
    return (
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>

        {files.length === 0 ? (
          <p className="text-gray-500 italic">No files available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filename</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {files.map((file, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm">{file.filename}</td>
                    <td className="px-4 py-2 text-sm">{formatFileSize(file.size)}</td>
                    <td className="px-4 py-2 text-sm">{file.created}</td>
                    <td className="px-4 py-2 text-sm">
                      <a
                        href={`/api/video/file/${file.filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
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

        {/* Upload Section */}
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

        {/* File Lists Section */}
        <div className="mt-8 border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Video Files</h2>
            <button
              onClick={fetchAllFiles}
              disabled={isLoadingFiles}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
            >
              {isLoadingFiles ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {fileListError && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              <p>{fileListError}</p>
            </div>
          )}

          {isLoadingFiles ? (
            <div className="text-center py-4">
              <p className="text-gray-600">Loading files...</p>
            </div>
          ) : (
            <>
              {renderFileList(uploadedFiles, "Uploaded Files")}
              {renderFileList(galleryFiles, "Gallery Files")}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;