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
    model: str = "SAM2"  # Options: "Basic", "SAM2"
    startFrame: Optional[int] = None
    endFrame: Optional[int] = None
    frameInterval: Optional[int] = None


class PropagateSegmentationRequest(BaseModel):
    sessionId: str
    sourceFrameIndex: int
    startFrame: Optional[int] = None
    endFrame: Optional[int] = None
    frameInterval: int = 1


class DeleteSegmentationMasksRequest(BaseModel):
    sessionId: str
    frameIndices: List[int]


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

    # If using SAM2, process this single frame immediately
    if total_markers > 0:
        # Import here to avoid circular imports
        from models.sam2_model import get_sam2_predictor

        try:
            # Get the SAM2 predictor
            sam2_predictor = get_sam2_predictor()

            # Check if we need to initialize the video tracker
            if "video_tracker_initialized" not in session or not session["video_tracker_initialized"]:
                video_path = session["video_path"]
                tracker_initialized = sam2_predictor.initialize_video_tracker(request.sessionId, video_path)
                session["video_tracker_initialized"] = tracker_initialized
                logger.info(f"Video tracker initialized: {tracker_initialized}")

            # Process player1 points
            if player1_positive:
                sam2_predictor.add_points_to_video_tracker(
                    session_id=request.sessionId,
                    frame_idx=request.frameIndex,
                    player_id="player1",
                    positive_points=player1_positive,
                    negative_points=player1_negative,
                )

            # Process player2 points
            if player2_positive:
                sam2_predictor.add_points_to_video_tracker(
                    session_id=request.sessionId,
                    frame_idx=request.frameIndex,
                    player_id="player2",
                    positive_points=player2_positive,
                    negative_points=player2_negative,
                )

            # Create masks dictionary if it doesn't exist
            if "masks" not in session:
                session["masks"] = {}

            # Generate masks for the current frame
            player1_mask, player2_mask = sam2_predictor.generate_masks(
                video_path=session["video_path"],
                frame_idx=request.frameIndex,
                player1_positive_points=player1_positive,
                player1_negative_points=player1_negative,
                player2_positive_points=player2_positive,
                player2_negative_points=player2_negative,
            )

            # Store the masks
            session["masks"][str(request.frameIndex)] = {"player1": player1_mask, "player2": player2_mask}

        except Exception as e:
            logger.error(f"Error processing SAM2 markers: {str(e)}")

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


@router.post("/propagate")
async def propagate_segmentation(request: PropagateSegmentationRequest, background_tasks: BackgroundTasks):
    """
    Propagate segmentation from a source frame to a range of frames
    """
    from app import sessions

    if request.sessionId not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions[request.sessionId]

    # Validate that source frame has segmentation
    if "masks" not in session or str(request.sourceFrameIndex) not in session["masks"]:
        raise HTTPException(status_code=400, detail="Source frame has no segmentation masks")

    # Set propagation parameters
    session["propagation_status"] = "processing"
    session["propagation_progress"] = 0
    session["propagation_source_frame"] = request.sourceFrameIndex
    session["propagation_start_frame"] = request.startFrame
    session["propagation_end_frame"] = request.endFrame
    session["propagation_frame_interval"] = request.frameInterval

    # Start propagation as a background task
    background_tasks.add_task(
        run_sam2_propagation_pipeline,
        session,
        request.sessionId,
        request.sourceFrameIndex,
        request.startFrame,
        request.endFrame,
        request.frameInterval,
    )

    return {"success": True, "message": "Segmentation propagation started"}


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


@router.get("/frames/{sessionId}")
async def get_segmentation_frames(sessionId: str):
    """
    Get all frames that have segmentation masks
    """
    from app import sessions

    if sessionId not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions[sessionId]

    if "masks" not in session or not session["masks"]:
        return {"frames": []}

    # Get all frame indices that have masks
    frame_indices = [int(frame_idx) for frame_idx in session["masks"].keys()]
    frame_indices.sort()

    return {"frames": frame_indices}


@router.delete("/masks/{sessionId}")
async def delete_segmentation_masks(sessionId: str, request: DeleteSegmentationMasksRequest):
    """
    Delete segmentation masks for specified frames
    """
    from app import sessions

    if sessionId not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions[sessionId]

    if "masks" not in session or not session["masks"]:
        raise HTTPException(status_code=404, detail="No masks found for session")

    # Delete masks for specified frames
    deleted_count = 0
    for frame_idx in request.frameIndices:
        str_frame_idx = str(frame_idx)
        if str_frame_idx in session["masks"]:
            del session["masks"][str_frame_idx]
            deleted_count += 1

    return {"success": True, "message": f"Deleted {deleted_count} mask(s)", "deleted_count": deleted_count}


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

        # Check if we need to initialize the video tracker
        if "video_tracker_initialized" not in session or not session["video_tracker_initialized"]:
            tracker_initialized = sam2_predictor.initialize_video_tracker(sessionId, video_path)
            session["video_tracker_initialized"] = tracker_initialized
            logger.info(f"Video tracker initialized: {tracker_initialized}")

        # Track progress
        total_frames = len(frames_to_process)
        processed_frames = 0

        # Add markers to each frame
        for frame_idx in frames_to_process:
            frame_idx_str = str(frame_idx)

            # Get markers for this frame (if available)
            if frame_idx_str in sam2_markers:
                frame_markers = sam2_markers[frame_idx_str]
                player1_positive = frame_markers["player1_positive"]
                player1_negative = frame_markers["player1_negative"]
                player2_positive = frame_markers["player2_positive"]
                player2_negative = frame_markers["player2_negative"]

                # Process player1
                if player1_positive:
                    # Add points to tracker
                    sam2_predictor.add_points_to_video_tracker(
                        session_id=sessionId,
                        frame_idx=frame_idx,
                        player_id="player1",
                        positive_points=player1_positive,
                        negative_points=player1_negative,
                    )

                # Process player2
                if player2_positive:
                    # Add points to tracker
                    sam2_predictor.add_points_to_video_tracker(
                        session_id=sessionId,
                        frame_idx=frame_idx,
                        player_id="player2",
                        positive_points=player2_positive,
                        negative_points=player2_negative,
                    )

                # Generate masks for this frame
                player1_mask, player2_mask = sam2_predictor.generate_masks(
                    video_path=video_path,
                    frame_idx=frame_idx,
                    player1_positive_points=player1_positive,
                    player1_negative_points=player1_negative,
                    player2_positive_points=player2_positive,
                    player2_negative_points=player2_negative,
                )

                # Store masks
                session["masks"][frame_idx_str] = {"player1": player1_mask, "player2": player2_mask}

            # Update progress
            processed_frames += 1
            session["segmentation_progress"] = (processed_frames / total_frames) * 100

            # Add a small delay to prevent hogging resources
            await asyncio.sleep(0.01)

        # Now propagate segmentation if needed
        if start_frame is not None and end_frame is not None:
            # Find a frame with markers to use as source
            source_frames = [int(k) for k in sam2_markers.keys()]
            if source_frames:
                source_frame = source_frames[0]  # Use the first frame with markers

                # Run propagation
                masks_dict = sam2_predictor.propagate_video_tracking(
                    session_id=sessionId, start_frame=start_frame, end_frame=end_frame, frame_interval=frame_interval
                )

                # Update session masks
                if masks_dict:
                    for frame_idx, frame_masks in masks_dict.items():
                        session["masks"][frame_idx] = frame_masks

        # Update session status
        session["segmentation_status"] = "completed"
        logger.info(f"SAM2 segmentation completed for session {sessionId}")

    except Exception as e:
        logger.error(f"Error in SAM2 segmentation pipeline: {str(e)}")
        session["segmentation_status"] = "error"
        session["segmentation_error"] = str(e)


async def run_sam2_propagation_pipeline(
    session: Dict[str, Any],
    sessionId: str,
    source_frame: int,
    start_frame: Optional[int] = None,
    end_frame: Optional[int] = None,
    frame_interval: int = 1,
):
    """
    Background task to propagate SAM2 segmentation across frames
    """
    from models.sam2_model import get_sam2_predictor

    try:
        # Get the SAM2 predictor instance
        sam2_predictor = get_sam2_predictor()

        # Make sure video tracker is initialized
        if "video_tracker_initialized" not in session or not session["video_tracker_initialized"]:
            video_path = session["video_path"]
            tracker_initialized = sam2_predictor.initialize_video_tracker(sessionId, video_path)
            session["video_tracker_initialized"] = tracker_initialized
            logger.info(f"Video tracker initialized: {tracker_initialized}")

            # If initialization failed, abort
            if not tracker_initialized:
                session["propagation_status"] = "error"
                session["propagation_error"] = "Failed to initialize video tracker"
                return

        # Determine frame range
        if start_frame is None:
            # Default to source frame - 30 (or 0 if that would be negative)
            start_frame = max(0, source_frame - 30)

        if end_frame is None:
            # Default to source frame + 30
            end_frame = source_frame + 30

        # Run propagation
        logger.info(f"Propagating segmentation from frame {source_frame} to frames {start_frame}-{end_frame}")
        masks_dict = sam2_predictor.propagate_video_tracking(
            session_id=sessionId, start_frame=start_frame, end_frame=end_frame, frame_interval=frame_interval
        )

        # Initialize masks dictionary if not exists
        if "masks" not in session:
            session["masks"] = {}

        # Update session masks
        if masks_dict:
            for frame_idx, frame_masks in masks_dict.items():
                session["masks"][frame_idx] = frame_masks

            session["propagation_status"] = "completed"
            logger.info(f"Propagation completed for session {sessionId}")
        else:
            session["propagation_status"] = "error"
            session["propagation_error"] = "No masks generated during propagation"

    except Exception as e:
        logger.error(f"Error in SAM2 propagation pipeline: {str(e)}")
        session["propagation_status"] = "error"
        session["propagation_error"] = str(e)


def generate_dummy_mask(width: int, height: int):
    """
    Generate a dummy mask for testing (placeholder)
    """
    # This would be replaced with actual SAM2 output
    return {"size": [height, width], "counts": "3000:2000"}  # Simple RLE encoding
