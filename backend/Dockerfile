FROM pytorch/pytorch:2.5.1-cuda12.1-cudnn9-runtime

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV APP_ROOT=/opt/app

# Install system requirements
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libavutil-dev \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    pkg-config \
    build-essential \
    libffi-dev

# Create app directory
WORKDIR ${APP_ROOT}

# Install uv.
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip setuptools
RUN pip install -r requirements.txt
# COPY pyproject.toml .
# COPY uv.lock .
# RUN uv sync --frozen --no-cache

# Fix ffmpeg path for compatibility
RUN [ -f /opt/conda/bin/ffmpeg ] && rm /opt/conda/bin/ffmpeg; ln -s /bin/ffmpeg /opt/conda/bin/ffmpeg

# Download checkpoints
RUN mkdir -p ${APP_ROOT}/checkpoints

# SAM2 model checkpoint (consider using your own path if you have it locally)
ADD https://dl.fbaipublicfiles.com/segment_anything_2/092824/sam2.1_hiera_base_plus.pt ${APP_ROOT}/checkpoints/sam2.1_hiera_base_plus.pt
ADD https://dl.fbaipublicfiles.com/segment_anything_2/092824/sam2.1_hiera_large.pt ${APP_ROOT}/checkpoints/sam2.1_hiera_large.pt

# YOLO-Pose model checkpoint - You'll need to modify this with the actual URL
# Placeholder - replace with actual model URL
ADD https://github.com/ultralytics/assets/releases/download/v8.3.0/yolo11m-pose.pt ${APP_ROOT}/checkpoints
ADD https://github.com/ultralytics/assets/releases/download/v8.3.0/yolo11l-pose.pt ${APP_ROOT}/checkpoints

# Copy application code
COPY . .

# Expose the port for the FastAPI application
EXPOSE 8000

# Command to run the FastAPI application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
