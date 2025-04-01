"""
SAM2 Model Integration

This module integrates SAM2 (Segment Anything Model 2) for player segmentation.
"""

import os
import torch
import cv2
import numpy as np
from typing import List, Dict, Any, Tuple, Optional, Union
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Type alias for point format
PointType = List[List[float]]  # [[x, y], ...] or [[x, y, label], ...]


class SAM2Predictor:
    """
    Wrapper class for SAM2 model integration
    """

    def __init__(self, checkpoint_path: str):
        """
        Initialize SAM2 model

        Args:
            checkpoint_path: Path to the SAM2 model checkpoint
        """
        self.checkpoint_path = checkpoint_path
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None
        self.image_size = 1024  # SAM2 default image size

        logger.info(f"Initializing SAM2 model from {checkpoint_path} on {self.device}")
        self._load_model()

    def _load_model(self):
        """
        Load the SAM2 model from checkpoint
        """
        try:
            # Dynamically import SAM2 to avoid import errors if not installed
            from sam2.sam2_image_predictor import SAM2ImagePredictor
            from sam2.build_sam import build_sam2_model
            
            # Load the model
            sam_model = build_sam2_model(self.checkpoint_path)
            sam_model.to(device=self.device)
            self.model = SAM2ImagePredictor(sam_model)
            logger.info("SAM2 model loaded successfully")
        except ImportError:
            logger.warning("SAM2 package not found. Using dummy implementation.")
            self.model = None
        except Exception as e:
            logger.error(f"Error loading SAM2 model: {str(e)}")
            self.model = None

    def extract_frame(self, video_path: str, frame_idx: int) -> np.ndarray:
        """
        Extract a specific frame from a video

        Args:
            video_path: Path to the video file
            frame_idx: Index of the frame to extract

        Returns:
            The extracted frame as a numpy array
        """
        try:
            cap = cv2.VideoCapture(video_path)
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            cap.release()
            
            if not ret:
                logger.error(f"Failed to extract frame {frame_idx} from {video_path}")
                return np.zeros((1080, 1920, 3), dtype=np.uint8)
            
            # Convert from BGR to RGB
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            return frame_rgb
        except Exception as e:
            logger.error(f"Error extracting frame: {str(e)}")
            return np.zeros((1080, 1920, 3), dtype=np.uint8)

    def prepare_points(self, 
                      positive_points: PointType, 
                      negative_points: Optional[PointType] = None) -> Tuple[np.ndarray, np.ndarray]:
        """
        Prepare points for SAM2 model

        Args:
            positive_points: List of positive points (format: [[x, y], ...])
            negative_points: List of negative points (format: [[x, y], ...])

        Returns:
            Tuple of points and labels arrays
        """
        # Combine positive and negative points
        all_points = []
        all_labels = []
        
        for point in positive_points:
            all_points.append([point[0], point[1]])
            all_labels.append(1)  # Label 1 for positive points
            
        if negative_points:
            for point in negative_points:
                all_points.append([point[0], point[1]])
                all_labels.append(0)  # Label 0 for negative points
        
        # Convert to numpy arrays
        points_array = np.array(all_points, dtype=np.float32)
        labels_array = np.array(all_labels, dtype=np.int32)
        
        return points_array, labels_array

    def generate_masks(
        self,
        video_path: str,
        frame_idx: int,
        player1_positive_points: PointType,
        player1_negative_points: Optional[PointType] = None,
        player2_positive_points: Optional[PointType] = None,
        player2_negative_points: Optional[PointType] = None,
    ) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        Generate masks for players based on provided points

        Args:
            video_path: Path to the video file
            frame_idx: Frame index to process
            player1_positive_points: List of [x, y] coordinates for positive points on player 1
            player1_negative_points: List of [x, y] coordinates for negative points on player 1
            player2_positive_points: List of [x, y] coordinates for positive points on player 2
            player2_negative_points: List of [x, y] coordinates for negative points on player 2

        Returns:
            Tuple of two dictionaries containing mask data (RLE format) for each player
        """
        # Extract frame from video
        frame = self.extract_frame(video_path, frame_idx)
        h, w = frame.shape[:2]
        
        logger.info(f"Generating masks for frame {frame_idx} of {video_path}")
        logger.info(f"Player 1 positive points: {player1_positive_points}")
        logger.info(f"Player 1 negative points: {player1_negative_points}")
        
        # Generate masks
        player1_mask = self._generate_player_mask(
            frame, player1_positive_points, player1_negative_points
        )
        
        player2_mask = None
        if player2_positive_points:
            logger.info(f"Player 2 positive points: {player2_positive_points}")
            logger.info(f"Player 2 negative points: {player2_negative_points}")
            player2_mask = self._generate_player_mask(
                frame, player2_positive_points, player2_negative_points
            )
        else:
            # If no player2 points provided, create empty mask
            player2_mask = {"size": [h, w], "counts": self._encode_empty_mask(h, w)}
            
        return player1_mask, player2_mask

    def _generate_player_mask(
        self, frame: np.ndarray, positive_points: PointType, negative_points: Optional[PointType] = None
    ) -> Dict[str, Any]:
        """
        Generate mask for a player using SAM2

        Args:
            frame: The image frame as a numpy array
            positive_points: List of positive point coordinates
            negative_points: List of negative point coordinates

        Returns:
            Dictionary containing mask data in RLE format
        """
        h, w = frame.shape[:2]
        
        # Check if we have a valid model
        if self.model is None:
            # Return a dummy mask if model isn't available
            return {"size": [h, w], "counts": self._encode_dummy_mask(h, w)}
        
        try:
            # Set the image in the SAM2 predictor
            self.model.set_image(frame)
            
            # Prepare points and labels
            points_array, labels_array = self.prepare_points(positive_points, negative_points)
            
            # Predict mask
            masks, iou, _ = self.model.predict(
                point_coords=points_array,
                point_labels=labels_array,
                multimask_output=False,  # We want only one mask
            )
            
            # Get the binary mask
            mask = masks[0, 0].cpu().numpy()  # Shape: (H, W)
            
            # Convert to RLE format
            rle = self._mask_to_rle(mask)
            
            return {"size": [h, w], "counts": rle}
        except Exception as e:
            logger.error(f"Error generating mask with SAM2: {str(e)}")
            # Return a dummy mask in case of error
            return {"size": [h, w], "counts": self._encode_dummy_mask(h, w)}
        finally:
            # Reset the predictor
            if self.model is not None:
                self.model.reset_image()

    def _mask_to_rle(self, binary_mask: np.ndarray) -> str:
        """
        Convert a binary mask to RLE encoding

        Args:
            binary_mask: Binary mask as numpy array

        Returns:
            RLE encoding as a string
        """
        try:
            from pycocotools import mask as mask_utils
            rle = mask_utils.encode(np.asfortranarray(binary_mask.astype(np.uint8)))
            return rle["counts"].decode('utf-8')
        except ImportError:
            logger.warning("pycocotools not found, using simple RLE encoding")
            return self._simple_rle_encode(binary_mask)
        except Exception as e:
            logger.error(f"Error encoding mask to RLE: {str(e)}")
            h, w = binary_mask.shape
            return self._encode_dummy_mask(h, w)

    def _simple_rle_encode(self, binary_mask: np.ndarray) -> str:
        """
        Simple RLE encoding implementation for when pycocotools is not available

        Args:
            binary_mask: Binary mask as numpy array

        Returns:
            Simple RLE encoding as a string
        """
        # Flatten mask
        mask_flat = binary_mask.flatten()
        
        # Find transitions
        transitions = np.where(mask_flat[:-1] != mask_flat[1:])[0] + 1
        
        # Add start and end positions
        transitions = np.concatenate(([0], transitions, [len(mask_flat)]))
        
        # Calculate run lengths
        run_lengths = transitions[1:] - transitions[:-1]
        
        # Determine if it starts with 0 or 1
        starts_with = 0 if mask_flat[0] == 0 else 1
        
        # Create RLE string
        rle_parts = []
        if starts_with == 1:
            rle_parts.append("0")  # Start with a zero count if first pixel is 1
            
        for length in run_lengths:
            rle_parts.append(str(length))
            
        return ":".join(rle_parts)

    def _encode_dummy_mask(self, height: int, width: int) -> str:
        """
        Generate a dummy RLE encoding for testing

        Args:
            height: Height of the mask
            width: Width of the mask

        Returns:
            Dummy RLE encoding
        """
        # Simple pattern - a rectangle in the center
        center_h, center_w = height // 2, width // 2
        rect_h, rect_w = height // 4, width // 4
        
        mask = np.zeros((height, width), dtype=np.uint8)
        mask[center_h-rect_h//2:center_h+rect_h//2, center_w-rect_w//2:center_w+rect_w//2] = 1
        
        return self._simple_rle_encode(mask)

    def _encode_empty_mask(self, height: int, width: int) -> str:
        """
        Generate an empty mask RLE encoding

        Args:
            height: Height of the mask
            width: Width of the mask

        Returns:
            Empty mask RLE encoding
        """
        # All zeros
        return str(height * width)  # RLE for all zeros is just the total length


# Initialize singleton instance
sam2_predictor = None


def get_sam2_predictor() -> SAM2Predictor:
    """
    Get or initialize the SAM2 predictor instance

    Returns:
        SAM2Predictor instance
    """
    global sam2_predictor

    if sam2_predictor is None:
        checkpoint_path = os.environ.get("SAM2_CHECKPOINT_PATH", "/app/checkpoints/sam2.1_hiera_base_plus.pt")
        sam2_predictor = SAM2Predictor(checkpoint_path)

    return sam2_predictor
