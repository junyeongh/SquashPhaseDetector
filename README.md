# Squash Game Phase Detection

A system for analyzing squash match videos, automatically detecting game phases (primarily rally and rest periods), and generating structured data for further analysis. The system combines SAM2 for player segmentation, YOLO-Pose for pose estimation, and a custom game state detection algorithm.

## Project Structure

```
SquashPhaseDetector/
├── backend/               # FastAPI backend
│   ├── routers/           # API endpoints (video.py, segmentation.py, etc.)
│   ├── models/            # ML model integration (sam2_model.py, etc.)
│   ├── utils/             # Utility functions (video.py, etc.)
│   └── app.py             # Main FastAPI application
├── frontend/
│   ├── src/
│   │   ├── components/    # React components (video/, segmentation/, etc.)
│   │   ├── services/      # API service functions (api/video.ts, api/segmentation.ts)
│   │   ├── pages/         # Top-level page components (VideoDetailPage.tsx)
│   │   ├── utils/         # Frontend utility functions (rleUtils.ts)
│   │   └── ...
│   └── Dockerfile
├── data/
│   ├── uploads/           # Directory for uploaded videos and extracted frames
│   │   └── [uuid]/
│   │       ├── frames/           # Extracted .jpg frames
│   │       ├── segmentation/     # Segmentation results in numpy arrays
│   │       │   ├── results/      # Results of segmentation masks for each frame
│   │       │   │   ├── 1/        #
│   │       │   │   ├── 2/        #
│   │       ├── pose/             # Pose detection results in numpy arrays
│   │       │   ├── results/      # { "frame_name": ..., "keypoints_data": ..., "keypoints_conf": ..., "bounding_box": ... }
│   │       │   │   ├── 1/        # Player 1
│   │       │   │   ├── 2/        # Player 2
│   │       ├── metadata.json     # Video metadata
│   │       ├── pose.json         # Pose detection frames indices for frontend
│   │       ├── segmentation.json # Segmentation marker inputs and frames indices for frontend
│   │       └── mainview_timestamp.csv
│   └── exports/
├── docker-compose.yml
├── README.md
└── ...
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- NVIDIA GPU with CUDA support (for optimal performance)
- NVIDIA Container Toolkit installed
- SAM2 model weights (download instructions below)

### Running the Project

1. Clone the repository
2. Start the containers:

```bash
docker-compose up --build
```

- Access the API at `http://localhost:8000`
- API documentation at `http://localhost:8000/docs`

## Processing Pipeline

1. Upload squash match video
2. Find frames with main views
3. Mark players in specific frames
4. Generate player masks using SAM2
5. Apply YOLO-Pose to detect body landmarks

### Segmentation - Segment Anything Model 2 (SAM2)

The project uses Meta AI's Segment Anything Model 2 (SAM2) for high-quality player segmentation. SAM2 is a powerful foundation model for image segmentation that can be guided with prompts (points, boxes, or masks).

1. After uploading a video, navigate to the segmentation tab
2. Select a frame and mark positive points on the players (click on the player)
3. Add negative points if needed (click on background or other elements)
4. Process segmentation - SAM2 will generate masks for both players
5. Masks are stored and linked to player tracking throughout the video

### Pose Detection

The project uses Ultralytics YOLO for pose detection, which provides accurate and efficient estimation of player poses during the match. Additionally, it integrates seamlessly with the segmentation results to enhance player tracking and analysis.
