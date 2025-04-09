import { Point, MarkerInput } from '@/store/segmentationStore';

type FrameData = {
  player1PositivePoints: Point[];
  player1NegativePoints: Point[];
  player2PositivePoints: Point[];
  player2NegativePoints: Point[];
};

const key_to_chunk_idx = (key: number, chunks: number[][][]): number => {
  for (let i = 0; i < chunks.length; i++) {
    for (const [start, end] of chunks[i]) {
      if (start <= key && key <= end) {
        return i;
      }
    }
  }
  return -1;
};

export const convertMarkedFramesToMarkerInput = (
  marked_frames: Map<number, FrameData>,
  chunks: number[][][]
): { markerResult: MarkerInput; isValidMarkerInput: boolean } => {
  const chunk_validate = Array(chunks.length).fill([false, false]);
  const result = { marker_input: Array(chunks.length).fill([]) };

  marked_frames.forEach((value, key) => {
    const chunk_idx = key_to_chunk_idx(key, chunks);
    const player1_marker = {
      frame_idx: key,
      player_id: 1,
      points: [
        ...value.player1PositivePoints.map((point) => {
          chunk_validate[chunk_idx][0] = true;
          return [point.x, point.y];
        }),
        ...value.player1NegativePoints.map((point) => {
          return [point.x, point.y];
        }),
      ],
      labels: [
        [...Array(value.player1PositivePoints.length).fill(1), ...Array(value.player1NegativePoints.length).fill(0)],
      ],
    };
    const player2_marker = {
      frame_idx: key,
      player_id: 2,
      points: [
        ...value.player2PositivePoints.map((point) => {
          chunk_validate[chunk_idx][1] = true;
          return [point.x, point.y];
        }),
        ...value.player2NegativePoints.map((point) => {
          return [point.x, point.y];
        }),
      ],
      labels: [
        [...Array(value.player2PositivePoints.length).fill(1), ...Array(value.player2NegativePoints.length).fill(0)],
      ],
    };
    result.marker_input[chunk_idx].push(player1_marker, player2_marker);
  });

  const isValidMarkerInput = chunk_validate.every((chunk) => chunk.every((valid: boolean) => valid));
  return { markerResult: result, isValidMarkerInput };
};
// export const convertMarkedFramesToMarkerInput = (
//   marked_frames: Map<number, FrameData>,
//   chunks: number[][][]
// ): { markerResult: MarkerInput; isValidMarkerInput: boolean } => {
//   const chunk_validate = Array(chunks.length)
//     .fill(0)
//     .map(() => [false, false]);
//   const markerResult: MarkerInput = {
//     marker_input: Array(chunks.length)
//       .fill(0)
//       .map(() => []),
//   };

//   marked_frames.forEach((value, key) => {
//     const chunk_idx = key_to_chunk_idx(key, chunks);

//     if (chunk_idx === undefined) {
//       return;
//     }

//     // Convert Point objects to Coordinates format
//     const player1PositiveCoordinates: Coordinates[] = value.player1PositivePoints.map((point: Point) => {
//       chunk_validate[chunk_idx][0] = true;
//       return [point.x, point.y];
//     });

//     const player1NegativeCoordinates: Coordinates[] = value.player1NegativePoints.map((point: Point) => {
//     return  [point.x, point.y];
//     });

//     const player2PositiveCoordinates: Coordinates[] = value.player2PositivePoints.map((point: Point) => {
//       chunk_validate[chunk_idx][1] = true;
//       return [point.x, point.y];
//     });

//     const player2NegativeCoordinates: Coordinates[] = value.player2NegativePoints.map((point: Point) => {
//       return [point.x, point.y];
//     });

//     const player1_marker: MarkerData = {
//       frame_idx: key,
//       player_id: 1,
//       points: [[...player1PositiveCoordinates, ...player1NegativeCoordinates]],
//       labels: [
//         [
//           ...Array(value.player1PositivePoints.length).fill(1 as Label),
//           ...Array(value.player1NegativePoints.length).fill(0 as Label),
//         ],
//       ],
//     };

//     const player2_marker: MarkerData = {
//       frame_idx: key,
//       player_id: 2,
//       points: [[...player2PositiveCoordinates, ...player2NegativeCoordinates]],
//       labels: [
//         [
//           ...Array(value.player2PositivePoints.length).fill(1 as Label),
//           ...Array(value.player2NegativePoints.length).fill(0 as Label),
//         ],
//       ],
//     };

//     markerResult.marker_input[chunk_idx].push(player1_marker, player2_marker);
//   });

//   const isValidMarkerInput = chunk_validate.every((chunk) => chunk.every((valid) => valid));
//   return { markerResult, isValidMarkerInput };
// };
