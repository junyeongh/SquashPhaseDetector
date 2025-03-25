import { useState, useEffect } from 'react';
import { fetchRootMessage } from './services/api';
import { uploadVideo, getUploadedFiles, getGalleryFiles, FileInfo } from './services/api/video';
import AppLayout from './components/layout/AppLayout';
import { PipelineStep } from './components/layout/Sidebar';
import ProcessingPage from './pages/ProcessingPage';
import './App.css';

function App() {
  // API connection state
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pipeline state
  const [activeStep, setActiveStep] = useState<PipelineStep>('upload');
  const [completedSteps, setCompletedSteps] = useState<Set<PipelineStep>>(new Set());

  // File upload states
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedVideo, setUploadedVideo] = useState<any | null>(null);

  // File listing states
  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([]);
  const [galleryFiles, setGalleryFiles] = useState<FileInfo[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
  const [fileListError, setFileListError] = useState<string | null>(null);

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [processedVideoUrl, setProcessedVideoUrl] = useState<string | undefined>(undefined);

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

      // Mark upload step as completed and move to next step
      const updatedCompletedSteps = new Set(completedSteps);
      updatedCompletedSteps.add('upload');
      setCompletedSteps(updatedCompletedSteps);
      setActiveStep('preprocess');

      // Refresh file lists after successful upload
      fetchAllFiles();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Function to handle step changes
  const handleStepChange = (step: PipelineStep) => {
    setActiveStep(step);
  };

  // Mock function for processing video (simulate API call)
  const handleProcessVideo = () => {
    setIsProcessing(true);
    setProcessingStatus('Preprocessing video...');
    
    // Simulate processing with timeout
    setTimeout(() => {
      setProcessingStatus('Detecting main camera angle...');
      
      setTimeout(() => {
        setProcessingStatus('Filtering frames...');
        
        setTimeout(() => {
          setIsProcessing(false);
          setProcessedVideoUrl('/api/video/file/' + uploadedVideo?.filename);
          
          // Mark preprocess step as completed
          const updatedCompletedSteps = new Set(completedSteps);
          updatedCompletedSteps.add('preprocess');
          setCompletedSteps(updatedCompletedSteps);
          
        }, 2000);
      }, 2000);
    }, 2000);
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Function to render upload page
  const renderUploadPage = () => {
    return (
      <div className="h-full flex flex-col">
        <h1 className="text-2xl font-bold mb-4">Upload Squash Video</h1>
        
        <div className="flex-1 bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-full max-w-md">
              <label 
                htmlFor="fileInput" 
                className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 transition-colors"
              >
                <div className="space-y-2">
                  <div className="text-4xl">📤</div>
                  <div className="text-lg font-medium">Drag & drop your video here</div>
                  <div className="text-sm text-gray-500">or click to browse</div>
                </div>
                <input
                  type="file"
                  id="fileInput"
                  accept="video/*"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
              
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
            </div>
            
            {uploadedFiles.length > 0 && (
              <div className="mt-8 w-full">
                <h3 className="text-lg font-semibold mb-2">Recent Uploads</h3>
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
                      {uploadedFiles.slice(0, 5).map((file, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-left text-sm">{file.filename}</td>
                          <td className="px-4 py-2 text-left text-sm">{formatFileSize(file.size)}</td>
                          <td className="px-4 py-2 text-left text-sm">{file.created}</td>
                          <td className="px-4 py-2 text-left text-sm">
                            <button 
                              onClick={() => {
                                // Set as selected video
                                setUploadedVideo({
                                  filename: file.filename,
                                  original_filename: file.filename,
                                  content_type: file.type
                                });
                                
                                // Mark upload step as completed and move to next step
                                const updatedCompletedSteps = new Set(completedSteps);
                                updatedCompletedSteps.add('upload');
                                setCompletedSteps(updatedCompletedSteps);
                                setActiveStep('preprocess');
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Select
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render content based on active step
  const renderContent = () => {
    switch (activeStep) {
      case 'upload':
        return renderUploadPage();
      case 'preprocess':
        return (
          <ProcessingPage
            originalVideoUrl={`/api/video/file/${uploadedVideo?.filename}`}
            processedVideoUrl={processedVideoUrl}
            isProcessing={isProcessing}
            onProcess={handleProcessVideo}
            processingStatus={processingStatus}
          />
        );
      case 'segmentation':
        return (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500">Segmentation page - Under development</p>
          </div>
        );
      case 'pose':
        return (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500">Pose detection page - Under development</p>
          </div>
        );
      case 'gamestate':
        return (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500">Game state analysis page - Under development</p>
          </div>
        );
      case 'export':
        return (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500">Export page - Under development</p>
          </div>
        );
      default:
        return <div>Unknown step</div>;
    }
  };

  // Show loading screen if checking API connection
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <p className="text-gray-800 text-xl">Connecting to backend server...</p>
        </div>
      </div>
    );
  }

  // Show error screen if API connection failed
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-2xl p-8 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Connection Error</h1>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppLayout
      activeStep={activeStep}
      onStepChange={handleStepChange}
      completedSteps={completedSteps}
    >
      {renderContent()}
    </AppLayout>
  );
}

export default App;
