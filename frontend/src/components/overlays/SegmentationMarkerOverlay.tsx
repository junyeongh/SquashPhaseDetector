import { useRef, useEffect, MouseEvent } from 'react';
import { Point } from '@/services/api/segmentation';
import { MarkerType } from '@/components/processSidemenu';

interface SegmentationMarkerOverlayProps {
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
  onRemovePoint?: (player: 1 | 2, markerType: MarkerType, pointIndex: number) => void;
  isPlaying?: boolean;
  isInMainView?: boolean;
}

const SegmentationMarkerOverlay = ({
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
  onRemovePoint,
  isPlaying = false,
  isInMainView = true,
}: SegmentationMarkerOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Check if a point is near another point (for click removal)
  const isNearPoint = (x: number, y: number, point: Point, threshold = 10): boolean => {
    const dx = point.x - x;
    const dy = point.y - y;
    return Math.sqrt(dx * dx + dy * dy) <= threshold;
  };

  // Find if a point was clicked for removal
  const findClickedPoint = (x: number, y: number): { player: 1 | 2; type: MarkerType; index: number } | null => {
    if (segmentationModel === 'SAM2') {
      // Check player 1 positive points
      const p1PosIndex = player1PositivePoints.findIndex((point) => isNearPoint(x, y, point));
      if (p1PosIndex !== -1) return { player: 1, type: 'positive', index: p1PosIndex };

      // Check player 1 negative points
      const p1NegIndex = player1NegativePoints.findIndex((point) => isNearPoint(x, y, point));
      if (p1NegIndex !== -1) return { player: 1, type: 'negative', index: p1NegIndex };

      // Check player 2 positive points
      const p2PosIndex = player2PositivePoints.findIndex((point) => isNearPoint(x, y, point));
      if (p2PosIndex !== -1) return { player: 2, type: 'positive', index: p2PosIndex };

      // Check player 2 negative points
      const p2NegIndex = player2NegativePoints.findIndex((point) => isNearPoint(x, y, point));
      if (p2NegIndex !== -1) return { player: 2, type: 'negative', index: p2NegIndex };
    } else {
      // Check player 1 points
      const p1Index = player1Points.findIndex((point) => isNearPoint(x, y, point));
      if (p1Index !== -1) return { player: 1, type: 'positive', index: p1Index };

      // Check player 2 points
      const p2Index = player2Points.findIndex((point) => isNearPoint(x, y, point));
      if (p2Index !== -1) return { player: 2, type: 'positive', index: p2Index };
    }

    return null;
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
    const clickedPoint = findClickedPoint(x, y);

    if (clickedPoint && onRemovePoint) {
      // Remove the clicked point
      onRemovePoint(clickedPoint.player, clickedPoint.type, clickedPoint.index);
    } else {
      // Add a new point
      onAddPoint({ x, y });
    }
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
        drawPoint(ctx, point, 'rgba(0, 200, 0, 0.8)', '+1');
      });

      // Draw player 1 negative points (red)
      player1NegativePoints.forEach((point) => {
        drawPoint(ctx, point, 'rgba(200, 0, 0, 0.8)', '-1');
      });

      // Draw player 2 positive points (green)
      player2PositivePoints.forEach((point) => {
        drawPoint(ctx, point, 'rgba(0, 200, 0, 0.8)', '+2');
      });

      // Draw player 2 negative points (red)
      player2NegativePoints.forEach((point) => {
        drawPoint(ctx, point, 'rgba(200, 0, 0, 0.8)', '-2');
      });
    } else {
      // Draw player 1 points (red)
      player1Points.forEach((point) => {
        drawPoint(ctx, point, 'rgba(255, 0, 0, 0.8)', '1');
      });

      // Draw player 2 points (blue)
      player2Points.forEach((point) => {
        drawPoint(ctx, point, 'rgba(0, 0, 255, 0.8)', '2');
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
  const drawPoint = (ctx: CanvasRenderingContext2D, point: Point, color: string, label?: string) => {
    const { x, y } = point;

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

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`absolute top-0 left-0 z-20 ${
        isPlaying || !isInMainView ? 'cursor-default' : 'cursor-crosshair hover:opacity-95'
      }`}
      onClick={handleCanvasClick}
      aria-label='Interactive segmentation overlay'
      tabIndex={0}
    />
  );
};

export default SegmentationMarkerOverlay;
