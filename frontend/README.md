# Frontend Architecture Documentation

## Component Hierarchy

The frontend application follows a hierarchical structure with the following main components:

### Root Level (App.tsx)

- Entry point of the application
- Manages global states:
  - `loading`: API connection state
  - `error`: API connection error state
  - `completedSteps`: Pipeline state for tracking completed steps
  - `uploadedFiles`: List of uploaded video files

### Layout Components

1. `Sidebar` (`/layout/Sidebar.tsx`)

   - Displays list of uploaded videos
   - Props:
     - `uploadedFiles`: Array of `FileInfo` objects

2. `MainContent` (`/layout/MainContent.tsx`)
   - Main content area wrapper
   - Children: Route components

### Page Components

1. `UploadPage` (`/pages/UploadPage.tsx`)

   - Handles video upload functionality
   - Props:
     - `uploadedFiles`: Array of `FileInfo` objects
     - `setCompletedSteps`: Function to update completed steps
     - `completedSteps`: Set of completed step IDs
     - `fetchUploadedFiles`: Function to refresh uploaded files list

2. `VideoDetailPage` (`/pages/VideoDetailPage.tsx`)
   - Displays video details and processing options
   - Complex component with multiple sub-components

### Component Directories

1. `/components/processSidemenu/`

   - Contains components for processing steps sidebar

2. `/components/video/`

   - Contains video-related components

3. `/components/overlays/`
   - Contains overlay components for video display

## API Implementation Status

### Video API Endpoints

| Backend Endpoint                        | Frontend Implementation | Status         | Used in Component        |
| --------------------------------------- | ----------------------- | -------------- | ------------------------ |
| GET /video/upload                       | `getUploadedFiles()`    | ✅ Implemented | `App.tsx`, `Sidebar.tsx` |
| POST /video/upload                      | `uploadVideo()`         | ✅ Implemented | `UploadPage.tsx`         |
| GET /video/upload/{video_uuid}          | Not implemented         | ❌ Missing     | -                        |
| DELETE /video/upload/{video_uuid}       | Not implemented         | ❌ Missing     | -                        |
| GET /video/stream/{video_uuid}          | Not implemented         | ❌ Missing     | -                        |
| GET /video/mainview/{video_uuid}        | `getMainviewData()`     | ✅ Implemented | `VideoDetailPage.tsx`    |
| POST /video/mainview/{video_uuid}       | `generateMainView()`    | ✅ Implemented | `VideoDetailPage.tsx`    |
| GET /video/mainview/{video_uuid}/status | `getProcessingStatus()` | ✅ Implemented | `VideoDetailPage.tsx`    |

### Segmentation API Endpoints

| Backend Endpoint                           | Frontend Implementation   | Status         | Used in Component     |
| ------------------------------------------ | ------------------------- | -------------- | --------------------- |
| GET /segmentation/models                   | Not implemented           | ❌ Missing     | -                     |
| POST /segmentation/sam2/{video_uuid}       | `runSegmentation()`       | ✅ Implemented | `VideoDetailPage.tsx` |
| GET /segmentation/sam2/{video_uuid}        | Not implemented           | ❌ Missing     | -                     |
| GET /segmentation/sam2/{video_uuid}/status | `getSegmentationStatus()` | ✅ Implemented | `VideoDetailPage.tsx` |

### Pose API Endpoints

| Backend Endpoint                            | Frontend Implementation | Status     | Used in Component |
| ------------------------------------------- | ----------------------- | ---------- | ----------------- |
| GET /pose/models                            | Not implemented         | ❌ Missing | -                 |
| POST /pose/yolo_pose_v11/{video_uuid}       | Not implemented         | ❌ Missing | -                 |
| GET /pose/yolo_pose_v11/{video_uuid}        | Not implemented         | ❌ Missing | -                 |
| GET /pose/yolo_pose_v11/{video_uuid}/status | Not implemented         | ❌ Missing | -                 |

## State Management

The application uses React's built-in state management with the following patterns:

1. **Global States** (in App.tsx):

   - API connection states
   - Pipeline progress tracking
   - Uploaded files list

2. **Component States**:
   - Each component manages its own local state for UI interactions
   - Props are used for parent-child communication
   - No global state management library (Redux, etc.) is currently used

## API Service Structure

The frontend API services are organized in the `/services/api` directory:

1. `video.ts`: Video upload and processing endpoints
2. `segmentation.ts`: Player segmentation endpoints
3. `pose.ts`: Pose detection endpoints
4. `analysis.ts`: Analysis-related endpoints
5. `export.ts`: Export functionality endpoints
6. `config.ts`: API configuration

Each service file contains:

- TypeScript interfaces for request/response types
- Axios-based API call functions
- Error handling
- Type safety
