import React from 'react';
import { FileJson, FileText } from 'lucide-react';
import { ExportStageProps } from '../types';
import ProcessingIndicator from '../ui/ProcessingIndicator';

const ExportStage: React.FC<ExportStageProps> = ({
  isProcessing,
  processingStatus,
  showSkipButton,
  onSkipStage,
  onExportJson,
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
            disabled={isProcessing}
            className='flex w-full items-center justify-center gap-2 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50'
          >
            <FileJson className='h-3.5 w-3.5' />
            Export Data
          </button>

          <button
            onClick={onExportReport}
            disabled={isProcessing}
            className='flex w-full items-center justify-center gap-2 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50'
          >
            <FileText className='h-3.5 w-3.5' />
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportStage;
