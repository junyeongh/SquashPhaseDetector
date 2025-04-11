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
