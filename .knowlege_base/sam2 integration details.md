# SAM2 Interactive Segmentation Integration Plan for SquashPhaseDetector

## Document Purpose

This document outlines the analysis of the `sam2/demo` project and details the plan for integrating SAM2's interactive segmentation capabilities into the `SquashPhaseDetector` project. It covers the backend and frontend changes required to allow users to mark players on video frames using point prompts, generating segmentation masks via SAM2.

## 1. SAM2 Demo Project Analysis (`Miscellaneous/sam2/demo`)

This analysis is based on the provided directory structure and common practices for interactive segmentation demos.

### 1.1 Inferred Directory Structure

```
demo/
├── frontend/      # React-based frontend code
├── backend/       # Python backend (likely Flask/FastAPI) for model inference
└── data/          # Potential storage for sample images, uploads, or outputs
```

### 1.2 Identified Features (Likely)

* Image/video segmentation using SAM2.
* Frontend UI for media upload/selection and interaction.
* Backend processing for SAM2 model inference.
* API communication between frontend and backend.
* Visual display of segmentation masks overlaid on media.
* Support for interactive prompts (Points, Boxes).
* Potential video frame navigation and per-frame segmentation.

### 1.3 Detailed Workflow (Inferred)

1. **Frontend Interaction:**
    * User loads the web UI.
    * User uploads/selects an image or video.
    * The selected media (or first frame) is displayed in an interactive viewer.
    * User selects prompt type (Point/Box) and potentially labels (if applicable).
    * User places prompts (clicks or drags) on the displayed media.
    * User triggers segmentation (e.g., clicks "Segment").
    * Frontend shows a loading state.
    * Received segmentation masks are overlaid on the media in the viewer.
    * User can potentially refine prompts and re-segment.
2. **Backend Processing:**
    * Receives API request containing media data (or reference) and user prompts.
    * Loads the SAM2 model (if not already loaded).
    * Preprocesses the image/frame and prompts.
    * Performs SAM2 inference using the processed inputs.
    * Postprocesses the model output into a mask format (likely RLE).
    * Sends the mask data back to the frontend in the API response.
3. **Communication:**
    * Frontend sends HTTP POST requests (e.g., using `axios`/`fetch`) to the backend API endpoint for segmentation.
    * Data (prompts, masks) is exchanged primarily via JSON.
4. **Data Handling (`data/`):**
    * May temporarily store uploaded files.
    * May cache segmentation results or store sample data.

## 2. SquashPhaseDetector Project Overview

### 2.1 High-Level Goal

Analyze squash match videos to automatically detect game phases (rally vs. rest) by combining player segmentation (SAM2), pose estimation (YOLO-Pose), and game state analysis.

### 2.2 Key Technologies

* **Backend:** FastAPI (Python)
* **Frontend:** React (TypeScript)
* **Styling:** TailwindCSS
* **Containerization:** Docker, Docker Compose
* **ML Models:** SAM2, YOLO-Pose

### 2.3 Existing Processing Pipeline (from `README.md`)

1. Upload video.
2. Find frames with main views (`mainview_timestamp.csv`).
3. Mark players in specific frames.
4. Generate player masks using SAM2.
5. Apply YOLO-Pose for landmarks.
6. Analyze pose data for game states.
7. Export results.

### 2.4 Directory Structure

```
SquashPhaseDetector/
├── backend/
│   ├── routers/         # API endpoints (video.py, segmentation.py, etc.)
│   ├── models/          # ML model integration (sam2_model.py, etc.)
│   ├── utils/           # Utility functions (video.py, etc.)
│   └── app.py           # Main FastAPI application
├── frontend/
│   ├── src/
│   │   ├── components/    # React components (video/, segmentation/, etc.)
│   │   ├── services/      # API service functions (api/video.ts, api/segmentation.ts)
│   │   ├── pages/         # Top-level page components (VideoDetailPage.tsx)
│   │   ├── utils/         # Frontend utility functions (rleUtils.ts)
│   │   └── ...
│   └── Dockerfile
├── data/
│   ├── uploads/         # Directory for uploaded videos and extracted frames
│   │   └── [uuid]/
│   │       ├── frames/    # Extracted .jpg frames
│   │       ├── metadata.json
│   │       └── mainview_timestamp.csv
│   └── exports/
├── docker-compose.yml
├── README.md
└── ...
```

## 3. SAM2 Integration Plan for SquashPhaseDetector

### 3.1 Goal

Replace/Implement steps 3 & 4 of the existing pipeline ("Mark players" & "Generate player masks") using SAM2's interactive segmentation. Users will click on players in specific frames within the frontend UI, and the backend will use these clicks as prompts for SAM2 to generate segmentation masks.

### 3.2 Phase 1: Backend Implementation (FastAPI) - *Partially Implemented*

* **Dependencies & Setup:**
  * Ensure SAM2 library (`sam2`) is installable in the backend environment.
  * Make SAM2 model checkpoint (`.pt`) accessible to the backend container.
* **Model Loading (`backend/models/sam2_model.py`):**
  * Implement actual model loading in `SAM2Predictor.__init__` (Currently placeholder).
  * Create the `SAM2ImagePredictor` instance.
* **Interactive Prediction Method (`backend/models/sam2_model.py`):**
  * Implement `predict_interactive(frame_path, prompts)`:
    * Loads frame using OpenCV.
    * Prepares point prompts and labels based on input `prompts` list.
    * Calls `self.predictor.predict(...)` with image and prompts (Currently placeholder).
    * Encodes the resulting mask (likely numpy array) into RLE format (Needs implementation).
    * Returns `{"player1": RLEMask, "player2": RLEMask}`.
* **API Endpoint (`backend/routers/segmentation.py`):** - *Implemented*
  * `POST /segmentation/interactive/{video_uuid}/{frame_index}`
  * **Request Body:** `InteractiveSegmentationRequest` (contains `prompts: InteractivePrompt[]`).
  * **Response Body:** `InteractiveSegmentationResponse` (contains `masks: {"player1": RLEMask, "player2": RLEMask}`).
  * Uses `Depends(get_sam2_predictor)`.
  * Validates UUID, gets frame path using `get_frame_path`.
  * Optionally checks if `frame_index` is in `mainview_timestamp.csv`.
  * Calls `sam_predictor.predict_interactive`.
  * Returns the result.
* **Helper Functions (`backend/utils/video.py`):** - *Implemented*
  * `get_frame_path(video_uuid, frame_index)`: Constructs path like `/data/uploads/{uuid}/frames/{index:06d}.jpg`.
  * `read_mainview_timestamps(video_uuid)`: Reads and parses `/data/uploads/{uuid}/mainview_timestamp.csv`.
* **Video Info Endpoint (Needed):**
  * An endpoint like `GET /video/info/{video_uuid}` is needed to provide the frontend with the video's original `width` and `height` for coordinate scaling. This likely needs to be added to `backend/routers/video.py` using `cv2.VideoCapture` similar to `utils.video.get_video_info`.

### 3.3 Phase 2: Frontend Implementation (React) - *In Progress*

* **API Service (`frontend/src/services/api/segmentation.ts`):** - *Implemented (Placeholder Function)*
  * Interfaces defined: `InteractivePrompt`, `RLEMask`, `InteractiveSegmentationRequest`, `InteractiveSegmentationResponse`.
  * Function added: `segmentFrameInteractive(videoUuid, frameIndex, prompts)` (currently returns dummy data).
* **RLE Utility (`frontend/src/utils/rleUtils.ts`):** - *Implemented (Placeholder Function)*
  * Function added: `decodeRLE(mask)` (currently returns checkerboard or empty array). Needs actual RLE decoding logic.
* **Overlay Component (`frontend/src/components/InteractiveCanvas.tsx` -> `SegmentationOverlayCanvas`):** - *Implemented (Refactored)*
  * Receives props: `prompts`, `masks`, dimensions, callbacks, selected player/type.
  * Calculates scaling between original and display dimensions.
  * Handles canvas clicks, scales coordinates *back* to original frame size, calls `onPromptAdd` callback.
  * Draws prompts (scaling *to* display size).
  * Draws masks (using `decodeRLE`, scaling *to* display size). Renders only when `displayDimensions` are available.
* **Video Player Integration (`frontend/src/components/video/VideoPlayerSection.tsx`):** - *Implemented (Subject to Path Fixes)*
  * Added props for segmentation state.
  * Uses `useRef` and `ResizeObserver` to track the video player container's `displayDimensions`.
  * Conditionally renders `<SegmentationOverlayCanvas />` when `stage === 'segmentation'`.
  * Passes necessary state (`prompts`, `currentMasks`, `displayDimensions`, etc.) and callbacks (`onPromptAdd`) to the overlay.
* **Main Page State (`frontend/src/pages/VideoDetailPage.tsx`):** - *Next Step*
  * Add state variables: `prompts`, `currentMasks`, `selectedPlayer`, `selectedPromptType`, `segmentationIsLoading`, `segmentationError`, `originalFrameWidth`, `originalFrameHeight`.
  * Add `useEffect` to fetch video width/height via `/video/info/{uuid}`.
  * Add event handlers: `handleAddPrompt`, `handleGenerateMasks`, `handleClearSegmentation`, `handlePlayerChange`, `handlePromptTypeChange`.
  * Add `useEffect` to clear prompts/masks when `currentFrameIndex` changes.
  * Pass state and handlers down to `VideoPlayerSection` and `ProcessSidemenu`.
* **Side Menu Controls (`frontend/src/components/ProcessSidemenu.tsx`):** - *Next Step*
  * Add props for segmentation state and handlers.
  * Conditionally render controls (Player toggle, Prompt Type toggle, Generate button, Clear button) when `activeStage === 'segmentation'`.
  * Display loading state and errors.

## 4. Code Structure Summary

* **Backend:**
  * `backend/routers/segmentation.py`: New endpoint `/interactive/{uuid}/{frame}` added.
  * `backend/models/sam2_model.py`: New method `predict_interactive` added (placeholder logic).
  * `backend/utils/video.py`: New helper functions `get_frame_path`, `read_mainview_timestamps` added.
* **Frontend:**
  * `frontend/src/services/api/segmentation.ts`: New interfaces and API function added (placeholder).
  * `frontend/src/utils/rleUtils.ts`: New file with `decodeRLE` function (placeholder).
  * `frontend/src/components/InteractiveCanvas.tsx`: Refactored into `SegmentationOverlayCanvas` for drawing overlays and handling clicks.
  * `frontend/src/components/video/VideoPlayerSection.tsx`: Modified to track dimensions and conditionally render the overlay canvas.
  * `frontend/src/pages/VideoDetailPage.tsx`: (Next Step) To manage overall state.
  * `frontend/src/components/ProcessSidemenu.tsx`: (Next Step) To house UI controls.

## 5. Next Steps & Considerations

1. **Frontend:**
    * Implement state management and prop drilling in `VideoDetailPage.tsx`.
    * Integrate UI controls into `ProcessSidemenu.tsx`.
    * **Fix import path/linter errors** in frontend components (likely requires adjusting paths in `.tsx` files or checking `tsconfig.json` path aliases).
    * Implement actual RLE decoding logic in `frontend/src/utils/rleUtils.ts`.
2. **Backend:**
    * Implement the `GET /video/info/{video_uuid}` endpoint to provide original video dimensions.
    * Implement actual SAM2 model loading in `SAM2Predictor.__init__`.
    * Implement actual SAM2 prediction logic within `predict_interactive`.
    * Implement RLE encoding for the masks generated by SAM2 before returning them from the API.
3. **General:**
    * Ensure necessary dependencies (`axios`, `react`, SAM2 library, OpenCV-Python, etc.) are correctly installed in both frontend and backend environments.
    * Thoroughly test the UI interaction, coordinate scaling, and API communication.
    * Refine the visual appearance of prompts and masks.

---

**1. Goal Recap:**

The objective is to allow users to click points on a video frame in the frontend. These points (prompts) will be sent to the backend, which uses SAM2 to generate segmentation masks for the players based on these prompts. The masks are then sent back to the frontend for display.

**2. Current Codebase Status vs. Integration Plan:**

* **Backend (`sam2 integration details.md` Section 3.2 & 4 vs. Code Snippets):**
  * **Discrepancy:** The integration plan details an **interactive** workflow with a specific API endpoint (`POST /segmentation/interactive/{uuid}/{frame}`) and a corresponding model method (`predict_interactive` taking a list of prompts). However, the provided `backend/routers/segmentation.py` code shows a **different, non-interactive** approach using `/mark-players` and `/run-segmentation` endpoints, which store points in a session and run a background task (currently using dummy masks).
  * **Model (`sam2_model.py`):** The `predict` method shown in the snippet aligns more with the non-interactive session-based approach (taking separate `player1_points`, `player2_points`) rather than the planned `predict_interactive` method. Actual SAM2 model loading, prediction logic, and RLE encoding are placeholders or missing. The comment about RLE encoding (`mask_rle = encode_mask_to_rle(...)`) is commented out.
  * **Missing from Plan:** The planned interactive endpoint (`/segmentation/interactive/...`) and the `predict_interactive` method (as described in the plan) are not present in the provided code snippets. The `GET /video/info/{uuid}` endpoint for fetching video dimensions is also noted as needed but not yet implemented.
  * **Implemented Helpers:** The helper functions `get_frame_path` and `read_mainview_timestamps` in `backend/utils/video.py` seem to be implemented as per the plan.

* **Frontend (`sam2 integration details.md` Section 3.3 & 4):**
  * **Components:** The `SegmentationOverlayCanvas` (refactored from `InteractiveCanvas`) and `VideoPlayerSection` modifications seem to be implemented, handling display dimensions, clicks, and conditional rendering. Path fixes might be needed.
  * **API/Utils:** Placeholder functions for the API call (`segmentFrameInteractive`) and RLE decoding (`decodeRLE`) exist.
  * **State Management & UI:** The main state management (`VideoDetailPage.tsx`) and UI controls (`ProcessSidemenu.tsx`) are identified as the next steps in the plan and are not yet implemented.
  * **RLE Decoding:** Actual logic for decoding RLE masks is needed in `frontend/src/utils/rleUtils.ts`.

**3. Proposed Integration Plan (Following `sam2 integration details.md`):**

Based on the analysis, here is the proposed step-by-step plan focusing on implementing the **interactive** approach described in the document:

**Phase 1: Backend Implementation (FastAPI)**

1. **Confirm Approach:** Verify that we should proceed with the **interactive** segmentation plan (`/segmentation/interactive/...`, `predict_interactive`) as detailed in the `.md` file, potentially replacing the existing `/mark-players` and `/run-segmentation` logic.
2. **Video Info Endpoint:**
    * Implement the `GET /video/info/{video_uuid}` endpoint in `backend/routers/video.py`.
    * This endpoint should return the original `width` and `height` of the video.
3. **SAM2 Model (`backend/models/sam2_model.py`):**
    * Implement actual SAM2 model loading from a checkpoint file within the `SAM2Predictor.__init__` method.
    * Implement the `predict_interactive(self, frame_path: str, prompts: List[InteractivePrompt])` method:
        * Load the image frame using OpenCV (`cv2.imread(frame_path)`).
        * Convert the input `prompts` (list of `{x: number, y: number, label: number}` objects, where label likely indicates player 1 or 2, or positive/negative prompt) into the format expected by the SAM2 `predictor.predict()` call (e.g., `point_coords`, `point_labels`).
        * Call the loaded SAM2 predictor's `predict` method with the image and prepared prompts.
        * Process the output masks. The goal is typically one mask per player based on their respective prompts. This might involve multiple predict calls or handling multiple masks from one call.
        * Implement RLE encoding: Convert the final NumPy mask arrays for each player into Run-Length Encoding (RLE) format.
        * Return a dictionary like `{"player1": rle_mask_player1, "player2": rle_mask_player2}`.
4. **Interactive API Endpoint (`backend/routers/segmentation.py`):**
    * Implement the `POST /segmentation/interactive/{video_uuid}/{frame_index}` endpoint.
    * Define `InteractivePrompt`, `InteractiveSegmentationRequest` (body containing `prompts`), and `InteractiveSegmentationResponse` (containing `masks: Dict[str, RLEMask]`) Pydantic models.
    * Use dependency injection to get the `SAM2Predictor`.
    * Get the correct frame path using `get_frame_path`.
    * Call `sam_predictor.predict_interactive(frame_path, request.prompts)`.
    * Return the `InteractiveSegmentationResponse` containing the RLE masks.
5. **Refactor/Remove Old Endpoints:** If the interactive approach is confirmed, remove or refactor the `/mark-players` and `/run-segmentation` endpoints and related session logic in `backend/routers/segmentation.py`.

**Phase 2: Frontend Implementation (React)**

1. **Video Dimensions:**
    * In `VideoDetailPage.tsx`, add state for `originalFrameWidth` and `originalFrameHeight`.
    * Add a `useEffect` hook that calls a new API service function (e.g., `getVideoInfo(videoUuid)`) to fetch dimensions from the `GET /video/info/{uuid}` backend endpoint when the component mounts or `videoUuid` changes. Store these in the state.
2. **State Management (`VideoDetailPage.tsx`):**
    * Implement state variables: `prompts: InteractivePrompt[]`, `currentMasks: { player1: RLEMask | null, player2: RLEMask | null }`, `selectedPlayer: 'player1' | 'player2'`, `segmentationIsLoading: boolean`, `segmentationError: string | null`.
    * Implement event handlers:
        * `handleAddPrompt(point: { x: number, y: number })`: Adds a new prompt to the `prompts` state for the `selectedPlayer` with coordinates scaled *from* display size *to* original frame size.
        * `handleGenerateMasks()`: Sets `segmentationIsLoading` to true, clears errors. Calls the `segmentFrameInteractive` API service function, passing the UUID, current frame index, and the current `prompts` state. Updates `currentMasks` with the response, or sets `segmentationError` on failure. Sets `segmentationIsLoading` to false.
        * `handleClearSegmentation()`: Resets `prompts` and `currentMasks` state.
        * `handlePlayerChange(player: 'player1' | 'player2')`: Updates `selectedPlayer` state.
        * (Optional: `handlePromptTypeChange` if implementing different prompt types like boxes later).
    * Add a `useEffect` hook to call `handleClearSegmentation` whenever `currentFrameIndex` changes.
    * Pass the necessary state and handlers down as props to `VideoPlayerSection` and `ProcessSidemenu`.
3. **API Service (`frontend/src/services/api/segmentation.ts`):**
    * Implement the actual `fetch` or `axios` call inside `segmentFrameInteractive` to hit the `POST /segmentation/interactive/{uuid}/{frame}` endpoint, sending the prompts in the request body.
    * Add a new function `getVideoInfo(videoUuid)` to call the `GET /video/info/{uuid}` endpoint.
4. **RLE Utility (`frontend/src/utils/rleUtils.ts`):**
    * Implement the actual RLE decoding logic within the `decodeRLE(mask: RLEMask)` function. This function should take the RLE representation and return a data structure (e.g., a 2D array or an ImageData object) that can be drawn onto the canvas.
5. **UI Controls (`frontend/src/components/ProcessSidemenu.tsx`):**
    * Receive segmentation-related state (`selectedPlayer`, `segmentationIsLoading`, `segmentationError`) and handlers (`handleGenerateMasks`, `handleClearSegmentation`, `handlePlayerChange`) as props.
    * Conditionally render UI controls when the `activeStage` prop is 'segmentation':
        * Buttons/Toggles to select 'Player 1' or 'Player 2'.
        * A "Generate Masks" button (disabled when loading) that calls `handleGenerateMasks`.
        * A "Clear Prompts & Masks" button that calls `handleClearSegmentation`.
        * Display loading indicators or error messages based on state.
6. **Overlay Canvas (`SegmentationOverlayCanvas.tsx`):**
    * Ensure it correctly uses `originalFrameWidth`, `originalFrameHeight`, and `displayDimensions` for scaling coordinates when handling clicks (`onPromptAdd`) and drawing prompts/masks.
    * Ensure it calls `decodeRLE` before drawing masks.
7. **Fix Imports:** Address any potential path alias or import errors identified in the plan.

**Phase 3: General**

1. **Dependencies:** Ensure `sam2`, `opencv-python`, and any other required libraries are added to the backend environment (`requirements.txt` or `pyproject.toml`). Ensure frontend dependencies like `axios` (if used) are installed.
2. **Testing:** Thoroughly test the entire flow: clicking points, coordinate scaling, API communication, mask generation, RLE encoding/decoding, and display.
