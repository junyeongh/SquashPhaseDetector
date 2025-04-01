# Squash Phase Detector - Backend

The backend component of the Squash Phase Detector system, built with FastAPI. This service handles video processing, player segmentation, pose detection, and game phase analysis.

## 🚀 Features

- **Video Processing**: Upload, manage, and extract frames from squash match videos
- **Player Segmentation**: Detect and segment players using SAM2 (Segment Anything Model 2)
- **Pose Estimation**: Apply YOLO-Pose to detect player body landmarks
- **Phase Analysis**: Analyze pose data to detect game states (rally vs rest periods)
- **RESTful API**: Well-documented API endpoints for integration with frontend

## 🛠️ Tech Stack

- **FastAPI**: Modern, high-performance web framework for building APIs
- **OpenCV**: Computer vision library for video processing
- **PyTorch**: Deep learning framework for running the SAM2 model
- **YOLO-Pose**: Real-time pose estimation model
- **Ultralytics**: Framework for YOLO model usage
- **Docker**: Containerization for easy deployment

## 📁 Project Structure

```
backend/
├── routers/              # API endpoint definitions
│   ├── video.py          # Video upload and processing endpoints
│   ├── segmentation.py   # Player segmentation endpoints
│   ├── pose.py           # Pose detection endpoints
│   └── analysis.py       # Game phase analysis endpoints
├── models/               # ML model implementations
│   ├── sam2_model.py     # SAM2 model interface
│   ├── yolo_pose.py      # YOLO-Pose model interface
│   └── game_detector.py  # Game state detection algorithm
├── utils/                # Utility functions
│   └── ...               # Various helper functions
├── checkpoints/          # Model weights storage
├── data/                 # Data processing directory
├── app.py                # Main FastAPI application
├── Dockerfile            # Container definition
└── requirements.txt      # Python dependencies
```

## 🚀 Getting Started

### Prerequisites

- Python 3.8 or higher
- Docker and Docker Compose (recommended)
- NVIDIA GPU with CUDA support (for optimal performance)
- NVIDIA Container Toolkit installed

### Installation

#### Using Docker (Recommended)

1. From the project root, build and start the containers:

```bash
docker-compose up --build
```

#### Manual Setup

1. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run the server:

```bash
python app.py
```

4. Access the API at `http://localhost:8000`
5. API documentation at `http://localhost:8000/docs`

## 📝 API Reference

### Video Management

- `POST /videos/upload`: Upload a new squash match video
- `GET /videos/{video_id}`: Get video metadata
- `GET /videos/{video_id}/frames`: Get extracted frames from a video
- `DELETE /videos/{video_id}`: Delete a video and its associated data

### Segmentation

- `POST /segmentation/{video_id}/sam`: Generate player masks using SAM2
- `GET /segmentation/{video_id}/masks`: Get player segmentation masks

### Pose Detection

- `POST /pose/{video_id}/detect`: Detect player poses using YOLO-Pose
- `GET /pose/{video_id}/keypoints`: Get detected body keypoints

### Game Analysis

- `POST /analysis/{video_id}/phases`: Analyze game phases
- `GET /analysis/{video_id}/results`: Get game phase analysis results
- `GET /analysis/{video_id}/export`: Export analysis data

## 🧪 Testing

Run the test suite:

```bash
pytest
```

## 🔧 Development

### Adding a New API Endpoint

1. Create or modify a router in the `routers/` directory
2. Add your endpoint function with the appropriate decorator
3. Include the router in `app.py`

### Adding a New Model

1. Create a new model file in the `models/` directory
2. Implement model interface functions
3. Import and use in the appropriate router

## 📦 Environment Variables

- `UPLOAD_FOLDER`: Directory for storing uploaded videos (default: "./uploads")
- `EXPORT_FOLDER`: Directory for storing exported data (default: "./data/exports")
- `MODEL_CHECKPOINT_DIR`: Directory for model checkpoints (default: "./checkpoints")

## 🔍 Troubleshooting

### Common Issues

- **CUDA Out of Memory**: Reduce batch size or process fewer frames
- **Slow Processing**: Check GPU utilization, consider using a more powerful GPU
- **Missing Model Weights**: Ensure model checkpoints are properly downloaded

## 🤝 Contributing

1. Create a feature branch
2. Implement your changes
3. Add tests
4. Submit a pull request

## 📚 Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SAM2 Project](https://github.com/facebookresearch/segment-anything)
- [Ultralytics YOLOv8 Documentation](https://docs.ultralytics.com/)
