from PIL import Image
from ultralytics import YOLO
import cv2
import matplotlib.pyplot as plt
import numpy as np
import os
import torch

from utils.pose import save_keypoints_results
def run_yolo_pose_estimation(video_dir: str):
    yolo_pose_model = YOLO("/opt/app/checkpoints/yolo11m-pose.pt")  # load an official model

    # Directories
    frame_dir = os.path.join(video_dir, "frames")
    segmentation_dir = os.path.join(video_dir, "segmentation")
    segmentation_boxes_dir = os.path.join(segmentation_dir, "results", "boxes")
    pose_dir = os.path.join(video_dir, "pose")

    frame_names = [
        frame for frame in os.listdir(frame_dir) if os.path.splitext(frame)[-1] in [".jpg", ".jpeg", ".JPG", ".JPEG"]
    ]
    frame_names.sort(key=lambda p: int(os.path.splitext(p)[0]))

    player1_pose_dir = os.path.join(pose_dir, "results", "1")
    os.makedirs(player1_pose_dir, exist_ok=True)

    player1_box_dir = os.path.join(segmentation_boxes_dir, "1")
    for player1_box_file in os.listdir(player1_box_dir):
        player1_box = np.load(os.path.join(player1_box_dir, player1_box_file))
        if np.all(player1_box == 0):
            continue
        player1_x, player1_y, player1_w, player1_h = player1_box

        player1_frame_name = os.path.splitext(player1_box_file)[0]
        player1_frame = cv2.imread(os.path.join(frame_dir, player1_frame_name))
        player1_cropped_frame = player1_frame[player1_y : player1_y + player1_h, player1_x : player1_x + player1_w]

        player1_pose_results = yolo_pose_model.predict(player1_cropped_frame)[0]
        if player1_pose_results.keypoints is not None:
            save_keypoints_results(player1_frame_name, player1_pose_results.keypoints, player1_box, player1_pose_dir)

    player2_pose_dir = os.path.join(pose_dir, "results", "2")
    os.makedirs(player2_pose_dir, exist_ok=True)

    player2_box_dir = os.path.join(segmentation_boxes_dir, "2")
    for player2_box_file in os.listdir(player2_box_dir):
        player2_box = np.load(os.path.join(player2_box_dir, player2_box_file))
        if np.all(player2_box == 0):
            continue
        player2_x, player2_y, player2_w, player2_h = player2_box

        player2_frame_name = os.path.splitext(player2_box_file)[0]
        player2_frame = cv2.imread(os.path.join(frame_dir, player2_frame_name))
        player2_cropped_frame = player2_frame[player2_y : player2_y + player2_h, player2_x : player2_x + player2_w]

        player2_pose_results = yolo_pose_model.predict(player2_cropped_frame)[0]
        if player2_pose_results.keypoints is not None:
            save_keypoints_results(player2_frame_name, player2_pose_results.keypoints, player2_box, player2_pose_dir)
