import { useRef, useEffect } from 'react';
import { PlayerPose, PoseKeypoint } from '@/services/api/pose';

interface PoseOverlayProps {
  width: number;
  height: number;
  player1Pose: PlayerPose | null;
  player2Pose: PlayerPose | null;
}

// Map of keypoint connections (limbs) for visualization
// Based on COCO keypoint ordering
const KEYPOINT_CONNECTIONS = [
  [5, 7], // right shoulder to right elbow
  [7, 9], // right elbow to right wrist
  [6, 8], // left shoulder to left elbow
  [8, 10], // left elbow to left wrist
  [5, 6], // right shoulder to left shoulder
  [5, 11], // right shoulder to right hip
  [6, 12], // left shoulder to left hip
  [11, 12], // right hip to left hip
  [11, 13], // right hip to right knee
  [13, 15], // right knee to right ankle
  [12, 14], // left hip to left knee
  [14, 16], // left knee to left ankle
];

const PoseOverlay = ({
  width,
  height,
  player1Pose,
  player2Pose,
}: PoseOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, width, height);

    // Draw player 1 pose (red)
    if (player1Pose) {
      drawPose(ctx, player1Pose, 'red');
    }

    // Draw player 2 pose (blue)
    if (player2Pose) {
      drawPose(ctx, player2Pose, 'blue');
    }
  }, [width, height, player1Pose, player2Pose]);

  const drawPose = (
    ctx: CanvasRenderingContext2D,
    pose: PlayerPose,
    color: string
  ) => {
    const keypoints = pose.keypoints;

    // Draw connections (limbs)
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    KEYPOINT_CONNECTIONS.forEach(([i, j]) => {
      const kpt1 = keypoints.find((kp) => kp.id === i);
      const kpt2 = keypoints.find((kp) => kp.id === j);

      if (kpt1 && kpt2 && kpt1.score > 0.3 && kpt2.score > 0.3) {
        ctx.beginPath();
        ctx.moveTo(kpt1.x, kpt1.y);
        ctx.lineTo(kpt2.x, kpt2.y);
        ctx.stroke();
      }
    });

    // Draw keypoints
    keypoints.forEach((keypoint) => {
      if (keypoint.score > 0.3) {
        // Only draw high-confidence keypoints
        drawKeypoint(ctx, keypoint, color);
      }
    });
  };

  const drawKeypoint = (
    ctx: CanvasRenderingContext2D,
    keypoint: PoseKeypoint,
    color: string
  ) => {
    const { x, y } = keypoint;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.stroke();
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className='pointer-events-none absolute top-0 left-0 z-10'
    />
  );
};

export default PoseOverlay;
