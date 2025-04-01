from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
import cv2
import os
import time
import asyncio

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/segmentation",
    tags=["segmentation"],
    responses={404: {"description": "Not found"}},
)


# Define request models
class Point(BaseModel):
    x: float
    y: float


class MarkPlayersRequest(BaseModel):
    sessionId: str
    frameIndex: int
    player1Points: List[Point]
    player2Points: List[Point]


class SAM2MarkersRequest(BaseModel):
    sessionId: str
    frameIndex: int
    player1PositivePoints: List[Point]
    player1NegativePoints: List[Point]
    player2PositivePoints: List[Point]
    player2NegativePoints: List[Point]


class ProcessSegmentationRequest(BaseModel):
    sessionId: str
    model: str = "Basic"  # Options: "Basic", "SAM2"
    startFrame: Optional[int] = None
    endFrame: Optional[int] = None
    frameInterval: Optional[int] = None


@router.post("/mark-players")
async def mark_players(request: MarkPlayersRequest):
    """
    Mark players in a specific frame for segmentation
    """
    from app import sessions

    if request.sessionId not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions[request.sessionId]

    # Convert points to format expected by SAM2
    player1_points = [[p.x, p.y] for p in request.player1Points]
    player2_points = [[p.x, p.y] for p in request.player2Points]

    # Store points in session
    if "markers" not in session:
        session["markers"] = {}

    session["markers"][request.frameIndex] = {
        "player1": player1_points,
        "player2": player2_points,
    }

    return {"success": True, "markers_count": len(session["markers"])}


@router.post("/mark-players-sam2")
async def mark_players_sam2(request: SAM2MarkersRequest):
    """
    Mark players in a specific frame using SAM2 positive and negative points
    """
    from app import sessions

    if request.sessionId not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions[request.sessionId]

    # Convert points to format expected by SAM2
    player1_positive = [[p.x, p.y] for p in request.player1PositivePoints]
    player1_negative = [[p.x, p.y] for p in request.player1NegativePoints]
    player2_positive = [[p.x, p.y] for p in request.player2PositivePoints]
    player2_negative = [[p.x, p.y] for p in request.player2NegativePoints]

    # Store points in session
    if "sam2_markers" not in session:
        session["sam2_markers"] = {}

    session["sam2_markers"][str(request.frameIndex)] = {
        "player1_positive": player1_positive,
        "player1_negative": player1_negative,
        "player2_positive": player2_positive,
        "player2_negative": player2_negative,
    }

    # Calculate total markers count for response
    total_markers = len(player1_positive) + len(player1_negative) + len(player2_positive) + len(player2_negative)

    return {"success": True, "markers_count": total_markers}


@router.post("/start-segmentation")
async def process_segmentation(request: ProcessSegmentationRequest, background_tasks: BackgroundTasks):
    """
    Process player segmentation using the specified model based on markers
    """
    from app import sessions

    if request.sessionId not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions[request.sessionId]

    # Update session with model choice and segmentation parameters
    session["segmentation_model"] = request.model
    session["segmentation_status"] = "processing"
    session["segmentation_progress"] = 0
    
    # Store frame range parameters
    if request.startFrame is not None:
        session["segmentation_start_frame"] = request.startFrame
    if request.endFrame is not None:
        session["segmentation_end_frame"] = request.endFrame
    if request.frameInterval is not None:
        session["segmentation_frame_interval"] = request.frameInterval

    # Check if we have the right markers for the selected model
    if request.model == "SAM2":
        if "sam2_markers" not in session or not session["sam2_markers"]:
            raise HTTPException(status_code=400, detail="No SAM2 player markers found in session")
        # Start segmentation as a background task with SAM2 model
        background_tasks.add_task(run_sam2_segmentation_pipeline, session, request.sessionId)
    else:
        # Legacy model handling
        if "markers" not in session or not session["markers"]:
            raise HTTPException(status_code=400, detail="No player markers found in session")
        # Start segmentation as a background task with basic model
        background_tasks.add_task(run_segmentation_pipeline, session, request.sessionId)

    return {"success": True, "message": "Segmentation processing started"}


@router.get("/status/{sessionId}")
async def get_segmentation_status(sessionId: str):
    """
    Get the current status of segmentation processing
    """
    from app import sessions

    if sessionId not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions[sessionId]

    # Default status values
    status = session.get("segmentation_status", "pending")
    message = "Segmentation not started"
    progress = 0
    results = None

    if status == "processing":
        message = "Segmentation in progress"
        progress = session.get("segmentation_progress", 0)
    elif status == "completed":
        message = "Segmentation completed"
        progress = 100

        # Include some sample results if available
        if "masks" in session:
            # Convert session masks to expected format
            masks_dict = session["masks"]
            if masks_dict:
                # Just return the first 5 frames for performance
                frame_indices = sorted(list(masks_dict.keys()))[:5]
                results = [
                    {
                        "frameIndex": int(frame_idx),
                        "player1Mask": masks_dict[frame_idx]["player1"],
                        "player2Mask": masks_dict[frame_idx]["player2"],
                    }
                    for frame_idx in frame_indices
                ]

    return {
        "status": status,
        "progress": progress,
        "message": message,
        "results": results,
    }


@router.get("/mask/{sessionId}/{frameIndex}")
async def get_frame_mask(sessionId: str, frameIndex: int):
    """
    Get segmentation mask for a specific frame
    """
    from app import sessions

    if sessionId not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions[sessionId]

    if "masks" not in session or not session["masks"]:
        raise HTTPException(status_code=404, detail="No masks found for session")

    if str(frameIndex) not in session["masks"]:
        raise HTTPException(status_code=404, detail=f"No mask found for frame {frameIndex}")

    frame_masks = session["masks"][str(frameIndex)]

    return {
        "frameIndex": frameIndex,
        "player1Mask": frame_masks["player1"],
        "player2Mask": frame_masks["player2"],
    }


async def run_segmentation_pipeline(session: Dict[str, Any], sessionId: str):
    """
    Background task to run basic segmentation
    """
    # In a real implementation, this would:
    # 1. Load a simple segmentation model
    # 2. Process each frame with markers
    # 3. Generate masks for both players
    # 4. Store masks in the session

    # Placeholder implementation
    video_path = session["video_path"]
    markers = session["markers"]

    # Initialize masks dictionary if not exists
    if "masks" not in session:
        session["masks"] = {}

    # Get video dimensions to create proper-sized masks
    try:
        cap = cv2.VideoCapture(video_path)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        cap.release()
    except Exception as e:
        logger.error(f"Error getting video dimensions: {str(e)}")
        width, height = 1920, 1080  # Default dimensions

    # Process each frame with markers
    for i, (frame_idx, frame_markers) in enumerate(markers.items()):
        # Update progress
        session["segmentation_progress"] = (i + 1) / len(markers) * 100

        # Placeholder - In real implementation, this would call a segmentation model
        player1_mask = generate_dummy_mask(width, height)
        player2_mask = generate_dummy_mask(width, height)

        # Store masks
        session["masks"][frame_idx] = {"player1": player1_mask, "player2": player2_mask}

    # Update session status
    session["segmentation_status"] = "completed"


async def run_sam2_segmentation_pipeline(session: Dict[str, Any], sessionId: str):
    """
    Background task to run SAM2 segmentation
    """
    from models.sam2_model import get_sam2_predictor
    
    try:
        # Get the SAM2 predictor instance
        sam2_predictor = get_sam2_predictor()
        
        # Get session data
        video_path = session["video_path"]
        sam2_markers = session["sam2_markers"]
        
        # Get frame range parameters
        start_frame = session.get("segmentation_start_frame", None)
        end_frame = session.get("segmentation_end_frame", None)
        frame_interval = session.get("segmentation_frame_interval", 1)
        
        # Initialize masks dictionary if not exists
        if "masks" not in session:
            session["masks"] = {}
        
        # Find the frames to process
        if start_frame is not None and end_frame is not None:
            # Process specified frame range
            frames_to_process = range(start_frame, end_frame + 1, frame_interval)
        else:
            # Process only frames with markers
            frames_to_process = [int(frame_idx) for frame_idx in sam2_markers.keys()]
        
        # Track progress
        total_frames = len(frames_to_process)
        processed_frames = 0
        
        # Process each frame
        for frame_idx in frames_to_process:
            frame_idx_str = str(frame_idx)
            
            # Get markers for this frame (if available)
            if frame_idx_str in sam2_markers:
                frame_markers = sam2_markers[frame_idx_str]
                player1_positive = frame_markers["player1_positive"]
                player1_negative = frame_markers["player1_negative"]
                player2_positive = frame_markers["player2_positive"]
                player2_negative = frame_markers["player2_negative"]
                
                # Call SAM2 model to generate masks
                player1_mask, player2_mask = sam2_predictor.generate_masks(
                    video_path=video_path,
                    frame_idx=frame_idx,
                    player1_positive_points=player1_positive,
                    player1_negative_points=player1_negative,
                    player2_positive_points=player2_positive,
                    player2_negative_points=player2_negative
                )
                
                # Store masks
                session["masks"][frame_idx_str] = {
                    "player1": player1_mask,
                    "player2": player2_mask
                }
            else:
                # If no markers for this frame, use SAM2 to track masks from nearby frames
                # This would require SAM2VideoPredictor implementation for tracking
                # For now, we'll just create dummy masks
                logger.warning(f"No markers found for frame {frame_idx}, using dummy masks")
                
                # Get video dimensions
                try:
                    cap = cv2.VideoCapture(video_path)
                    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                    cap.release()
                except Exception as e:
                    logger.error(f"Error getting video dimensions: {str(e)}")
                    width, height = 1920, 1080  # Default dimensions
                
                # Generate dummy masks for now
                # In a full implementation, this would use SAM2VideoPredictor for tracking
                player1_mask = generate_dummy_mask(width, height)
                player2_mask = generate_dummy_mask(width, height)
                
                session["masks"][frame_idx_str] = {
                    "player1": player1_mask,
                    "player2": player2_mask
                }
            
            # Update progress
            processed_frames += 1
            session["segmentation_progress"] = (processed_frames / total_frames) * 100
            
            # Add a small delay to prevent hogging resources
            await asyncio.sleep(0.01)
        
        # Update session status
        session["segmentation_status"] = "completed"
        logger.info(f"SAM2 segmentation completed for session {sessionId}")
        
    except Exception as e:
        logger.error(f"Error in SAM2 segmentation pipeline: {str(e)}")
        session["segmentation_status"] = "error"
        session["segmentation_error"] = str(e)


def generate_dummy_mask(width: int, height: int):
    """
    Generate a dummy mask for testing (placeholder)
    """
    # This would be replaced with actual SAM2 output
    return {"size": [height, width], "counts": "3000:2000"}  # Simple RLE encoding
