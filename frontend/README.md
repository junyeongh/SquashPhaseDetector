# Frontend Architecture Documentation

## Component Hierarchy

The frontend application follows a hierarchical structure with the following main components:

### Root Level (App.tsx)

Entry point of the application

### Layout Components

1. `Sidebar` (`/layout/Sidebar.tsx`)
   - Displays list of uploaded videos
2. `MainContent` (`/layout/MainContent.tsx`)
   - Main content area wrapper
   - Children: Route components

### Page Components

1. `UploadPage` (`/pages/UploadPage.tsx`)
   - Handles video upload functionality
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

## API Service Structure

The frontend API services are organized in the `/services/api` directory:

1. `video.ts`: Video upload and processing endpoints
2. `segmentation.ts`: Player segmentation endpoints
3. `pose.ts`: Pose detection endpoints
4. `analysis.ts`: Analysis-related endpoints
5. `export.ts`: Export functionality endpoints
6. `config.ts`: API configuration
