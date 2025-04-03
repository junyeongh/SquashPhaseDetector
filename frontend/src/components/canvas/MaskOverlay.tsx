import { useRef, useEffect } from 'react';
import { SegmentationMask } from '@/services/api/segmentation';
import { decodeRLE, createMaskImageData } from '@/utils/rleUtils';

interface MaskLayerProps {
  width: number;
  height: number;
  player1Mask: SegmentationMask | null;
  player2Mask: SegmentationMask | null;
  player1Color: [number, number, number, number];
  player2Color: [number, number, number, number];
}

const MaskLayer = ({
  width,
  height,
  player1Mask,
  player2Mask,
  player1Color = [255, 0, 0, 0.5], // Red with 50% opacity
  player2Color = [0, 0, 255, 0.5], // Blue with 50% opacity
}: MaskLayerProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Draw masks when they change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, width, height);

    // Draw player 1 mask if available
    if (player1Mask) {
      try {
        // Decode the RLE mask to a binary mask
        const binaryMask = decodeRLE(player1Mask);

        // Create an ImageData object with the specified color
        const imageData = createMaskImageData(
          binaryMask,
          player1Mask.size[1], // width
          player1Mask.size[0], // height
          player1Color
        );

        // Create a temporary canvas to handle scaling if needed
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = player1Mask.size[1];
        tempCanvas.height = player1Mask.size[0];
        const tempCtx = tempCanvas.getContext('2d');

        if (tempCtx) {
          // Draw the mask on the temporary canvas
          tempCtx.putImageData(imageData, 0, 0);

          // Draw the temporary canvas onto the main canvas, scaling if necessary
          ctx.drawImage(tempCanvas, 0, 0, width, height);
        }
      } catch (error) {
        console.error('Error rendering player 1 mask:', error);
      }
    }

    // Draw player 2 mask if available
    if (player2Mask) {
      try {
        // Decode the RLE mask to a binary mask
        const binaryMask = decodeRLE(player2Mask);

        // Create an ImageData object with the specified color
        const imageData = createMaskImageData(
          binaryMask,
          player2Mask.size[1], // width
          player2Mask.size[0], // height
          player2Color
        );

        // Create a temporary canvas to handle scaling if needed
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = player2Mask.size[1];
        tempCanvas.height = player2Mask.size[0];
        const tempCtx = tempCanvas.getContext('2d');

        if (tempCtx) {
          // Draw the mask on the temporary canvas
          tempCtx.putImageData(imageData, 0, 0);

          // Draw the temporary canvas onto the main canvas, scaling if necessary
          ctx.drawImage(tempCanvas, 0, 0, width, height);
        }
      } catch (error) {
        console.error('Error rendering player 2 mask:', error);
      }
    }
  }, [width, height, player1Mask, player2Mask, player1Color, player2Color]);

  return (
    <canvas ref={canvasRef} width={width} height={height} className='pointer-events-none absolute top-0 left-0 z-10' />
  );
};

export default MaskLayer;
