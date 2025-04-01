#!/usr/bin/env python3
"""
Test script for SAM2 segmentation integration.
This script can be run independently to verify SAM2 functionality.
"""

import os
import cv2
import numpy as np
import argparse
import matplotlib.pyplot as plt
from models.sam2_model import SAM2Predictor


def display_mask(image, mask, title='Mask Visualization'):
    """Visualize mask on image"""
    # Convert mask from RLE to binary format
    from pycocotools import mask as mask_utils
    if isinstance(mask, dict) and 'counts' in mask and 'size' in mask:
        h, w = mask['size']
        rle = {'counts': mask['counts'].encode('utf-8') if isinstance(mask['counts'], str) else mask['counts'],
               'size': mask['size']}
        binary_mask = mask_utils.decode(rle)
    else:
        binary_mask = mask
        
    # Create overlay
    color_mask = np.zeros_like(image, dtype=np.uint8)
    color_mask[binary_mask == 1, 0] = 0
    color_mask[binary_mask == 1, 1] = 255  # Green for player mask
    color_mask[binary_mask == 1, 2] = 0
    
    # Create composite
    alpha = 0.5
    composite = cv2.addWeighted(image, 1, color_mask, alpha, 0)
    
    # Display
    plt.figure(figsize=(10, 8))
    plt.imshow(cv2.cvtColor(composite, cv2.COLOR_BGR2RGB))
    plt.title(title)
    plt.axis('off')
    plt.tight_layout()
    plt.show()


def test_sam2(video_path, frame_idx=0, checkpoint_path=None):
    """Test SAM2 segmentation on a specific frame"""
    # Initialize SAM2 predictor
    if checkpoint_path is None:
        checkpoint_path = os.environ.get(
            "SAM2_CHECKPOINT_PATH", 
            "checkpoints/sam2.1_hiera_base_plus.pt"
        )
    
    predictor = SAM2Predictor(checkpoint_path)
    
    # Extract frame
    frame = predictor.extract_frame(video_path, frame_idx)
    
    # Display frame for user to select points
    plt.figure(figsize=(10, 8))
    plt.imshow(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    plt.title(f"Frame {frame_idx}")
    plt.axis('off')
    plt.tight_layout()
    plt.show()
    
    # Get interactive input (simplified for test script)
    print("Enter positive points for player (x,y format, empty line to finish):")
    positive_points = []
    while True:
        point_str = input().strip()
        if not point_str:
            break
        try:
            x, y = map(float, point_str.split(','))
            positive_points.append([x, y])
        except ValueError:
            print("Invalid format. Use x,y format (e.g., 100,200)")
    
    print("Enter negative points (x,y format, empty line to finish):")
    negative_points = []
    while True:
        point_str = input().strip()
        if not point_str:
            break
        try:
            x, y = map(float, point_str.split(','))
            negative_points.append([x, y])
        except ValueError:
            print("Invalid format. Use x,y format (e.g., 100,200)")
    
    # Generate mask
    player_mask, _ = predictor.generate_masks(
        video_path=video_path,
        frame_idx=frame_idx,
        player1_positive_points=positive_points,
        player1_negative_points=negative_points,
        player2_positive_points=None,
        player2_negative_points=None
    )
    
    # Convert mask from RLE to binary for visualization
    from pycocotools import mask as mask_utils
    h, w = player_mask['size']
    rle = {'counts': player_mask['counts'].encode('utf-8') if isinstance(player_mask['counts'], str) else player_mask['counts'],
           'size': player_mask['size']}
    binary_mask = mask_utils.decode(rle)
    
    # Display result
    display_mask(frame, binary_mask, title=f"Frame {frame_idx} - Player Mask")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test SAM2 segmentation")
    parser.add_argument("video_path", help="Path to video file")
    parser.add_argument("--frame", type=int, default=0, help="Frame index to process")
    parser.add_argument("--checkpoint", help="Path to SAM2 model checkpoint")
    
    args = parser.parse_args()
    
    test_sam2(args.video_path, args.frame, args.checkpoint)
