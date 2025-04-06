import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

import { uploadVideo, FileInfo } from '@/services/api/video';

interface UploadPageProps {
  uploadedFiles: FileInfo[];
  setCompletedSteps: (steps: Set<string>) => void;
  completedSteps: Set<string>;
  fetchUploadedFiles: () => Promise<void>;
}

export default function UploadPage({
  uploadedFiles,
  setCompletedSteps,
  completedSteps,
  fetchUploadedFiles,
}: UploadPageProps) {
  // Router hooks
  const navigate = useNavigate();

  // File upload states
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Handler for file upload
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
      console.log('Upload successful:', response);

      // Refresh file lists after successful upload
      fetchUploadedFiles();
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

  return (
    <div className='flex h-full flex-col'>
      <h1 className='mb-3 text-lg font-medium'>Upload Squash Video</h1>

      <div className='flex-1 rounded-lg border border-gray-200 bg-white p-5'>
        <div className='flex h-full flex-col items-center justify-center'>
          <div className='w-full max-w-md'>
            <label
              htmlFor='fileInput'
              className='block w-full cursor-pointer rounded border-2 border-dashed border-gray-200 p-10 text-center'
            >
              <div className='space-y-2'>
                <div className='text-gray-400'>📤</div>
                <div className='text-sm font-medium text-gray-700'>Drag & drop your video here</div>
                <div className='text-xs text-gray-500'>or click to browse</div>
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
              <div className='mt-3 text-center'>
                <p className='text-xs text-gray-600'>Uploading video...</p>
              </div>
            )}

            {uploadError && (
              <div className='mt-3 rounded-md bg-gray-100 p-2 text-xs text-gray-700'>
                <p>{uploadError}</p>
              </div>
            )}
          </div>

          {uploadedFiles.length > 0 && (
            <div className='mt-6 w-full'>
              <h3 className='mb-2 text-sm font-medium text-gray-700'>Recent Uploads</h3>
              <div className='overflow-x-auto'>
                <table className='min-w-full border border-gray-200 bg-white'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-3 py-2 text-left text-xs font-medium text-gray-500'>Filename</th>
                      <th className='px-3 py-2 text-left text-xs font-medium text-gray-500'>Size</th>
                      <th className='px-3 py-2 text-left text-xs font-medium text-gray-500'>Created</th>
                      <th className='px-3 py-2 text-left text-xs font-medium text-gray-500'>Actions</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200'>
                    {uploadedFiles.slice(0, 5).map((file, index) => (
                      <tr key={index} className='hover:bg-gray-50'>
                        <td className='px-3 py-2 text-left text-xs text-gray-700'>{file.filename}</td>
                        <td className='px-3 py-2 text-left text-xs text-gray-700'>{formatFileSize(file.size)}</td>
                        <td className='px-3 py-2 text-left text-xs text-gray-700'>
                          {dayjs(file.created * 1000).format('YYYY-MM-DD HH:mm')}
                        </td>
                        <td className='px-3 py-2 text-left text-xs'>
                          <button
                            onClick={() => {
                              // Mark upload step as completed
                              const updatedCompletedSteps = new Set(completedSteps);
                              updatedCompletedSteps.add('upload');
                              setCompletedSteps(updatedCompletedSteps);

                              // Navigate to the video detail page with UUID
                              navigate(`/${file.UUID}`);
                            }}
                            className='rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-50'
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
}
