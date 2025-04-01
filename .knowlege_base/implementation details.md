# Implementation Details for Squash Game Phase Detection

## Technology Stack

**Backend:**

- FastAPI REST API instead of Flask/GraphQL used in the SAM2 demo
- PyTorch with CUDA support for ML model inference
- Ultralytics YOLOv8 for pose estimation

**Frontend:**

- React with Node.js 22.14.0
- Tailwind CSS for styling
- Simplified REST API client approach

## Architecture Overview

1. **Backend Components:**
   - FastAPI application with endpoints for video processing
   - SAM2 integration for player segmentation
   - YOLO-Pose integration for landmark detection
   - Game state detection module for rally/rest classification
   - Export functionality for analysis results

2. **Frontend Components:**
   - Video player with frame navigation
   - Segmentation layer for player marking and mask visualization
   - Pose visualization layer for displaying landmarks
   - Game state timeline for showing detected phases
   - Export controls for downloading results

## Development Workflow

1. Docker-based development environment
2. Component-wise implementation and testing
3. Pipeline integration from video upload to export
4. Focus on core functionality over exhaustive testing

## Technical Challenges

1. **SAM2 to YOLO-Pose Integration:**
   - Passing player masks from SAM2 to YOLO-Pose
   - Maintaining player identity across frames
2. **Game State Detection:**
   - Feature engineering from pose landmarks
   - Temporal pattern recognition using CNN approach
   - State transition detection
3. **Performance Optimization:**
   - Background tasks for time-consuming operations
   - Efficient video frame processing
