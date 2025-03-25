# Squash Game Phase Detection

A system for analyzing squash match videos, automatically detecting game phases (primarily rally and rest periods), and generating structured data for further analysis. The system combines SAM2 for player segmentation, YOLO-Pose for pose estimation, and a custom game state detection algorithm.

## Project Structure

```
/
├── backend/                 # FastAPI backend
│   ├── routers/             # API endpoints
│   ├── models/              # ML model integrations
│   └── app.py               # Main FastAPI application
├── frontend/                # React frontend
│   └── Dockerfile           # Frontend container definition
├── docker-compose.yml       # Docker configuration
├── data/                    # Data output directory
│   ├── uploads/
│       ├── [uuid]/
│           └── frames/
│   └── exports/
└── uploads/                 # Video upload directory
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
2. Mark players in specific frames
3. Generate player masks using SAM2
4. Apply YOLO-Pose to detect body landmarks
5. Analyze pose data to detect game states (rally vs rest)
6. Export results for further analysis
