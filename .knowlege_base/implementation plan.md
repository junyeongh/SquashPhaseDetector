# Streamlined Implementation Plan for Squash Game Phase Detection

## Architecture Overview

**Backend**: FastAPI-based REST API for video processing, player segmentation, pose detection, and game state analysis.

**Frontend**: React with Tailwind CSS and minimal dependencies for video playback, player marking, and results visualization.

## Key Components

### Backend Structure

```
/backend
├── app.py                # Main FastAPI application
├── models/               # ML model integrations
├── routers/              # API endpoints
└── utils/                # Helper functions
```

### Frontend Structure

```
/frontend
├── src/
    ├── components/       # UI components
    ├── hooks/            # Custom React hooks
    ├── services/         # API client
    └── types/            # TypeScript definitions
```

## Processing Pipeline

1. **Video Upload**: User uploads squash match video
2. **Session Initialization**: System creates processing session
3. **Player Marking**: User marks players for identification
4. **Segmentation**: SAM2 generates player masks
5. **Pose Detection**: YOLO-Pose extracts body landmarks
6. **Game State Analysis**: CNN-based detection of rally/rest phases
7. **Results Export**: Generation of structured output files

## Key Technical Challenges

1. **Mask-to-Pose Integration**: Passing player masks from SAM2 to YOLO-Pose
2. **Player Identity Tracking**: Maintaining consistent player identification
3. **Temporal Analysis**: Processing sequential frames for state detection
4. **Memory Management**: Efficient handling of video data

## Implementation Priorities

1. Video upload and processing pipeline
2. Player segmentation with SAM2
3. Pose estimation with YOLO-Pose
4. Game state detection
5. Results export and visualization
