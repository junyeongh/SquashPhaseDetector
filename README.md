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

### Running the Project

1. Clone the repository
2. Start the containers:

```bash
docker-compose up --build
```

3. Access the frontend at <http://localhost:3000>
4. API documentation is available at <http://localhost:8000/docs>

## Processing Pipeline

1. Upload squash match video
2. Find frames with mainviews
3. Mark players in specific frames
4. Generate player masks using SAM2
5. Apply YOLO-Pose to detect body landmarks
6. Analyze pose data to detect game states (rally vs rest)
7. Export results for further analysis
