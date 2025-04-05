// Define types for segmentation functionality
export type MarkerType = 'positive' | 'negative';

export interface Point {
  x: number;
  y: number;
}

export interface FrameData {
  player1PositivePoints: Point[];
  player1NegativePoints: Point[];
  player2PositivePoints: Point[];
  player2NegativePoints: Point[];
}
