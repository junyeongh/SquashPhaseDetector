import React from 'react';
import { FileJson, Video, FileText } from 'lucide-react';
import { ExportStageProps } from '../types';
import ProcessingIndicator from '../ui/ProcessingIndicator';

const ExportStage: React.FC<ExportStageProps> = ({
  isProcessing,
  processingStatus,
  showSkipButton,
  onSkipStage,
  onExportJson,
  onExportVideo,
  onExportReport,
}) => {
  if (isProcessing) {
    return (
      <ProcessingIndicator
        isProcessing={isProcessing}
        processingStatus={processingStatus}
        showSkipButton={showSkipButton}
        onSkipStage={onSkipStage}
      />
    );
  }

  return (
    <div className='space-y-3'>
      <div className='rounded-md border border-gray-200 bg-gray-50 p-3'>
        <h4 className='mb-2 text-xs font-medium text-gray-700'>Export Options</h4>
        <p className='mb-3 text-xs text-gray-600'>Export your analysis results in various formats.</p>

        <div className='space-y-2'>
          <button
            onClick={onExportJson}
            disabled={isProcessing || !onExportJson}
            className='flex w-full items-center justify-center gap-2 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50'
          >
            <FileJson className='h-3.5 w-3.5' />
            Export JSON
          </button>

          <button
            onClick={onExportVideo}
            disabled={isProcessing || !onExportVideo}
            className='flex w-full items-center justify-center gap-2 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50'
          >
            <Video className='h-3.5 w-3.5' />
            Generate Video
          </button>

          <button
            onClick={onExportReport}
            disabled={isProcessing || !onExportReport}
            className='flex w-full items-center justify-center gap-2 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50'
          >
            <FileText className='h-3.5 w-3.5' />
            Generate Report
          </button>
        </div>
      </div>

      <div className='rounded-lg border border-blue-100 bg-blue-50 p-3'>
        <p className='text-xs text-blue-700'>
          <span className='font-medium'>Note:</span> Export functionality is currently in development and will be
          available soon.
        </p>
      </div>
    </div>
  );
};

export default ExportStage;
