import { useRef, useEffect, MouseEvent } from 'react';
import useSegmentationStore, { Point } from '@/store/segmentationStore';

interface SegmentationMarkerOverlayProps {
  width: number;
  height: number;
  isPlaying?: boolean;
  isInMainView?: boolean;
}

const SegmentationMarkerOverlay = ({
  width,
  height,
  isPlaying = false,
  isInMainView = true,
}: SegmentationMarkerOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Get state and actions from the store using new implementation
  const { segmentationModel, currentFrameIndex, markers, addMarker, removeMarker } = useSegmentationStore();

  // Filter markers for current frame
  const currentFrameMarkers = Array.from(markers.values()).filter((marker) => marker.frameIdx === currentFrameIndex);

  // Check if a point is near another point (for click removal)
  const isNearPoint = (x: number, y: number, point: Point, threshold = 10): boolean => {
    // Convert relative coordinates (ratios) to absolute pixel values for comparison
    const pointX = point.x * width;
    const pointY = point.y * height;

    const dx = pointX - x;
    const dy = pointY - y;
    return Math.sqrt(dx * dx + dy * dy) <= threshold;
  };

  // Find if a point was clicked for removal
  const findClickedPointId = (x: number, y: number): string | null => {
    const clickedMarker = currentFrameMarkers.find((marker) => isNearPoint(x, y, marker.point));

    return clickedMarker?.id || null;
  };

  // Handle canvas click to add or remove points
  const handleCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
    // Stop event propagation to prevent clicks from reaching the video player
    e.stopPropagation();

    // If video is playing or not in main view, don't add or remove markers
    if (isPlaying || !isInMainView) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get mouse position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if user clicked on an existing point
    const clickedPointId = findClickedPointId(x, y);

    if (clickedPointId) {
      // Remove the clicked point using the new method
      removeMarker(clickedPointId);
    } else {
      // Add a new point using relative coordinates (ratios)
      addMarker({ x: x / width, y: y / height });
    }
  };

  // Draw points on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw a point with label
    const drawPoint = (ctx: CanvasRenderingContext2D, point: Point, color: string, label?: string) => {
      // Convert relative coordinates (ratios) back to absolute pixel values
      const x = point.x * width;
      const y = point.y * height;

      // Draw circle
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fill();

      // Draw border
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.stroke();

      // Draw label if provided
      if (label) {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x, y);
      }
    };

    // Clear the canvas
    ctx.clearRect(0, 0, width, height);

    // Draw all markers for the current frame
    currentFrameMarkers.forEach((marker) => {
      const color = marker.markerType === 'positive' ? 'rgba(0, 200, 0, 0.8)' : 'rgba(200, 0, 0, 0.8)';
      const label = `${marker.markerType === 'positive' ? '+' : '-'}${marker.playerId}`;
      drawPoint(ctx, marker.point, color, label);
    });

    // If not in main view, draw warning overlay
    if (!isInMainView && !isPlaying) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, width, height);

      // Draw warning message
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Cannot add markers: Not in main view', width / 2, height / 2);
    }
  }, [width, height, currentFrameMarkers, segmentationModel, isInMainView, isPlaying]);

  return (
    <div className='absolute inset-0 z-20 flex items-center justify-center'>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={`${isPlaying || !isInMainView ? 'cursor-default' : 'cursor-crosshair hover:opacity-95'}`}
        onClick={handleCanvasClick}
        aria-label='Interactive segmentation overlay'
        tabIndex={0}
      />
    </div>
  );
};

export default SegmentationMarkerOverlay;
