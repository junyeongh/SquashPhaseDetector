from collections import Counter
import os
import cv2
import imagehash
from PIL import Image
import random
import gc


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
    mainview_file_path = os.path.join(video_file_dir, "mainview_timestamp.csv")
    with open(mainview_file_path, "w") as f:
        f.write("Start,End,StartFrame,EndFrame\n")
        for onset, offset, onset_frame, offset_frame in timestamps:
            f.write(f"{onset:.2f},{offset:.2f},{onset_frame},{offset_frame}\n")
    print(f"Timestamps saved to: {mainview_file_path}")

    temp_dir = os.path.join(video_file_dir, "temp/")
    frame_dir = os.path.join(video_file_dir, "frames/")

    frame_names = sorted([f for f in os.listdir(temp_dir) if f.endswith((".jpg", ".jpeg", ".png"))])
    for _, _, start_frame, end_frame in timestamps:
        for frame in range(start_frame, end_frame + 1):
            original_path = os.path.join(temp_dir, frame_names[frame])
            new_path = os.path.join(frame_dir, frame_names[frame])
            os.rename(original_path, new_path)
            # Remove destination file if it exists
            try:
                if os.path.exists(new_path):
                    os.remove(new_path)
            except Exception as e:
                print(f"Error removing existing file: {e}")

            # Create a symlink instead of moving the file
            os.symlink(original_path, new_path)

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
