import { useRef, useEffect, MouseEvent } from 'react';
import { Point } from '@/services/api/segmentation';
import { MarkerType } from '@/components/ProcessSidemenu';

interface SegmentationOverlayProps {
  width: number;
  height: number;
  activePlayer: 1 | 2;
  activeMarkerType: MarkerType;
  player1PositivePoints: Point[];
  player1NegativePoints: Point[];
  player2PositivePoints: Point[];
  player2NegativePoints: Point[];
  player1Points: Point[];
  player2Points: Point[];
  segmentationModel: string;
  onAddPoint: (point: Point) => void;
}

const SegmentationOverlay = ({
  width,
  height,
  player1PositivePoints,
  player1NegativePoints,
  player2PositivePoints,
  player2NegativePoints,
  player1Points,
  player2Points,
  segmentationModel,
  onAddPoint,
}: SegmentationOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Handle canvas click to add points
  const handleCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get mouse position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Add the point using the callback
    onAddPoint({ x, y });
  };

  // Draw points on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, width, height);

    if (segmentationModel === 'SAM2') {
      // Draw player 1 positive points (green)
      player1PositivePoints.forEach((point) => {
        drawPoint(ctx, point, 'rgba(0, 200, 0, 0.8)', '+');
      });

      // Draw player 1 negative points (red)
      player1NegativePoints.forEach((point) => {
        drawPoint(ctx, point, 'rgba(200, 0, 0, 0.8)', '-');
      });

      // Draw player 2 positive points (green)
      player2PositivePoints.forEach((point) => {
        drawPoint(ctx, point, 'rgba(0, 200, 0, 0.8)', '+');
      });

      // Draw player 2 negative points (red)
      player2NegativePoints.forEach((point) => {
        drawPoint(ctx, point, 'rgba(200, 0, 0, 0.8)', '-');
      });
    } else {
      // Draw player 1 points (red)
      player1Points.forEach((point) => {
        drawPoint(ctx, point, 'rgba(255, 0, 0, 0.8)');
      });

      // Draw player 2 points (blue)
      player2Points.forEach((point) => {
        drawPoint(ctx, point, 'rgba(0, 0, 255, 0.8)');
      });
    }
  }, [
    width,
    height,
    player1PositivePoints,
    player1NegativePoints,
    player2PositivePoints,
    player2NegativePoints,
    player1Points,
    player2Points,
    segmentationModel,
  ]);

  // Draw a point with label
  const drawPoint = (
    ctx: CanvasRenderingContext2D,
    point: Point,
    color: string,
    label?: string
  ) => {
    const { x, y } = point;

    // Draw circle
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.fill();

    // Draw border
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw label if provided (for SAM2 markers)
    if (label) {
      ctx.fillStyle = 'white';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x, y);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className='absolute top-0 left-0 z-20 cursor-crosshair'
      onClick={handleCanvasClick}
    />
  );
};

export default SegmentationOverlay;
