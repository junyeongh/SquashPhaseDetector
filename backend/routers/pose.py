import json
import os
from typing import Any, Dict

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

from models.pose_yolo_pose import run_yolo_pose_estimation

router = APIRouter(
    prefix="/pose",
    tags=["pose"],
    responses={404: {"description": "Not found"}},
)

UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", "/data/uploads")

processing_videos = {}

# class DetectPosesRequest(BaseModel):
#     session_id: str


@router.get("/models")
async def get_models():
    """
    Get the list of all models available
    """
    return {"models": ["yolo_pose_v11"]}


@router.post("/yolo_pose_v11/{video_uuid}")
async def run_yolo_pose_v11(video_uuid: str, background_tasks: BackgroundTasks):
    """
    Run YOLO pose detection on a video
    """
    video_dir = os.path.join(UPLOAD_FOLDER, video_uuid)
    if not os.path.exists(video_dir) or not os.path.isdir(video_dir):
        raise HTTPException(status_code=404, detail="Video not found")

    if video_uuid in processing_videos:
        return {"status": "Processing already in progress", "video_uuid": video_uuid}

    processing_videos[video_uuid] = "starting"

    async def process_with_status_updates():
        try:
            processing_videos[video_uuid] = "processing"

            run_yolo_pose_estimation(video_dir)

            if video_uuid in processing_videos:
                del processing_videos[video_uuid]

        except Exception as e:
            if video_uuid in processing_videos:
                processing_videos[video_uuid] = f"error: {str(e)}"
            print(f"Error processing video {video_uuid}: {str(e)}")

    background_tasks.add_task(process_with_status_updates)

    return {"status": "started", "video_uuid": video_uuid}


@router.get("/yolo_pose_v11/{video_uuid}")
async def get_yolo_pose_v11(video_uuid: str):
    """
    Get the pose detection result for a video
    """
    video_dir = os.path.join(UPLOAD_FOLDER, video_uuid)

    if not os.path.exists(video_dir) or not os.path.isdir(video_dir):
        raise HTTPException(status_code=404, detail="Video not found")

    pose_file_path = os.path.join(video_dir, "pose.json")
    if not os.path.exists(pose_file_path):
        raise HTTPException(status_code=404, detail="Pose detection result not found")

    with open(pose_file_path, "r") as f:
        data = json.load(f)

    return data


@router.get("/yolo_pose_v11/{video_uuid}/status")
async def get_yolo_pose_v11_status(video_uuid: str):
    """
    Get the status of YOLO pose detection for a video
    """
    video_dir = os.path.join(UPLOAD_FOLDER, video_uuid)

    if not os.path.exists(video_dir) or not os.path.isdir(video_dir):
        raise HTTPException(status_code=404, detail="Video not found")

    is_processing = video_uuid in processing_videos
    pose_file_path = os.path.join(video_dir, "pose.json")
    has_pose = os.path.exists(pose_file_path)

    status = "idle"
    if is_processing:
        status = processing_videos[video_uuid]
    elif has_pose:
        status = "completed"

    return {
        "video_uuid": video_uuid,
        "is_processing": is_processing,
        "has_pose": has_pose,
        "status": status,
    }
