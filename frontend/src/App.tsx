import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  uploadVideo,
  getUploadedFiles,
  getGalleryFiles,
  FileInfo,
} from '@/services/api/video';
import AppLayout from '@/layout/AppLayout';
import { PipelineStep } from '@/layout/Sidebar';
import PreprocessingPage from '@/pages/PreprocessingPage';
import './App.css';

function App() {
  // Router hooks
  const navigate = useNavigate();
  const location = useLocation();

  // API connection state
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pipeline state
  const [activeStep, setActiveStep] = useState<PipelineStep>('upload');
  const [completedSteps, setCompletedSteps] = useState<Set<PipelineStep>>(
    new Set()
  );

  // Map paths to steps
  const pathToStep: Record<string, PipelineStep> = {
    '/': 'upload',
    '/preprocess': 'preprocess',
    '/segmentation': 'segmentation',
    '/pose': 'pose',
    '/game_state': 'game_state',
    '/export': 'export',
  };

  // Map steps to paths
  const stepToPath: Record<PipelineStep, string> = {
    upload: '/',
    preprocess: '/preprocess',
    segmentation: '/segmentation',
    pose: '/pose',
    game_state: '/game_state',
    export: '/export',
  };

  // File upload states
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedVideo, setUploadedVideo] = useState<any | null>(null);

  // File listing states
  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
  const [fileListError, setFileListError] = useState<string | null>(null);

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [processedVideoUrl, setProcessedVideoUrl] = useState<
    string | undefined
  >(undefined);

  // Sync URL with active step
  useEffect(() => {
    const currentPath = location.pathname;
    const step = pathToStep[currentPath];

    if (step && step !== activeStep) {
      setActiveStep(step);
    }
  }, [location, pathToStep, activeStep]);

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
    setIsLoadingFiles(true);
    setFileListError(null);

    try {
      const uploads = await getUploadedFiles();

      setUploadedFiles(uploads);
    } catch (error) {
      setFileListError(
        error instanceof Error ? error.message : 'Failed to load files'
      );
      console.error('Error loading files:', error);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // New handler for file upload
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
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
      handleStepChange('preprocess');

      // Refresh file lists after successful upload
      fetchUploadedFiles();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Function to handle step changes
  const handleStepChange = (step: PipelineStep) => {
    setActiveStep(step);
    navigate(stepToPath[step]);
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

          // Mark preprocess step as completed and move to next step
          const updatedCompletedSteps = new Set(completedSteps);
          updatedCompletedSteps.add('preprocess');
          setCompletedSteps(updatedCompletedSteps);
          handleStepChange('segmentation');
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
      <div className='flex h-full flex-col'>
        <h1 className='mb-4 text-2xl font-bold'>Upload Squash Video</h1>

        <div className='flex-1 rounded-lg bg-white p-6 shadow-md'>
          <div className='flex h-full flex-col items-center justify-center'>
            <div className='w-full max-w-md'>
              <label
                htmlFor='fileInput'
                className='block w-full cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-12 text-center transition-colors hover:border-blue-500'
              >
                <div className='space-y-2'>
                  <div className='text-4xl'>📤</div>
                  <div className='text-lg font-medium'>
                    Drag & drop your video here
                  </div>
                  <div className='text-sm text-gray-500'>
                    or click to browse
                  </div>
                </div>
                <input
                  type='file'
                  id='fileInput'
                  accept='video/*'
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className='hidden'
                />
              </label>

              {isUploading && (
                <div className='mt-4 text-center'>
                  <p className='text-blue-600'>Uploading video...</p>
                </div>
              )}

              {uploadError && (
                <div className='mt-4 rounded-md bg-red-100 p-3 text-red-700'>
                  <p>{uploadError}</p>
                </div>
              )}
            </div>

            {uploadedFiles.length > 0 && (
              <div className='mt-8 w-full'>
                <h3 className='mb-2 text-lg font-semibold'>Recent Uploads</h3>
                <div className='overflow-x-auto'>
                  <table className='min-w-full border border-gray-200 bg-white'>
                    <thead className='bg-gray-50'>
                      <tr>
                        <th className='px-4 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                          Filename
                        </th>
                        <th className='px-4 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                          Size
                        </th>
                        <th className='px-4 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                          Created
                        </th>
                        <th className='px-4 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-200'>
                      {uploadedFiles.slice(0, 5).map((file, index) => (
                        <tr key={index} className='hover:bg-gray-50'>
                          <td className='px-4 py-2 text-left text-sm'>
                            {file.filename}
                          </td>
                          <td className='px-4 py-2 text-left text-sm'>
                            {formatFileSize(file.size)}
                          </td>
                          <td className='px-4 py-2 text-left text-sm'>
                            {file.created}
                          </td>
                          <td className='px-4 py-2 text-left text-sm'>
                            <button
                              onClick={() => {
                                // Set as selected video
                                setUploadedVideo({
                                  filename: file.filename,
                                  original_filename: file.filename,
                                  content_type: 'video/mp4', // Default to video/mp4 since FileInfo doesn't have type
                                });

                                // Mark upload step as completed and move to next step
                                const updatedCompletedSteps = new Set(
                                  completedSteps
                                );
                                updatedCompletedSteps.add('upload');
                                setCompletedSteps(updatedCompletedSteps);
                                handleStepChange('preprocess');
                              }}
                              className='text-blue-600 hover:text-blue-800'
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
          <PreprocessingPage
            originalVideoUrl={`/api/video/file/${uploadedVideo?.filename}`}
            processedVideoUrl={processedVideoUrl}
            isProcessing={isProcessing}
            onProcess={handleProcessVideo}
            processingStatus={processingStatus}
          />
        );
      case 'segmentation':
        return (
          <div className='flex h-full items-center justify-center'>
            <p className='text-gray-500'>
              Segmentation page - Under development
            </p>
          </div>
        );
      case 'pose':
        return (
          <div className='flex h-full items-center justify-center'>
            <p className='text-gray-500'>
              Pose detection page - Under development
            </p>
          </div>
        );
      case 'game_state':
        return (
          <div className='flex h-full items-center justify-center'>
            <p className='text-gray-500'>
              Game state analysis page - Under development
            </p>
          </div>
        );
      case 'export':
        return (
          <div className='flex h-full items-center justify-center'>
            <p className='text-gray-500'>Export page - Under development</p>
          </div>
        );
      default:
        return <div>Unknown step</div>;
    }
  };

  // Show loading screen if checking API connection
  if (loading) {
    return (
      <div className='flex h-screen items-center justify-center bg-gray-100'>
        <div className='rounded-lg bg-white p-8 text-center shadow-lg'>
          <p className='text-xl text-gray-800'>
            Connecting to backend server...
          </p>
        </div>
      </div>
    );
  }

  // Show error screen if API connection failed
  if (error) {
    return (
      <div className='flex h-screen items-center justify-center bg-gray-100'>
        <div className='max-w-2xl rounded-lg bg-white p-8 shadow-lg'>
          <h1 className='mb-4 text-2xl font-bold text-red-600'>
            Connection Error
          </h1>
          <p className='mb-4 text-gray-700'>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className='rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600'
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path='/'
        element={
          <AppLayout
            activeStep={activeStep}
            onStepChange={handleStepChange}
            completedSteps={completedSteps}
          >
            {renderContent()}
          </AppLayout>
        }
      />
      <Route
        path='/preprocess'
        element={
          <AppLayout
            activeStep={activeStep}
            onStepChange={handleStepChange}
            completedSteps={completedSteps}
          >
            {renderContent()}
          </AppLayout>
        }
      />
      <Route
        path='/segmentation'
        element={
          <AppLayout
            activeStep={activeStep}
            onStepChange={handleStepChange}
            completedSteps={completedSteps}
          >
            {renderContent()}
          </AppLayout>
        }
      />
      <Route
        path='/pose'
        element={
          <AppLayout
            activeStep={activeStep}
            onStepChange={handleStepChange}
            completedSteps={completedSteps}
          >
            {renderContent()}
          </AppLayout>
        }
      />
      <Route
        path='/game_state'
        element={
          <AppLayout
            activeStep={activeStep}
            onStepChange={handleStepChange}
            completedSteps={completedSteps}
          >
            {renderContent()}
          </AppLayout>
        }
      />
      <Route
        path='/export'
        element={
          <AppLayout
            activeStep={activeStep}
            onStepChange={handleStepChange}
            completedSteps={completedSteps}
          >
            {renderContent()}
          </AppLayout>
        }
      />
    </Routes>
  );
}

export default App;
