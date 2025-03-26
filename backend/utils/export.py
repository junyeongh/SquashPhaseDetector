"""
Export Utilities

Utility functions for exporting analysis results.
"""

import os
import json
import csv
from typing import Dict, List, Any


def export_game_states_to_csv(
    game_states: List[Dict[str, Any]], output_path: str
) -> None:
    """
    Export game states to CSV format

    Args:
        game_states: List of game state objects
        output_path: Output file path
    """
    with open(output_path, "w", newline="") as csvfile:
        fieldnames = ["state", "start_frame", "end_frame", "start_time", "end_time"]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        writer.writeheader()
        for state in game_states:
            writer.writerow(
                {
                    "state": state["state"],
                    "start_frame": state["start_frame"],
                    "end_frame": state["end_frame"],
                    "start_time": state["start_time"],
                    "end_time": state["end_time"],
                }
            )


def export_poses_to_json(poses: Dict[int, Dict[str, Any]], output_path: str) -> None:
    """
    Export pose data to JSON format

    Args:
        poses: Dictionary of pose data
        output_path: Output file path
    """
    # Convert frame indices from integers to strings for JSON
    json_poses = {}
    for frame_idx, frame_poses in poses.items():
        json_poses[str(frame_idx)] = frame_poses

    with open(output_path, "w") as jsonfile:
        json.dump(json_poses, jsonfile, indent=2)


def export_masks_to_json(masks: Dict[int, Dict[str, Any]], output_path: str) -> None:
    """
    Export mask data to JSON format

    Args:
        masks: Dictionary of mask data
        output_path: Output file path
    """
    # Convert frame indices from integers to strings for JSON
    json_masks = {}
    for frame_idx, frame_masks in masks.items():
        json_masks[str(frame_idx)] = frame_masks

    with open(output_path, "w") as jsonfile:
        json.dump(json_masks, jsonfile, indent=2)


def export_session_data(session: Dict[str, Any], export_dir: str) -> Dict[str, str]:
    """
    Export all session data to files

    Args:
        session: Session data
        export_dir: Directory for export files

    Returns:
        Dictionary mapping data type to export file path
    """
    os.makedirs(export_dir, exist_ok=True)

    export_files = {}

    # Export game states
    if "game_states" in session and session["game_states"]:
        game_states_path = os.path.join(export_dir, "game_states.csv")
        export_game_states_to_csv(session["game_states"], game_states_path)
        export_files["game_states"] = game_states_path

    # Export poses
    if "poses" in session and session["poses"]:
        poses_path = os.path.join(export_dir, "pose_data.json")
        export_poses_to_json(session["poses"], poses_path)
        export_files["poses"] = poses_path

    # Export masks
    if "masks" in session and session["masks"]:
        masks_path = os.path.join(export_dir, "mask_data.json")
        export_masks_to_json(session["masks"], masks_path)
        export_files["masks"] = masks_path

    # Export session metadata
    metadata = {
        "session_id": session.get("id", ""),
        "video_path": session.get("video_path", ""),
        "creation_time": session.get("creation_time", 0),
        "processing_status": {
            "segmentation": session.get("segmentation_status", "not_started"),
            "pose": session.get("pose_status", "not_started"),
            "analysis": session.get("analysis_status", "not_started"),
        },
    }

    metadata_path = os.path.join(export_dir, "metadata.json")
    with open(metadata_path, "w") as jsonfile:
        json.dump(metadata, jsonfile, indent=2)

    export_files["metadata"] = metadata_path

    return export_files
