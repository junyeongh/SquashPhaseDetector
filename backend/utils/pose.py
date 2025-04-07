import os

import cv2
import matplotlib.pyplot as plt
import numpy as np
import torch
from PIL import Image
from ultralytics import YOLO


def save_keypoints_results(frame_name, keypoints, box, output_path):
    if isinstance(keypoints.data, torch.Tensor):
        keypoints.data = keypoints.data.cpu().numpy()
    if isinstance(keypoints.conf, torch.Tensor):
        keypoints.conf = keypoints.conf.cpu().numpy()

    # Map keypoints to original image coordinates
    box_x, box_y = box[0], box[1]  # Extract x, y coordinates from box

    # Create a copy to modify
    mapped_data = keypoints.data.copy()

    # Update the x, y coordinates (keep the confidence as is)
    for person_idx in range(mapped_data.shape[0]):
        for kp_idx in range(mapped_data.shape[1]):
            # Only adjust coordinates, not confidence
            mapped_data[person_idx, kp_idx, 0] += box_x
            mapped_data[person_idx, kp_idx, 1] += box_y

    # Create result dictionary with all necessary data
    result_dict = {
        "frame_name": frame_name,
        "keypoints_data": mapped_data,
        "keypoints_conf": keypoints.conf,
        "bounding_box": box,
    }

    # Save as numpy file
    output_file = os.path.join(output_path, f"{frame_name}.npy")
    np.save(output_file, result_dict)

    return output_file
