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
│   │       ├── frames/    # Extracted .jpg frames
│   │       ├── metadata.json
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
2. Download SAM2 model weights:

```bash
# Create a checkpoints directory
mkdir -p backend/checkpoints

# Download SAM2 model weights (Hiera base+)
wget -P backend/checkpoints https://dl.fbaipublicfiles.com/segment_anything_2/sam2/sam2.1_hiera_base_plus.pt
```

3. (Optional) Configure environment variables in `.env` file:

```
SAM2_CHECKPOINT_PATH=/app/checkpoints/sam2.1_hiera_base_plus.pt
```

4. Start the containers:

```bash
docker-compose up --build
```

5. Access the frontend at <http://localhost:3000>
6. API documentation is available at <http://localhost:8000/docs>

## Processing Pipeline

1. Upload squash match video
2. Find frames with mainviews
3. Mark players in specific frames
4. Generate player masks using SAM2
5. Apply YOLO-Pose to detect body landmarks
6. Analyze pose data to detect game states (rally vs rest)
7. Export results for further analysis

## SAM2 Segmentation

The project uses Meta AI's Segment Anything Model 2 (SAM2) for high-quality player segmentation. SAM2 is a powerful foundation model for image segmentation that can be guided with prompts (points, boxes, or masks).

### Segmentation Features

- Interactive segmentation with positive and negative point prompts
- High-quality player masks that adapt to different camera angles and player positions
- Fast processing with GPU acceleration

### Working with SAM2

1. After uploading a video, navigate to the segmentation tab
2. Select a frame and mark positive points on the players (click on the player)
3. Add negative points if needed (click on background or other elements)
4. Process segmentation - SAM2 will generate masks for both players
5. Masks are stored and linked to player tracking throughout the video
