import numpy as np
import os

from utils.segmentation import run_sam2_segmentation, merge_masks_and_boxes

video_dir = "/data/uploads/f72f40ce-21ae-4770-b139-38ce346ab6d4"
# >>> a[0].append([1,2])
# >>> a
# [[[650, 800], [650, 750], [650, 700], [1, 2]]]

# 6    000111.jpg
# 3305 004620.jpg
# 5924 007946.jpg
# 8271 011050.jpg
# "points": np.array([[[650, 800], [650, 750], [650, 700]]], dtype=np.float32),
# "labels": np.array([[1, 1, 1]], np.int32)
# "points": np.array([[[700, 800], [700, 750], [700, 700]]], dtype=np.float32),
# "labels": np.array([[1, 1, 1]], np.int32)
# "points": np.array([[[650, 800], [650, 750], [650, 700]]], dtype=np.float32),
# "labels": np.array([[1, 1, 1]], np.int32)
# "points": np.array([[[1275, 800], [1275, 700]]], dtype=np.float32),
# "labels": np.array([[1, 1]], np.int32)

# "points": np.array([[[1175, 800], [1200, 700]]], dtype=np.float32),
# "labels": np.array([[1, 1]], np.int32)
# "points": np.array([[[1175, 750], [1175, 650]]], dtype=np.float32),
# "labels": np.array([[1, 1]], np.int32)
# "points": np.array([[[1175, 800], [1175, 700]]], dtype=np.float32),
# "labels": np.array([[1, 1]], np.int32)
# "points": np.array([[[800, 800], [800, 750]]], dtype=np.float32),
# "labels": np.array([[1, 1]], np.int32)
marker_input = [
    [
        {
            "frame_idx": 111,
            "player_id": 1,
            "points": np.array([[[650, 800], [650, 750], [650, 700]]], dtype=np.float32),
            "labels": np.array([[1, 1, 1]], np.int32),
        },
        {
            "frame_idx": 111,
            "player_id": 2,
            "points": np.array([[[1175, 800], [1200, 700]]], dtype=np.float32),
            "labels": np.array([[1, 1]], np.int32),
        },
    ],
    [
        {
            "frame_idx": 4621,
            "player_id": 1,
            "points": np.array([[[700, 800], [700, 750], [700, 700]]], dtype=np.float32),
            "labels": np.array([[1, 1, 1]], np.int32),
        },
        {
            "frame_idx": 4621,
            "player_id": 2,
            "points": np.array([[[1175, 750], [1175, 650]]], dtype=np.float32),
            "labels": np.array([[1, 1]], np.int32),
        },
        {
            "frame_idx": 4626,
            "player_id": 1,
            "points": np.array([[[700, 800], [700, 750], [700, 700]]], dtype=np.float32),
            "labels": np.array([[1, 1, 1]], np.int32),
        },
        {
            "frame_idx": 4626,
            "player_id": 2,
            "points": np.array([[[1175, 750], [1175, 650]]], dtype=np.float32),
            "labels": np.array([[1, 1]], np.int32),
        },
    ],
    [
        {
            "frame_idx": 7936,
            "player_id": 1,
            "points": np.array([[[650, 800], [650, 750], [650, 700]]], dtype=np.float32),
            "labels": np.array([[1, 1, 1]], np.int32),
        },
        {
            "frame_idx": 7936,
            "player_id": 2,
            "points": np.array([[[1175, 800], [1175, 700]]], dtype=np.float32),
            "labels": np.array([[1, 1]], np.int32),
        },
    ],
    [
        {
            "frame_idx": 10051,
            "player_id": 1,
            "points": np.array([[[1275, 800], [1275, 700]]], dtype=np.float32),
            "labels": np.array([[1, 1]], np.int32),
        },
        {
            "frame_idx": 10051,
            "player_id": 2,
            "points": np.array([[[800, 800], [800, 750]]], dtype=np.float32),
            "labels": np.array([[1, 1]], np.int32),
        },
    ],
]
# run_sam2_segmentation(video_dir, marker_input)
# merge_masks_and_boxes(os.path.join(video_dir, "segmentation"))

