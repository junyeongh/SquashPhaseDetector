from collections import Counter
import os
import cv2
import imagehash
from PIL import Image


def generate_mainview_timestamp(video_file_path: str, video_file_dir: str):
    # extract frames
    every_n_frame = 5
    crop_ratio = 0.33

    cap = cv2.VideoCapture(video_file_path)
    if not cap.isOpened():
        print(f"Cannot open video file: {video_file_path}")
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

    if not frames:
        print("Failed to extract frames!")
        return None

    typical_frame = find_typical_frame(frames)
    if typical_frame is None:
        print("Failed to find typical frame!")
        return None
    else:
        timestamps = find_main_view_timestamps_phash(video_file_path, typical_frame)

    mainview_file_path = os.path.join(video_file_dir, "mainview_timestamp.csv")
    with open(mainview_file_path, "w") as f:
        f.write("StartFrame,EndFrame\n")
        for start, end, start_frame, end_frame in timestamps:
            f.write(f"{start:.2f},{end:.2f},{start_frame},{end_frame}\n")


# find_typical_frame
def calculate_phash(self, frame):
    pil_image = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    return imagehash.phash(pil_image)


def find_typical_frame(self, frames):
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


# find_main_view_timestamps_phash
def calculate_phash_similarity(self, frame1, frame2):
    phash1 = calculate_phash(frame1)
    phash2 = calculate_phash(frame2)
    return phash1 - phash2


def is_similar_phash(self, frame1, frame2, max_distance=5):
    phash_similarity = calculate_phash_similarity(frame1, frame2)
    return phash_similarity <= max_distance


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
