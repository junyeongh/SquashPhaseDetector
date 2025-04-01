# Squash Game Phase Detection - Tech Stack Summary for SquashPhaseDetector

This document contains technical decisions, implementation details, and other knowledge gathered during the development of the Squash Game Phase Detection system. This project is a full-stack application for analyzing squash match videos, with the following tech stack:

**Backend**: FastAPI-based REST API for video processing, player segmentation, pose detection, and game state analysis.
**Frontend**: React with Tailwind CSS and minimal dependencies for video playback, player marking, and results visualization.

## Frontend

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Styling**: TailwindCSS 4 with custom configuration
- **Routing**: React Router DOM 7
- **UI Components**:
  - Custom components with TailwindCSS styling
  - Lucide React for icons
- **API Communication**: Axios for HTTP requests
- **Media**: React Player for video playback
- **Utility Libraries**:
  - class-variance-authority
  - clsx
  - tailwind-merge
  - dayjs for date formatting

## Backend

- **Framework**: FastAPI with Python
- **Video Processing**:
  - OpenCV (opencv-python)
  - imagehash
- **Machine Learning Models**:
  - SAM2 for segmentation (PyTorch, torchvision)
  - YOLO-Pose for pose estimation (ultralytics)
- **Data Processing**: NumPy

### Key Dependencies

1. **FastAPI Backend Core**
   - fastapi[standard] ≥ 0.115.0
   - uvicorn ≥ 0.34.0
   - python-multipart ≥ 0.0.20
   - pydantic ≥ 2.7.1
   - aiofiles ≥ 23.2.1

2. **Video Processing**
   - opencv-python ≥ 4.11.0.86
   - ffmpeg-python ≥ 0.2.0
   - moviepy ≥ 2.0.0
   - imagehash ≥ 4.3.2 (for camera view detection)

3. **SAM2 Segmentation Model**
   - torch ≥ 2.5.1 (PyTorch 2.5.1+ is required for SAM2 compatibility)
   - torchvision ≥ 0.20.1
   - timm ≥ 0.9.5 (Required for Hiera models in SAM2)
   - pycocotools ≥ 2.0.7
   - hydra-core, iopath (for SAM2 configuration)

4. **YOLO-Pose Detection Model**
   - ultralytics ≥ 8.1.23

5. **Data Analysis**
   - scikit-learn ≥ 1.6.0
   - scipy ≥ 1.13.0

### Model Downloads

- SAM2 model checkpoints are downloaded during Docker build:
  - SAM2 Base Plus: `sam2.1_hiera_base_plus.pt`
  - SAM2 Large: `sam2.1_hiera_large.pt`
- YOLO-Pose models are downloaded during Docker build:
  - `yolo11m-pose.pt`
  - `yolo11l-pose.pt`

## Infrastructure

- **Containerization**: Docker and Docker Compose
- **Web Server**: Nginx for frontend static files
- **Environment**: NVIDIA GPU support for optimal performance

### Docker Setup

- Base image: `pytorch/pytorch:2.5.1-cuda12.1-cudnn9-runtime` for CUDA 12.1 support
- GPU passthrough is configured in docker-compose.yml using NVIDIA Container Toolkit
- The setup has been tested and confirmed working with RTX 3070 Ti

## Architecture

- **Frontend Structure**:
  - Component-based architecture with TypeScript
  - Clean separation of concerns (components, services, utilities)
  - Path aliasing with '@' for src directory

- **Backend Structure**:
  - Modular API with routers for different functionalities
  - Model integration for ML components
  - Utility functions for common operations

## Integration Notes

### SAM2 Integration

- SAM2 requires PyTorch 2.5.1+ for full compatibility
- The demo uses custom CUDA extensions for optimized performance, which need to be handled carefully in Docker
- SAM2 functionality is adapted to work within a REST API context through custom wrapper code

### FastAPI Implementation

- REST API is used instead of the GraphQL approach in the original SAM2 demo
- Endpoints are organized by functional area (video, segmentation, pose, analysis)
- Background tasks are used for time-consuming operations to keep the API responsive

## Architecture Decisions

- Simplified tech stack compared to original SAM2 demo
- Focus on a clean pipeline from video upload to state detection
- Player segmentation works with user-provided markers rather than automated detection
- YOLO-Pose is applied within player masks to improve landmark detection accuracy
