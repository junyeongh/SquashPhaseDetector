import gc
import json
import os
import shutil
import time

import numpy as np
import torch

from sam2.build_sam import build_sam2_video_predictor
from utils.segmentation import get_bbox_from_mask, merge_masks_and_boxes


def run_sam2_segmentation(video_dir: str, marker_input):
    start_time = time.time()
    frames_dir = os.path.join(video_dir, "frames")
    segmentation_dir = os.path.join(video_dir, "segmentation")

    # scan all the JPEG frame names in this directory
    frame_names = [
        frame for frame in os.listdir(frames_dir) if os.path.splitext(frame)[-1] in [".jpg", ".jpeg", ".JPG", ".JPEG"]
    ]
    frame_names.sort(key=lambda p: int(os.path.splitext(p)[0]))

    with open(os.path.join(video_dir, "metadata.json"), "r") as f_metadata:
        metadata = json.load(f_metadata)
    with open(os.path.join(video_dir, "mainview_timestamp.json"), "r") as f_mainview_timestamp:
        mainview_timestamp = json.load(f_mainview_timestamp)

    chunks = mainview_timestamp["chunks"]
    config = {
        "model_cfg": "configs/sam2.1/sam2.1_hiera_t.yaml",
        "sam2_checkpoint": "checkpoints/sam2.1_hiera_tiny.pt",
        "video_width": metadata["width"],
        "video_height": metadata["height"],
    }

    # Process each chunk
    for chunk_idx, chunk_frames in enumerate(chunks):
        # Create a new directory for each chunk
        chunk_dir = os.path.join(segmentation_dir, f"chunk_{chunk_idx}")
        os.makedirs(chunk_dir, exist_ok=True)
        chunk_frames_dir = os.path.join(segmentation_dir, f"chunk_{chunk_idx}", "frames")
        os.makedirs(chunk_frames_dir, exist_ok=True)

        # Create a symlink to the frames directory for each chunk
        for chunk_frame in chunk_frames:
            start_frame, end_frame = chunk_frame
            for frame_idx in range(start_frame, end_frame + 1, 5):
                frame_name = frame_names[frame_idx]
                src_path = os.path.join(frames_dir, frame_name)
                dst_path = os.path.join(chunk_frames_dir, frame_name)
                shutil.copyfile(src_path, dst_path)
        gc.collect()

        chunk_frame_names = [
            frame
            for frame in os.listdir(chunk_dir)
            if os.path.splitext(frame)[-1] in [".jpg", ".jpeg", ".JPG", ".JPEG"]
        ]
        markers = marker_input[chunk_idx]
        markers_name_set = {marker["frame_idx"] for marker in markers}

        for i in markers_name_set:
            target_name = f"{i:06d}.jpg"
            if target_name not in chunk_frame_names:
                src_path = os.path.join(frames_dir, target_name)
                dst_path = os.path.join(chunk_frames_dir, target_name)
                shutil.copyfile(src_path, dst_path)
        gc.collect()
        run_sam2_segmentation_chunk(chunk_dir, markers, config)

    # merge all the masks and boxes
    merge_masks_and_boxes(segmentation_dir)
    print(f"Completed segmentation for all chunks in {video_dir}")
    print(f"Total time taken: {time.time() - start_time:.2f} seconds")


def run_sam2_segmentation_chunk(chunk_dir: str, markers: list[dict], configs: dict):
    # select the device for computation
    if torch.cuda.is_available():
        device = torch.device("cuda")
    elif torch.backends.mps.is_available():
        device = torch.device("mps")
    else:
        device = torch.device("cpu")
    print(f"using device: {device}")

    model_cfg = configs["model_cfg"]
    sam2_checkpoint = configs["sam2_checkpoint"]
    print(model_cfg)
    print(sam2_checkpoint)
    video_width = configs["video_width"]
    video_height = configs["video_height"]

    predictor = build_sam2_video_predictor(model_cfg, sam2_checkpoint, device=device)

    frames_dir = os.path.join(chunk_dir, "frames")
    # scan all the JPEG frame names in this directory
    frame_names = [
        frame for frame in os.listdir(frames_dir) if os.path.splitext(frame)[-1] in [".jpg", ".jpeg", ".JPG", ".JPEG"]
    ]
    frame_names.sort(key=lambda p: int(os.path.splitext(p)[0]))

    if torch.cuda.is_available():
        print(f"GPU memory allocated before init: {torch.cuda.memory_allocated() / 1024**2:.2f} MB")
        print(f"GPU memory reserved before init: {torch.cuda.memory_reserved() / 1024**2:.2f} MB")

    inference_state = predictor.init_state(
        video_path=frames_dir,
        offload_video_to_cpu=True,  # all False by default
        offload_state_to_cpu=True,  # all False by default
        async_loading_frames=True,  # all False by default
    )
    # https://github.com/facebookresearch/sam2/issues/264

    predictor.reset_state(inference_state)

    for marker in markers:
        frame_idx = frame_names.index(f"{marker['frame_idx']:06d}.jpg")
        player_id = marker["player_id"]
        # points = marker["points"]
        # labels = marker["labels"]
        points = (np.array(marker["points"], dtype=np.float32) * np.array([video_width, video_height])).astype(np.int32)
        labels = np.array(marker["labels"], dtype=np.int32)

        _, out_obj_ids, out_mask_logits = predictor.add_new_points_or_box(
            inference_state=inference_state,
            frame_idx=frame_idx,
            obj_id=player_id,
            points=points,
            labels=labels,
        )
    gc.collect()

    # run propagation throughout the video and collect the results in a dict
    video_segments = {}  # video_segments contains the per-frame segmentation results
    for out_frame_idx, out_obj_ids, out_mask_logits in predictor.propagate_in_video(inference_state, reverse=True):
        video_segments[out_frame_idx] = {
            out_obj_id: (out_mask_logits[i] > 0.0).cpu().numpy() for i, out_obj_id in enumerate(out_obj_ids)
        }
    gc.collect()
    for out_frame_idx, out_obj_ids, out_mask_logits in predictor.propagate_in_video(inference_state, reverse=False):
        video_segments[out_frame_idx] = {
            out_obj_id: (out_mask_logits[i] > 0.0).cpu().numpy() for i, out_obj_id in enumerate(out_obj_ids)
        }
    gc.collect()

    os.makedirs(os.path.join(chunk_dir, "masks", "1"), exist_ok=True)
    os.makedirs(os.path.join(chunk_dir, "masks", "2"), exist_ok=True)
    os.makedirs(os.path.join(chunk_dir, "boxes", "1"), exist_ok=True)
    os.makedirs(os.path.join(chunk_dir, "boxes", "2"), exist_ok=True)

    for video_segments_idx in video_segments.keys():
        for obj_id, mask in video_segments[video_segments_idx].items():
            mask_output = os.path.join(chunk_dir, "masks", f"{obj_id}", f"{frame_names[video_segments_idx]}.npy")
            np.save(mask_output, mask[0])
            bbox_output = os.path.join(chunk_dir, "boxes", f"{obj_id}", f"{frame_names[video_segments_idx]}.npy")
            np.save(bbox_output, get_bbox_from_mask(mask[0]))

    print(f"Saved all masks for {chunk_dir}")
    gc.collect()
