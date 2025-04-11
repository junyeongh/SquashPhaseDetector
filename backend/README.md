# Squash Phase Detector - Backend

The backend component of the Squash Phase Detector system, built with FastAPI. This service handles video processing, player segmentation, pose detection, and game phase analysis.

## Tech Stack

- **FastAPI**: Modern, high-performance web framework for building APIs
- **OpenCV**: Computer vision library for video processing
- **PyTorch**: Deep learning framework for running the SAM2 model
- **YOLO-Pose**: Real-time pose estimation model
- **Ultralytics**: Framework for YOLO model usage
- **Docker**: Containerization for easy deployment

## Getting Started

### Prerequisites

- Python 3.8 or higher
- Docker and Docker Compose (recommended)
- NVIDIA GPU with CUDA support (for optimal performance)
- NVIDIA Container Toolkit installed

### Installation

#### Using Docker (Recommended)

From the project root, build and start the containers:

```bash
docker-compose up --build
```

## Development

### Adding a New API Endpoint

1. Create or modify a router in the `routers/` directory
2. Add your endpoint function with the appropriate decorator
3. Include the router in `app.py`

### Adding a New Model

1. Create a new model file in the `models/` directory
2. Implement model interface functions
3. Import and use in the appropriate router

## Environment Variables

- `UPLOAD_FOLDER`: Directory for storing uploaded videos (default: "./uploads")
- `EXPORT_FOLDER`: Directory for storing exported data (default: "./data/exports")
- `MODEL_CHECKPOINT_DIR`: Directory for model checkpoints (default: "./checkpoints")

## Troubleshooting

### Common Issues

- **CUDA Out of Memory**: Reduce batch size or process fewer frames
- **Slow Processing**: Check GPU utilization, consider using a more powerful GPU

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SAM2 Project](https://github.com/facebookresearch/segment-anything)
- [Ultralytics YOLO Documentation](https://docs.ultralytics.com/)
