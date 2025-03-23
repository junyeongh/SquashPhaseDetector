FROM pytorch/pytorch:2.5.1-cuda12.1-cudnn9-runtime

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV APP_ROOT=/app

# Install system requirements
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libavutil-dev \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    pkg-config \
    build-essential \
    libffi-dev \
    git \
    wget

# Create app directory
WORKDIR ${APP_ROOT}

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip setuptools
RUN pip install -r requirements.txt

# Fix ffmpeg path for compatibility
RUN rm /opt/conda/bin/ffmpeg && ln -s /bin/ffmpeg /opt/conda/bin/ffmpeg

# Download checkpoints
RUN mkdir -p ${APP_ROOT}/checkpoints

# SAM2 model checkpoint (consider using your own path if you have it locally)
RUN wget -P ${APP_ROOT}/checkpoints https://dl.fbaipublicfiles.com/segment_anything_2/092824/sam2.1_hiera_base_plus.pt

# YOLO-Pose model checkpoint - You'll need to modify this with the actual URL
# Placeholder - replace with actual model URL
RUN wget -P ${APP_ROOT}/checkpoints https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8x-pose.pt

# Copy application code
COPY . .

# Expose the port for the FastAPI application
EXPOSE 8000

# Command to run the FastAPI application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
