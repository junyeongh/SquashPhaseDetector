from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
import os
import csv
import json
import time

router = APIRouter(
    prefix="/analysis",
    tags=["analysis"],
    responses={404: {"description": "Not found"}},
)


class DetectPhasesRequest(BaseModel):
    session_id: str


class GameState(BaseModel):
    state: str  # "rally" or "rest"
    start_frame: int
    end_frame: int
    start_time: float
    end_time: float


EXPORT_FOLDER = os.environ.get("EXPORT_FOLDER", "./data/exports")


@router.post("/detect-phases")
async def detect_game_phases(
    request: DetectPhasesRequest, background_tasks: BackgroundTasks
):
    """
    Analyze pose data to detect game phases (rally vs rest)
    """
    from app import sessions

    if request.session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions[request.session_id]

    if "poses" not in session or not session["poses"]:
        raise HTTPException(status_code=400, detail="No pose data found in session")

    if session.get("pose_status") != "completed":
        raise HTTPException(
            status_code=400, detail="Pose detection must be completed first"
        )

    # Start game state detection as a background task
    background_tasks.add_task(run_game_state_detection, session, request.session_id)

    return {"message": "Game state detection started", "status": "processing"}


@router.get("/status/{session_id}")
async def get_analysis_status(session_id: str):
    """
    Get the status of game state analysis for a session
    """
    from app import sessions

    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions[session_id]

    return {
        "status": session.get("analysis_status", "not_started"),
        "progress": session.get("analysis_progress", 0),
    }


@router.get("/results/{session_id}")
async def get_analysis_results(session_id: str):
    """
    Get the game state analysis results for a session
    """
    from app import sessions

    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions[session_id]

    if "game_states" not in session or not session["game_states"]:
        raise HTTPException(status_code=400, detail="No game state data found")

    if session.get("analysis_status") != "completed":
        raise HTTPException(status_code=400, detail="Analysis not yet completed")

    return {"game_states": session["game_states"]}


@router.get("/export/{session_id}")
async def export_analysis(session_id: str):
    """
    Export analysis results as CSV and JSON files
    """
    from app import sessions

    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions[session_id]

    if "game_states" not in session or not session["game_states"]:
        raise HTTPException(status_code=400, detail="No game state data found")

    if session.get("analysis_status") != "completed":
        raise HTTPException(status_code=400, detail="Analysis not yet completed")

    # Create exports directory if it doesn't exist
    export_dir = os.path.join(EXPORT_FOLDER, session_id)
    os.makedirs(export_dir, exist_ok=True)

    # Export game states to CSV
    game_states_path = os.path.join(export_dir, "game_states.csv")
    with open(game_states_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["State", "Start Frame", "End Frame", "Start Time", "End Time"])
        for state in session["game_states"]:
            writer.writerow(
                [
                    state["state"],
                    state["start_frame"],
                    state["end_frame"],
                    state["start_time"],
                    state["end_time"],
                ]
            )

    # Export pose data to JSON
    poses_path = os.path.join(export_dir, "pose_data.json")
    with open(poses_path, "w") as f:
        json.dump(session["poses"], f)

    # Export masks data to JSON
    masks_path = os.path.join(export_dir, "mask_data.json")
    with open(masks_path, "w") as f:
        json.dump(session["masks"], f)

    # Create a zip file with all exports
    import shutil

    zip_path = os.path.join(EXPORT_FOLDER, f"{session_id}_exports.zip")
    shutil.make_archive(
        os.path.join(EXPORT_FOLDER, f"{session_id}_exports"), "zip", export_dir
    )

    # Return the zip file
    return FileResponse(
        path=zip_path,
        filename=f"squash_analysis_{session_id}.zip",
        media_type="application/zip",
    )


async def run_game_state_detection(session: Dict[str, Any], session_id: str):
    """
    Background task to run game state detection
    """
    # In a real implementation, this would:
    # 1. Load the game state detection model
    # 2. Analyze player pose sequences
    # 3. Detect rally and rest phases
    # 4. Store game state data in the session

    # Placeholder implementation
    poses = session["poses"]
    fps = 30  # Assume 30fps, this would be extracted from video metadata

    # Update session status
    session["analysis_status"] = "processing"
    session["analysis_progress"] = 0

    # Simulate processing time
    time.sleep(2)

    # Frame ranges for mock game states
    frame_ranges = [
        {"state": "rest", "start": 0, "end": 90},
        {"state": "rally", "start": 91, "end": 360},
        {"state": "rest", "start": 361, "end": 480},
        {"state": "rally", "start": 481, "end": 720},
        {"state": "rest", "start": 721, "end": 810},
    ]

    # Convert to game state objects
    game_states = []
    for range_data in frame_ranges:
        game_states.append(
            {
                "state": range_data["state"],
                "start_frame": range_data["start"],
                "end_frame": range_data["end"],
                "start_time": range_data["start"] / fps,
                "end_time": range_data["end"] / fps,
            }
        )

    # Store game states in session
    session["game_states"] = game_states

    # Update session status
    session["analysis_status"] = "completed"
    session["analysis_progress"] = 100
