# import time
from collections import Counter
from pathlib import Path

import cv2
import imagehash
from PIL import Image
from moviepy import concatenate_videoclips, VideoFileClip


input_folder_path = None
output_folder_path = None

def __init__(input_folder_path, output_folder_path):
    input_folder_path = Path() / input_folder_path
    input_folder_path.mkdir(exist_ok=True)
    output_folder_path = Path() / output_folder_path
    output_folder_path.mkdir(exist_ok=True)

# MARK: Helper
def extract_frames(video_path, every_n_frame=5, crop_ratio=0.33):
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        print(f"Cannot open video file: {video_path}")
        return []

    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"Opened video: FPS={fps}, total frames={frame_count}")

    frames = []
    frame_index = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("End of video or failed to read frame.")
            break

        if frame_index % every_n_frame == 0:
            height, width, _ = frame.shape
            cropped_frame = frame[: int(height * crop_ratio), :, :]
            frames.append(cropped_frame)

        frame_index += 1

    cap.release()
    print(f"Extracted {len(frames)} frames")
    return frames

def calculate_phash(frame):
    pil_image = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    return imagehash.phash(pil_image)

def calculate_phash_similarity(frame1, frame2):
    phash1 = calculate_phash(frame1)
    phash2 = calculate_phash(frame2)
    return phash1 - phash2

def is_similar_phash(frame1, frame2, max_distance=5):
    phash_similarity = calculate_phash_similarity(frame1, frame2)
    return phash_similarity <= max_distance

def find_typical_frame(frames):
    phashes = [calculate_phash(f) for f in frames]
    if not phashes:
        print("Failed to compute pHash values!")
        return None

    phash_counter = Counter(phashes)
    most_common_phash = phash_counter.most_common(1)
    if not most_common_phash:
        print("No common pHash found!")
        return None

    most_common_phash = most_common_phash[0][0]

    for i, phash in enumerate(phashes):
        if phash == most_common_phash:
            return frames[i]

    return None

# MARK: Video Processing
def find_main_view_timestamps_phash(
    self,
    video_path,
    typical_frame,
    max_distance=10,
    every_n_frame=5,
    crop_ratio=0.33,
):
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = 0

    timestamps = []
    onset = None
    onset_frame = None

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        if frame_count % every_n_frame == 0:
            height, width, _ = frame.shape
            cropped_frame = frame[: int(height * crop_ratio), :, :]

            if is_similar_phash(typical_frame, cropped_frame, max_distance):
                if onset is None:
                    onset = frame_count / fps
                    onset_frame = frame_count
            elif onset is not None:
                offset = max(0, (frame_count - every_n_frame) / fps)
                offset_frame = max(0, frame_count - every_n_frame)
                timestamps.append((onset, offset, onset_frame, offset_frame))
                onset = None
                onset_frame = None

        frame_count += 1

    if onset is not None:
        timestamps.append((onset, frame_count / fps, onset_frame, frame_count))

    cap.release()
    return timestamps

# MARK: Process
def generate_timestamp(input_file_path):
    print(f"Processing file: {input_file_path}")
    frames = extract_frames(input_file_path)

    if not frames:
        print("Failed to extract frames!")
        return None

    typical_frame = find_typical_frame(frames)
    if typical_frame is None:
        print("Failed to find typical frame!")
        return None
    else:
        timestamps = find_main_view_timestamps_phash(input_file_path, typical_frame)

    print(f"Main view timestamps: {timestamps}")

    # Save output
    file_name = Path(input_file_path).stem

    # Save output - timestamps to CSV file
    timestamps_file_path = Path(output_folder_path) / f"{file_name}_timestamps.csv"
    # https://github.com/Zulko/moviepy/blob/db19920764b5cb1d8aa6863019544fd8ae0d3cce/moviepy/video/io/ffmpeg_reader.py#L169
    with open(timestamps_file_path, "w") as f:
        f.write("Start,End,StartFrame,EndFrame\n")
        for start, end, start_frame, end_frame in timestamps:
            f.write(f"{start:.2f},{end:.2f},{start_frame},{end_frame}\n")
    print(f"Timestamps saved to: {timestamps_file_path}")

    return timestamps_file_path

