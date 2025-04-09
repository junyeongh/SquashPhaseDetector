import { MarkerInput, MarkerData } from '@/store/segmentationStore';

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

export const relocateMarkerDataToCorrectChunk = (markerInput: MarkerInput, chunks: number[][][]): MarkerInput => {
  // Initialize empty marker data arrays for each chunk
  const markerByChunks: MarkerData[][] = Array(chunks.length)
    .fill(null)
    .map(() => []);

  // Extract all marker data from all chunks and reorganize them
  const allMarkers = markerInput.marker_input.flat();

  // Place each marker into its correct chunk based on frame_idx
  allMarkers.forEach((marker) => {
    const chunkIndex = key_to_chunk_idx(marker.frame_idx, chunks);

    // Only add marker if it belongs to a valid chunk
    if (chunkIndex !== -1) {
      markerByChunks[chunkIndex].push(marker);
    }
  });

  return {
    marker_input: markerByChunks,
  };
};

export const isValidMarkerInput = (markerInput: MarkerInput): boolean => {
  if (!markerInput || !markerInput.marker_input || markerInput.marker_input.length === 0) {
    return false;
  }

  // Check each chunk to ensure it has at least one positive point
  return markerInput.marker_input.every((chunk, index) => {
    // If the chunk is empty and it's not the first chunk (which might be an initialization chunk),
    // consider it invalid
    if (chunk.length === 0 && index !== 0) {
      return false;
    }

    // Check if any marker in this chunk has positive points
    return chunk.some((marker) => {
      // Check if any label array in this marker contains at least one positive point (label value 1)
      return marker.labels.some((labelArray) => labelArray.some((label) => label === 1));
    });
  });
};

// Not used anymore
// export const convertMarkedFramesToMarkerInput = (
//   marked_frames: Map<number, FrameData>,
//   chunks: number[][][]
// ): { markerResult: MarkerInput; isValidMarkerInput: boolean } => {
//   const chunk_validate = Array(chunks.length).fill([false, false]);
//   const result = { marker_input: Array(chunks.length).fill([]) };

//   marked_frames.forEach((value, key) => {
//     const chunk_idx = key_to_chunk_idx(key, chunks);
//     const player1_marker = {
//       frame_idx: key,
//       player_id: 1,
//       points: [
//         [
//           ...value.player1PositivePoints.map((point) => {
//             chunk_validate[chunk_idx][0] = true;
//             return [point.x, point.y];
//           }),
//           ...value.player1NegativePoints.map((point) => {
//             return [point.x, point.y];
//           }),
//         ],
//       ],
//       labels: [
//         [...Array(value.player1PositivePoints.length).fill(1), ...Array(value.player1NegativePoints.length).fill(0)],
//       ],
//     };
//     const player2_marker = {
//       frame_idx: key,
//       player_id: 2,
//       points: [
//         [
//           ...value.player2PositivePoints.map((point) => {
//             chunk_validate[chunk_idx][1] = true;
//             return [point.x, point.y];
//           }),
//           ...value.player2NegativePoints.map((point) => {
//             return [point.x, point.y];
//           }),
//         ],
//       ],
//       labels: [
//         [...Array(value.player2PositivePoints.length).fill(1), ...Array(value.player2NegativePoints.length).fill(0)],
//       ],
//     };
//     result.marker_input[chunk_idx].push(player1_marker, player2_marker);
//   });

//   const isValidMarkerInput = chunk_validate.every((chunk) => chunk.every((valid: boolean) => valid));
//   return { markerResult: result, isValidMarkerInput };
// };
