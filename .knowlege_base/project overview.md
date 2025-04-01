## Project Summary

This project aims to develop a web-based system for analyzing squash match videos, automatically detecting game phases (primarily rally and rest periods), and generating structured data for further analysis. The system combines computer vision techniques and machine learning approaches to track players and analyze their movements throughout a match.

## System Architecture

The complete pipeline follows this process:
```
Input Video → Preprocessing → Player Motion Analysis → Game State Detection → Export
```

### Key Components:

1. **Web Interface**: User-interactive platform for video upload, round indication, and marker placement
2. **Preprocessing Module**: Identifies main camera viewpoints using perceptual hashing
3. **Player Segmentation Module**: Uses SAM2 with user-provided markers to create player masks
4. **Pose Estimation Module**: Applies YOLO-Pose to detect body landmarks within player masks
5. **Game State Detection Module**: Uses landmark data to identify rally/rest phases
6. **Export Module**: Outputs data in formats compatible with analysis tools

## Detailed Component Specifications

### 1. Web Interface

**Purpose**: Provide a user-friendly platform for interacting with the system.

**Features**:

- Video upload functionality
- Round indication interface
- Interactive marker placement for player segmentation
- Processing status visualization
- Results display and export options

**Implementation**:

- Backend: Flask/Django
- Frontend: Web-based UI (likely JavaScript framework)
- Data handling: Secure file uploads and efficient video processing

### 2. Preprocessing Module

**Purpose**: Filter and prepare video frames for analysis.

**Status**: Completed component that identifies main view using perceptual hashing.

**Features**:

- Camera angle detection and consistency checking
- Frame extraction at appropriate intervals
- Filtering out non-gameplay sections

**Implementation**:

- Perceptual hashing algorithms to identify similar frames
- OpenCV for video processing
- FFmpeg for video manipulation when needed

### 3. Player Segmentation Module

**Purpose**: Create precise masks defining the boundaries of each player.

**Features**:

- User-guided marker placement for each game stage
- Player mask generation using SAM2
- Consistent tracking of player identities

**Implementation**:

- SAM2 (Segment Anything Model 2) integration
- Interactive segmentation based on user-provided points
- Handling of player identification and tracking

**User Input Requirements**:

- Markers need to be placed for each game stage
- System maintains player identity based on these markers

### 4. Pose Estimation Module

**Purpose**: Extract body landmark positions for each player.

**Features**:

- Application of pose detection within player masks
- Extraction of key body landmarks
- Tracking of landmarks across frames

**Implementation**:

- YOLO-Pose model integration
- Separate processing for each player mask
- Landmark normalization and consistency checking

**Technical Challenge**:

- Method for passing masks from SAM2 to YOLO-Pose (currently being developed)

### 5. Game State Detection Module

**Purpose**: Classify video segments into rally and rest phases.

**Features**:

- Analysis of player positions and movements
- Temporal pattern recognition
- State transition detection

**Implementation**:

- CNN-based approach for temporal sequence analysis
- Feature engineering focused on body center position
- Tracking of shoulders and hips as key indicators
- Analysis window of several seconds for context

### 6. Export Module

**Purpose**: Generate structured data outputs for external analysis.

**Features**:

- Multiple file format outputs
- Comprehensive metadata inclusion

**Implementation**:

- Three primary output files:
  1. **Mask data**: Frame number, player 1 mask array, player 2 mask array
  2. **Pose data**: Frame number, player 1 pose array, player 2 pose array
  3. **State classification**: State, start frame, start timestamp, end frame, end timestamp

## Technical Specifications

### Input Requirements

- Video format: MP4, MOV
- Frame rate: 25-30 FPS
- Primary camera angle: Back-of-court view
- Video quality: HD preferred

### Processing Requirements

- Python environment with GPU support recommended
- Key libraries: OpenCV, TensorFlow/PyTorch, FFmpeg
- AI models: SAM2, YOLO-Pose
- Web server capabilities for interface hosting

### Output Specifications

- Mask data: Numpy arrays or similar format
- Pose data: Structured arrays of landmark coordinates
- State data: CSV with timestamps and classifications
