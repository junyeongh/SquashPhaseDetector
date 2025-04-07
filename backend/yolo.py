import os

from models.pose_yolo_pose import run_yolo_pose_estimation

video_dir = "/data/uploads/f72f40ce-21ae-4770-b139-38ce346ab6d4"
run_yolo_pose_estimation(os.path.join(video_dir))
