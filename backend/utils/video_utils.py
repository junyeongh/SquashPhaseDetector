"""
Video Utilities

Utility functions for video processing.
"""

import cv2
import os
import numpy as np
from typing import Dict, Any


def extract_frame(video_path: str, frame_idx: int) -> np.ndarray:
    """
    Extract a specific frame from a video

    Args:
        video_path: Path to the video file
        frame_idx: Index of the frame to extract

    Returns:
        Numpy array containing the frame image
    """
    cap = cv2.VideoCapture(video_path)

    # Set position to the requested frame
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)

    # Read the frame
    ret, frame = cap.read()
    cap.release()

    if not ret:
        raise ValueError(f"Failed to extract frame {frame_idx} from {video_path}")

    return frame


def get_video_info(video_path: str) -> Dict[str, Any]:
    """
    Get video metadata (duration, dimensions, fps, etc.)

    Args:
        video_path: Path to the video file

    Returns:
        Dictionary containing video information
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found: {video_path}")

    cap = cv2.VideoCapture(video_path)

    # Get video properties
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps if fps > 0 else 0

    cap.release()

    return {
        "width": width,
        "height": height,
        "fps": fps,
        "total_frames": total_frames,
        "duration_seconds": duration,
        "codec": get_video_codec(video_path),
    }


def get_video_codec(video_path: str) -> str:
    """
    Get the codec used by a video file

    Args:
        video_path: Path to the video file

    Returns:
        String representing the codec
    """
    cap = cv2.VideoCapture(video_path)

    # Get the codec as an integer
    fourcc_int = int(cap.get(cv2.CAP_PROP_FOURCC))
    cap.release()

    # Convert to characters
    fourcc = ""
    for i in range(4):
        fourcc += chr((fourcc_int >> (i * 8)) & 0xFF)

    return fourcc


def apply_mask_to_frame(frame: np.ndarray, mask: Dict[str, Any]) -> np.ndarray:
    """
    Apply a mask to a video frame

    Args:
        frame: Video frame as numpy array
        mask: Mask data (RLE format)

    Returns:
        Masked frame
    """
    # In a real implementation, this would decode the RLE mask and apply it
    # For now, we'll just create a sample masked frame

    # Create a simple rectangular mask for demonstration
    h, w = frame.shape[:2]
    mask_array = np.zeros((h, w), dtype=np.uint8)

    # Draw a rectangle in the middle
    x1, y1 = w // 4, h // 4
    x2, y2 = w * 3 // 4, h * 3 // 4
    mask_array[y1:y2, x1:x2] = 1

    # Apply mask
    masked_frame = frame.copy()
    for c in range(3):  # Apply to each color channel
        masked_frame[:, :, c] = masked_frame[:, :, c] * mask_array

    return masked_frame
