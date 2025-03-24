from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, List, Any

router = APIRouter(
    prefix="/pose",
    tags=["pose"],
    responses={404: {"description": "Not found"}},
)


class DetectPosesRequest(BaseModel):
    session_id: str


@router.post("/detect")
async def detect_poses(request: DetectPosesRequest, background_tasks: BackgroundTasks):
    """
    Run pose detection on player masks
    """
    from app import sessions

    if request.session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions[request.session_id]

    if "masks" not in session or not session["masks"]:
        raise HTTPException(status_code=400, detail="No player masks found in session")

    if session.get("segmentation_status") != "completed":
        raise HTTPException(
            status_code=400, detail="Segmentation must be completed first"
        )

    # Start pose detection as a background task
    background_tasks.add_task(run_pose_detection, session, request.session_id)

    return {"message": "Pose detection started", "status": "processing"}


@router.get("/status/{session_id}")
async def get_pose_detection_status(session_id: str):
    """
    Get the status of pose detection for a session
    """
    from app import sessions

    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions[session_id]

    return {
        "status": session.get("pose_status", "not_started"),
        "progress": session.get("pose_progress", 0),
    }


async def run_pose_detection(session: Dict[str, Any], session_id: str):
    """
    Background task to run YOLO-Pose detection
    """
    # In a real implementation, this would:
    # 1. Load the YOLO-Pose model
    # 2. Process each frame's player masks
    # 3. Extract landmarks for each player
    # 4. Store pose data in the session

    # Placeholder implementation
    video_path = session["video_path"]
    masks = session["masks"]

    # Initialize poses dictionary if not exists
    if "poses" not in session:
        session["poses"] = {}

    total_frames = len(masks)
    processed_frames = 0

    # Update session status
    session["pose_status"] = "processing"
    session["pose_progress"] = 0

    # Process each frame with masks
    for frame_idx, frame_masks in masks.items():
        # Placeholder - In real implementation, this would call YOLO-Pose
        player1_pose = generate_dummy_pose()
        player2_pose = generate_dummy_pose()

        # Store poses
        session["poses"][frame_idx] = {"player1": player1_pose, "player2": player2_pose}

        # Update progress
        processed_frames += 1
        session["pose_progress"] = (processed_frames / total_frames) * 100

    # Update session status
    session["pose_status"] = "completed"
    session["pose_progress"] = 100


def generate_dummy_pose():
    """
    Generate dummy pose data for testing (placeholder)
    """
    # This would be replaced with actual YOLO-Pose output
    # COCO format has 17 keypoints
    keypoints = []
    for i in range(17):
        keypoints.extend([100 + i * 10, 100 + i * 5, 0.9])  # x, y, confidence

    return {
        "keypoints": keypoints,
        "bbox": [50, 50, 200, 400],  # x, y, width, height
    }
