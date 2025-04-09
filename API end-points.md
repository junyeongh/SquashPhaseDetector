# API end-points

API documentation is available at <http://localhost:8000/docs>

## Root

```
/
        GET : returns { "message": "Squash Game Phase Detection API" }
/health
        GET : returns { "status" : "healthy" }
```

## Video

```
/video
        [x] GET /upload
            : returns list of all video files in the upload folder
        [x] POST /upload
            : upload a video file for processing
        [x] GET /upload/{video_uuid}
            : get the metadata of a specific uploaded video by UUID
        [x] DELETE /upload/{video_uuid}
            : (not used) delete a video folder by UUID
        [x] GET /stream/{video_uuid}
            : stream a video file by UUID with supoprt for range requests
        [x] GET /mainview/{video_uuid}
            : get mainview timestamps for the video by UUID
        [x] POST /mainview/{video_uuid}
            : generate mainview timestamps for the video
        [x] GET /mainview/{video_uuid}/status
            : get the processing status of mainview detection for a video
```

## Segmentation

```
/segmentation
        GET /models
            : returns list of all models available
        POST /sam2/{video_uuid}
            : run segmentation on the video by UUID
            body {
                marker_input: list of dicts with keys:
                    frame_idx: int
                    player_id: int
                    points: list of lists of ints
                        e.g., [[[x1, y1], [x2, y2], [x3, y3]]]
                    labels: list of ints
                        e.g., [[1, 1, 0]] # 1 for positive, 0 for negative
            }
        GET /sam2/{video_uuid}
            : get the processing result for the video by UUID
        GET /sam2/{video_uuid}/status
            : get the processing status for the video by UUID
```

## Pose

```
/pose
        GET /models
            : returns list of all models available
        POST /yolo_pose_v11/{video_uuid}
            : run pose detection on the video by UUID
        GET /yolo_pose_v11/{video_uuid}
            : get the processing result for the video by UUID
        GET /yolo_pose_v11/{video_uuid}/status
            : get the processing status for the video by UUID
```
