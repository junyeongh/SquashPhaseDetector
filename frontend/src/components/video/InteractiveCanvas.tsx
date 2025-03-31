import { useState, useRef, useEffect } from 'react';
import { Point } from '@/services/api/segmentation';

interface InteractiveCanvasProps {
  imageUrl: string;
  width: number;
  height: number;
  player1Points: Point[];
  player2Points: Point[];
  onPlayer1PointsChange: (points: Point[]) => void;
  onPlayer2PointsChange: (points: Point[]) => void;
  activePlayer: 1 | 2;
  setActivePlayer: (player: 1 | 2) => void;
  disabled?: boolean;
}

const InteractiveCanvas = ({
  imageUrl,
  width,
  height,
  player1Points,
  player2Points,
  onPlayer1PointsChange,
  onPlayer2PointsChange,
  activePlayer,
  setActivePlayer,
  disabled = false,
}: InteractiveCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      setImage(img);
      drawCanvas();
    };
  }, [imageUrl]);

  // Redraw canvas when points change
  useEffect(() => {
    drawCanvas();
  }, [player1Points, player2Points, activePlayer, image]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Draw player 1 points (red)
    ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
    ctx.strokeStyle = 'rgba(255, 0, 0, 1)';
    drawPoints(ctx, player1Points, activePlayer === 1);

    // Draw player 2 points (blue)
    ctx.fillStyle = 'rgba(0, 0, 255, 0.7)';
    ctx.strokeStyle = 'rgba(0, 0, 255, 1)';
    drawPoints(ctx, player2Points, activePlayer === 2);
  };

  const drawPoints = (ctx: CanvasRenderingContext2D, points: Point[], isActive: boolean) => {
    points.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, isActive ? 6 : 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Scale coordinates if canvas display size differs from its internal size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const scaledX = x * scaleX;
    const scaledY = y * scaleY;

    const newPoint = { x: scaledX, y: scaledY };

    if (activePlayer === 1) {
      onPlayer1PointsChange([...player1Points, newPoint]);
    } else {
      onPlayer2PointsChange([...player2Points, newPoint]);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    setIsDrawing(true);
    handleCanvasClick(e);
  };

  const handleMouseMove = () => {
    if (!isDrawing || disabled) return;
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  return (
    <div className='relative'>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`cursor-crosshair ${disabled ? 'cursor-not-allowed' : ''}`}
      />
      <div className='absolute bottom-4 left-4 flex gap-2'>
        <button
          className={`rounded-full p-2 ${activePlayer === 1 ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-800'}`}
          onClick={() => setActivePlayer(1)}
          disabled={disabled}
        >
          Player 1
        </button>
        <button
          className={`rounded-full p-2 ${activePlayer === 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
          onClick={() => setActivePlayer(2)}
          disabled={disabled}
        >
          Player 2
        </button>
      </div>
      <div className='bg-opacity-70 absolute top-4 right-4 rounded bg-gray-800 p-2 text-xs text-white'>
        {activePlayer === 1 ? 'Player 1' : 'Player 2'} points:{' '}
        {activePlayer === 1 ? player1Points.length : player2Points.length}
      </div>
      {player1Points.length > 0 && (
        <button
          className='bg-opacity-70 absolute top-12 right-4 rounded bg-red-500 p-1 text-xs text-white'
          onClick={() => onPlayer1PointsChange(player1Points.slice(0, -1))}
          disabled={disabled || player1Points.length === 0}
        >
          Undo Player 1
        </button>
      )}
      {player2Points.length > 0 && (
        <button
          className='bg-opacity-70 absolute top-20 right-4 rounded bg-blue-500 p-1 text-xs text-white'
          onClick={() => onPlayer2PointsChange(player2Points.slice(0, -1))}
          disabled={disabled || player2Points.length === 0}
        >
          Undo Player 2
        </button>
      )}
    </div>
  );
};

export default InteractiveCanvas;
