/**
 * Utilities for working with Run-Length Encoded (RLE) masks from SAM2
 */

import { SegmentationMask } from '@/services/api/segmentation';

/**
 * Decode RLE mask data into a binary mask array
 *
 * @param mask - RLE encoded mask data
 * @returns Binary mask as Uint8Array with 1 for mask pixels, 0 for background
 */
export const decodeRLE = (mask: SegmentationMask): Uint8Array => {
  const { counts, size } = mask;
  const [height, width] = size;
  const totalPixels = height * width;
  const binaryMask = new Uint8Array(totalPixels);

  // Parse RLE string
  let index = 0;
  let value = 0; // Start with background (0)

  // Split the counts by non-digit chars
  const countsArr = counts
    .split(/([^0-9]+)/)
    .filter((s) => /^[0-9]+$/.test(s))
    .map(Number);

  for (const count of countsArr) {
    // Fill the mask with the current value for 'count' pixels
    const limit = Math.min(index + count, totalPixels);
    for (let i = index; i < limit; i++) {
      binaryMask[i] = value;
    }

    // Flip value between 0 and 1
    value = 1 - value;
    index += count;

    // If we've filled the entire mask, we're done
    if (index >= totalPixels) break;
  }

  return binaryMask;
};

/**
 * Creates an ImageData object from a binary mask for canvas rendering
 *
 * @param mask - Binary mask as Uint8Array
 * @param width - Width of the mask
 * @param height - Height of the mask
 * @param color - RGBA color array [r, g, b, a] (0-255 for RGB, 0-1 for alpha)
 * @returns ImageData object ready for putImageData
 */
export const createMaskImageData = (
  mask: Uint8Array,
  width: number,
  height: number,
  color: [number, number, number, number] = [255, 0, 0, 0.5]
): ImageData => {
  const imageData = new ImageData(width, height);
  const data = imageData.data;

  // Extract color components
  const [r, g, b, a] = color;
  const alpha = Math.floor(a * 255);

  // Fill imageData based on the mask
  for (let i = 0; i < mask.length; i++) {
    const pixelIndex = i * 4;
    if (mask[i] === 1) {
      // If this pixel is part of the mask
      data[pixelIndex] = r;
      data[pixelIndex + 1] = g;
      data[pixelIndex + 2] = b;
      data[pixelIndex + 3] = alpha;
    } else {
      // Set transparent for non-mask pixels
      data[pixelIndex + 3] = 0;
    }
  }

  return imageData;
};

/**
 * Utility function to scale mask dimensions
 *
 * @param mask - Binary mask as Uint8Array
 * @param srcWidth - Original width
 * @param srcHeight - Original height
 * @param destWidth - Target width
 * @param destHeight - Target height
 * @returns Scaled mask as Uint8Array
 */
export const scaleMask = (
  mask: Uint8Array,
  srcWidth: number,
  srcHeight: number,
  destWidth: number,
  destHeight: number
): Uint8Array => {
  const scaledMask = new Uint8Array(destWidth * destHeight);

  const widthRatio = srcWidth / destWidth;
  const heightRatio = srcHeight / destHeight;

  for (let y = 0; y < destHeight; y++) {
    for (let x = 0; x < destWidth; x++) {
      // Find the corresponding pixel in the source mask
      const srcX = Math.floor(x * widthRatio);
      const srcY = Math.floor(y * heightRatio);

      // Get the value from the source mask
      const srcIndex = srcY * srcWidth + srcX;
      const value = mask[srcIndex];

      // Set the value in the scaled mask
      const destIndex = y * destWidth + x;
      scaledMask[destIndex] = value;
    }
  }

  return scaledMask;
};
