import gc
import json
import os
import shutil
import time
from typing import List

import matplotlib.pyplot as plt
import numpy as np
import torch
from PIL import Image
from pydantic import BaseModel
from tqdm import tqdm
from typing_extensions import TypedDict


class MarkerInput(TypedDict):
    frame_idx: int
    player_id: int
    points: List[List[List[float]]]
    labels: List[List[int]]


class SegmentationRequest(BaseModel):
    marker_input: List[List[MarkerInput]]


# Get bounding box from binary mask
def get_bbox_from_mask(mask):
    # Find the coordinates of True values in the mask
    y_indices, x_indices = np.where(mask)

    # If no True values are found, return an empty bounding box
    if len(y_indices) == 0 or len(x_indices) == 0:
        return [0, 0, 0, 0]

    # Get the min and max coordinates
    x_min = np.min(x_indices)
    y_min = np.min(y_indices)
    x_max = np.max(x_indices)
    y_max = np.max(y_indices)

    # Return as [x_min, y_min, width, height]
    width = x_max - x_min + 1
    height = y_max - y_min + 1
    return [x_min, y_min, width, height]


# Merge masks and boxes
def merge_masks_and_boxes(segmentation_dir: str):
    os.makedirs(os.path.join(segmentation_dir, "results", "masks", "1"), exist_ok=True)
    os.makedirs(os.path.join(segmentation_dir, "results", "masks", "2"), exist_ok=True)
    os.makedirs(os.path.join(segmentation_dir, "results", "boxes", "1"), exist_ok=True)
    os.makedirs(os.path.join(segmentation_dir, "results", "boxes", "2"), exist_ok=True)

    print(os.listdir(segmentation_dir))
    for chunk_idx in os.listdir(segmentation_dir):
        if chunk_idx == "results":
            continue
        chunk_dir = os.path.join(segmentation_dir, chunk_idx)
        print(chunk_idx, chunk_dir)
        for obj_id in os.listdir(os.path.join(chunk_dir, "masks")):
            mask_dir = os.path.join(chunk_dir, "masks", obj_id)
            box_dir = os.path.join(chunk_dir, "boxes", obj_id)
            print(f"  {obj_id}, {mask_dir}, {box_dir}")
            for mask_file in os.listdir(mask_dir):
                src_mask_path = os.path.join(mask_dir, mask_file)
                dst_mask_path = os.path.join(segmentation_dir, "results", "masks", obj_id, mask_file)
                src_box_path = os.path.join(box_dir, mask_file)
                dst_box_path = os.path.join(segmentation_dir, "results", "boxes", obj_id, mask_file)

                os.symlink(src_mask_path, dst_mask_path)
                os.symlink(src_box_path, dst_box_path)
                # shutil.copyfile(src_mask_path, dst_mask_path)
                # shutil.copyfile(src_box_path, dst_box_path)


def write_segmentation_result(video_dir: str, marker_input: list):
    segmentation_result_dir = os.path.join(video_dir, "segmentation", "results")
    player1_masks_dir = os.path.join(segmentation_result_dir, "masks", "1")
    player2_masks_dir = os.path.join(segmentation_result_dir, "masks", "2")

    player1_frames = []
    for _, frame_name in tqdm(enumerate(os.listdir(player1_masks_dir))):
        frame_idx = frame_name.split(".")[0]
        player1_frames.append(int(frame_idx))

    player2_frames = []
    for _, frame_name in tqdm(enumerate(os.listdir(player2_masks_dir))):
        frame_idx = frame_name.split(".")[0]
        player2_frames.append(int(frame_idx))

    data = {
        "marker_input": marker_input,
        "player1": {
            "frames": sorted(player1_frames),
        },
        "player2": {
            "frames": sorted(player2_frames),
        },
    }

    # write the segmentation result
    with open(os.path.join(video_dir, "segmentation.json"), "w") as f:
        json.dump(data, f)
