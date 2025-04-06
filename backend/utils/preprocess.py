from collections import Counter
import os
import cv2
import imagehash
from PIL import Image
import random
import gc
import json


def generate_mainview_timestamp(video_file_path: str, video_file_dir: str):
    # extract frames
    every_n_frame = 5
    crop_ratio = 0.33
    max_distance = 10
    sample_ratio = 0.1  # 10% of frames for sampling

    cap = cv2.VideoCapture(video_file_path)
    if not cap.isOpened():
        print(f"Cannot open video file: {video_file_path}")
        return None
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"Opened video: FPS={fps}, total frames={total_frames}")

    # Calculate total frames we'll actually process (every nth frame)
    processed_frames = total_frames // every_n_frame
    sample_size = int(processed_frames * sample_ratio)

    # Use generator instead of list for sample frames to reduce memory
    sample_frames = (i * every_n_frame for i in sorted(random.sample(range(processed_frames), sample_size)))

    frame_count = 0
    phash_counter = Counter()

    # Process frames one at a time without storing them
    for target_frame in sample_frames:
        # Skip frames until we reach the target
        while frame_count < target_frame:
            cap.grab()  # Only grab frame without decoding
            frame_count += 1

        ret, frame = cap.read()
        if ret:
            # Process only the cropped portion directly
            height = int(frame.shape[0] * crop_ratio)
            cropped_frame = frame[:height, :, :]
            current_phash = calculate_phash(cropped_frame)
            phash_counter[current_phash] += 1
            # Explicitly delete to help garbage collection
            del frame
            del cropped_frame

        frame_count += 1

    # Find the most common phash
    if phash_counter:
        typical_phash = phash_counter.most_common(1)[0][0]
        print(f"Found typical pattern with {phash_counter[typical_phash]} occurrences")
    else:
        print("Failed to find typical pattern!")
        return None

    # Reset video capture to start
    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
    frame_count = 0

    # Variables for timestamp detection
    timestamps = []
    onset = None
    onset_frame = None

    # Second phase: Process frames with minimal memory usage
    while cap.isOpened():
        if frame_count % every_n_frame == 0:
            ret, frame = cap.read()
            if not ret:
                break

            height = int(frame.shape[0] * crop_ratio)
            cropped_frame = frame[:height, :, :]
            current_phash = calculate_phash(cropped_frame)

            is_main_view = (current_phash - typical_phash) <= max_distance

            # Process timestamp logic
            if is_main_view and onset is None:
                onset = frame_count / fps
                onset_frame = frame_count
            elif not is_main_view and onset is not None:
                offset = max(0, (frame_count - every_n_frame) / fps)
                offset_frame = max(0, frame_count - every_n_frame)
                timestamps.append((onset, offset, onset_frame, offset_frame))
                onset = None
                onset_frame = None

            # Explicitly delete to help garbage collection
            del frame
            del cropped_frame
        else:
            # Skip frames we don't need to process
            cap.grab()

        frame_count += 1

    # Handle the case where video ends during a main view
    if onset is not None:
        timestamps.append((onset, frame_count / fps, onset_frame, frame_count))

    cap.release()
    gc.collect()  # Force garbage collection after processing

    if not timestamps:
        print("No main view timestamps found!")
        return None

    print(f"Main view timestamps: {timestamps}")
    mainview_file_path = os.path.join(video_file_dir, "mainview_timestamp.json")

    # Create chunks
    chunk_size = 2500
    json_chunks = []
    current_chunk = []
    current_chunk_size = 0

    for timestamp in timestamps:
        start_frame = timestamp[2]  # Get the start_frame from the timestamp
        end_frame = timestamp[3]  # Get the end_frame from the timestamp
        segment_size = end_frame - start_frame + 1

        # If this segment fits in the current chunk
        if current_chunk_size + segment_size <= chunk_size:
            current_chunk.append((start_frame, end_frame))
            current_chunk_size += segment_size

        # If this segment doesn't fit entirely, we need to split it
        else:
            # Calculate how many frames can fit in the current chunk
            frames_to_add = chunk_size - current_chunk_size

            if frames_to_add > 0:
                # Add the first part of the segment to the current chunk
                split_end_frame = start_frame + frames_to_add - 1
                current_chunk.append((start_frame, split_end_frame))
                json_chunks.append(current_chunk)

                # Start a new chunk with the remaining part of the segment
                remaining_start = split_end_frame + 1

                # Process the remaining part, potentially across multiple chunks
                remaining_end = end_frame
                while remaining_start <= remaining_end:
                    new_chunk = []
                    new_chunk_end = min(remaining_start + chunk_size - 1, remaining_end)
                    new_chunk.append((remaining_start, new_chunk_end))

                    if new_chunk_end == remaining_end:
                        # If we've reached the end of the segment, we're done with this split
                        current_chunk = new_chunk
                        current_chunk_size = new_chunk_end - remaining_start + 1
                        break
                    else:
                        # If there's still more to process, add this chunk and continue
                        json_chunks.append(new_chunk)
                        remaining_start = new_chunk_end + 1
            else:
                # If the current chunk is already full, start a new one
                json_chunks.append(current_chunk)

                # Process this segment with a fresh chunk
                current_chunk = []
                current_chunk_size = 0

                # We need to recursively handle this segment as it might span multiple chunks
                remaining_start = start_frame
                remaining_end = end_frame

                while remaining_start <= remaining_end:
                    if remaining_end - remaining_start + 1 <= chunk_size:
                        # If the remainder fits in one chunk
                        current_chunk.append((remaining_start, remaining_end))
                        current_chunk_size = remaining_end - remaining_start + 1
                        break
                    else:
                        # If we need multiple chunks
                        new_chunk = [(remaining_start, remaining_start + chunk_size - 1)]
                        json_chunks.append(new_chunk)
                        remaining_start += chunk_size

    # Don't forget to add the last chunk if it's not empty
    if current_chunk:
        json_chunks.append(current_chunk)

    json_timestamps = []
    for onset, offset, onset_frame, offset_frame in timestamps:
        json_timestamps.append([onset, offset, onset_frame, offset_frame])

    # Create the final JSON structure
    result = {"fps": fps, "total_frames": total_frames, "timestamps": json_timestamps, "chunks": json_chunks}
    with open(mainview_file_path, "w") as f:
        json.dump(result, f, indent=2)

    return mainview_file_path


# calculate phash
def calculate_phash(frame):
    # Convert directly to RGB to avoid extra copy
    frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    pil_image = Image.fromarray(frame)
    phash = imagehash.phash(pil_image)
    # Clean up
    del pil_image
    return phash


# # find_typical_frame
# def find_typical_frame(frames):
#     phashes = [calculate_phash(f) for f in frames]
#     if not phashes:
#         print("Failed to compute pHash values!")
#         return None

#     phash_counter = Counter(phashes)
#     most_common_phash = phash_counter.most_common(1)
#     if not most_common_phash:
#         print("No common pHash found!")
#         return None

#     most_common_phash = most_common_phash[0][0]

#     for i, phash in enumerate(phashes):
#         if phash == most_common_phash:
#             return frames[i]

#     return None


# # find_main_view_timestamps_phash
# def calculate_phash_similarity(frame1, frame2):
#     phash1 = calculate_phash(frame1)
#     phash2 = calculate_phash(frame2)
#     return phash1 - phash2


# def is_similar_phash(frame1, frame2, max_distance=5):
#     phash_similarity = calculate_phash_similarity(frame1, frame2)
#     return phash_similarity <= max_distance


# def find_main_view_timestamps_phash(
#     video_path,
#     typical_frame,
#     max_distance=10,
#     every_n_frame=5,
#     crop_ratio=0.33,
# ):
#     cap = cv2.VideoCapture(video_path)
#     fps = cap.get(cv2.CAP_PROP_FPS)
#     frame_count = 0

#     timestamps = []
#     onset = None
#     onset_frame = None

#     while cap.isOpened():
#         ret, frame = cap.read()
#         if not ret:
#             break

#         if frame_count % every_n_frame == 0:
#             height, width, _ = frame.shape
#             cropped_frame = frame[: int(height * crop_ratio), :, :]

#             if is_similar_phash(typical_frame, cropped_frame, max_distance):
#                 if onset is None:
#                     onset = frame_count / fps
#                     onset_frame = frame_count
#             elif onset is not None:
#                 offset = max(0, (frame_count - every_n_frame) / fps)
#                 offset_frame = max(0, frame_count - every_n_frame)
#                 timestamps.append((onset, offset, onset_frame, offset_frame))
#                 onset = None
#                 onset_frame = None

#         frame_count += 1

#     if onset is not None:
#         timestamps.append((onset, frame_count / fps, onset_frame, frame_count))

#     cap.release()
#     return timestamps
