#!/usr/bin/env python3
"""
Exploratory Data Analysis script for Squash Game Phase Detection data
"""

import os
import json
import csv
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path

# Configure plot styles
plt.style.use('ggplot')
sns.set_theme(style="whitegrid")

class SquashEDA:
    def __init__(self, data_dir="/data/uploads"):
        """Initialize with path to data directory"""
        self.data_dir = Path(data_dir)
        self.exports_dir = self.data_dir / "exports"
        self.sessions = []

        # Scan for available sessions (video UUIDs)
        self.scan_sessions()

    def scan_sessions(self):
        """Scan the uploads folder for available video sessions"""
        if not self.data_dir.exists():
            print(f"Uploads directory not found: {self.data_dir}")
            return

        # Find all UUID directories in the uploads folder
        self.sessions = [d for d in os.listdir(self.data_dir) if os.path.isdir(os.path.join(self.data_dir, d))]

        print(f"Found {len(self.sessions)} video sessions")
        for i, session in enumerate(self.sessions):
            print(f"{i+1}. {session}")

    def load_metadata(self, session_id):
        """Load video metadata for a given session"""
        metadata_path = self.data_dir / session_id / "metadata.json"

        if not metadata_path.exists():
            print(f"Metadata not found for session: {session_id}")
            return None

        with open(metadata_path, 'r') as f:
            metadata = json.load(f)

        return metadata

    def load_mainview_timestamps(self, session_id):
        """Load mainview timestamps for a given session"""
        mainview_path = self.data_dir / session_id / "mainview_timestamp.csv"

        if not mainview_path.exists():
            print(f"Mainview timestamps not found for session: {session_id}")
            return None

        # Read the CSV file
        try:
            df = pd.read_csv(mainview_path)
            return df
        except Exception as e:
            print(f"Error loading mainview timestamps: {e}")
            return None

    def load_segmentation_data(self, session_id):
        """Load segmentation data for a given session"""
        segmentation_path = self.data_dir / session_id / "segmentation.json"

        if not segmentation_path.exists():
            print(f"Segmentation data not found for session: {session_id}")
            return None

        with open(segmentation_path, 'r') as f:
            segmentation_data = json.load(f)

        return segmentation_data

    def load_pose_data(self, session_id):
        """Load pose data for a given session"""
        pose_path = self.data_dir / session_id / "pose.json"

        if not pose_path.exists():
            print(f"Pose data not found for session: {session_id}")
            return None

        with open(pose_path, 'r') as f:
            pose_data = json.load(f)

        return pose_data

    def analyze_session(self, session_id=None):
        """Perform comprehensive analysis on a session"""
        if session_id is None:
            if not self.sessions:
                print("No sessions available")
                return
            session_id = self.sessions[0]  # Use the first session by default
            print(f"Using default session: {session_id}")

        if session_id not in self.sessions:
            print(f"Session {session_id} not found")
            return

        # Load all data
        metadata = self.load_metadata(session_id)
        mainview_df = self.load_mainview_timestamps(session_id)
        segmentation_data = self.load_segmentation_data(session_id)
        pose_data = self.load_pose_data(session_id)

        # Print summary of available data
        print("\n=== Session Data Summary ===")
        if metadata:
            print(f"\nMetadata: {metadata['filename']}")
            print(f"- Resolution: {metadata['width']}x{metadata['height']}")
            print(f"- FPS: {metadata['fps']}")
            print(f"- Duration: {metadata['duration_seconds']:.2f} seconds ({metadata['total_frames']} frames)")
            print(f"- Codec: {metadata['codec']}")

        if mainview_df is not None:
            print(f"\nMainview Timestamps: {len(mainview_df)} entries")
            print(mainview_df.describe())

            # Analyze distribution of mainview segments
            self.plot_mainview_distribution(mainview_df)

        if segmentation_data:
            print(f"\nSegmentation Data:")
            self.analyze_segmentation(segmentation_data)

        if pose_data:
            print(f"\nPose Data:")
            self.analyze_pose_data(pose_data, session_id)

    def plot_mainview_distribution(self, mainview_df):
        """Plot the distribution of mainview segments"""
        if mainview_df is None or mainview_df.empty:
            return

        plt.figure(figsize=(12, 6))

        # Calculate segment durations
        if 'frame_idx' in mainview_df.columns:
            mainview_df['segment_duration'] = mainview_df['frame_idx'].diff().fillna(0)

            plt.subplot(2, 1, 1)
            plt.hist(mainview_df['segment_duration'], bins=30)
            plt.title('Distribution of Mainview Segment Durations (frames)')
            plt.xlabel('Duration (frames)')
            plt.ylabel('Frequency')

            plt.subplot(2, 1, 2)
            plt.plot(mainview_df.index, mainview_df['frame_idx'], marker='o', alpha=0.5)
            plt.title('Mainview Frame Indices')
            plt.xlabel('Segment Index')
            plt.ylabel('Frame Index')

        plt.tight_layout()
        plt.savefig('mainview_distribution.png')
        plt.show()

    def analyze_segmentation(self, segmentation_data):
        """Analyze the segmentation data"""
        if not segmentation_data:
            return

        if 'marker_input' in segmentation_data:
            # Extract data from marker inputs
            frames_with_markers = set()
            markers_by_player = {1: 0, 2: 0}

            for chunk in segmentation_data['marker_input']:
                for marker in chunk:
                    frames_with_markers.add(marker['frame_idx'])
                    markers_by_player[marker['player_id']] += 1

            print(f"- Total marked frames: {len(frames_with_markers)}")
            print(f"- Player 1 markers: {markers_by_player[1]}")
            print(f"  - Frames segmented: {len(segmentation_data['player1']['frames'])}")
            print(f"- Player 2 markers: {markers_by_player[2]}")
            print(f"  - Frames segmented: {len(segmentation_data['player2']['frames'])}")

    def analyze_pose_data(self, pose_data, session_id):
        """Analyze pose detection data"""
        if not pose_data:
            return

        total_frames = 0
        player_data = {1: [], 2: []}

        # Look for detailed pose results in the directory structure
        pose_results_dir = self.data_dir / session_id / "pose" / "results"

        if pose_results_dir.exists():
            player1_dir = pose_results_dir / "1"
            player2_dir = pose_results_dir / "2"

            # Count results files for each player
            player1_files = list(player1_dir.glob('*.json')) if player1_dir.exists() else []
            player2_files = list(player2_dir.glob('*.json')) if player2_dir.exists() else []

            print(f"- Player 1 pose results: {len(pose_data['player1']['frames'])} frames")
            print(f"- Player 2 pose results: {len(pose_data['player2']['frames'])} frames")

            # Sample pose data analysis (using first file for each player)
            if player1_files:
                self.analyze_player_pose_sample(player1_files[0], 1)
            if player2_files:
                self.analyze_player_pose_sample(player2_files[0], 2)
        else:
            print("- No detailed pose results found in directory structure")

        if 'frames' in pose_data:
            print(f"- Frames with pose data: {len(pose_data['frames'])}")

    def analyze_player_pose_sample(self, pose_file, player_id):
        """Analyze a sample pose file for a player"""
        try:
            with open(pose_file, 'r') as f:
                pose = json.load(f)

            if 'keypoints_data' in pose:
                # Extract and analyze keypoint data
                keypoints = np.array(pose['keypoints_data'])
                confidence = np.array(pose['keypoints_conf']) if 'keypoints_conf' in pose else None

                print(f"  Player {player_id} sample pose:")
                print(f"  - Keypoints shape: {keypoints.shape}")

                if confidence is not None:
                    print(f"  - Average confidence: {np.mean(confidence):.4f}")
                    print(f"  - Min confidence: {np.min(confidence):.4f}")
                    print(f"  - Max confidence: {np.max(confidence):.4f}")

                # Plot pose keypoints if available
                if keypoints.shape[0] > 0:
                    self.plot_pose_keypoints(keypoints, confidence, player_id)
        except Exception as e:
            print(f"Error analyzing pose file: {e}")

    def plot_pose_keypoints(self, keypoints, confidence, player_id):
        """Plot the keypoints from pose detection"""
        plt.figure(figsize=(8, 8))

        # Plot all keypoints
        x = keypoints[:, 0]
        y = keypoints[:, 1]

        # Use confidence as marker size if available
        size = 50 + confidence * 100 if confidence is not None else 100

        plt.scatter(x, y, s=size, alpha=0.7, c=range(len(x)), cmap='viridis')

        # Connect keypoints that represent body parts (simplified)
        # This is a simplified version - you'll need to adjust based on your keypoint format
        connections = [
            (0, 1), (1, 2), (2, 3), (1, 3),  # head
            (0, 4), (4, 5), (5, 6),          # right arm
            (0, 7), (7, 8), (8, 9),          # left arm
            (0, 10), (10, 11), (11, 12),     # right leg
            (0, 13), (13, 14), (14, 15),     # left leg
        ]

        # Only connect if we have enough keypoints
        min_keypoints = max([max(c) for c in connections]) + 1
        if len(keypoints) >= min_keypoints:
            for i, j in connections:
                plt.plot([x[i], x[j]], [y[i], y[j]], 'gray', linestyle='-', alpha=0.4)

        plt.title(f'Player {player_id} Pose Keypoints')
        plt.xlabel('X Coordinate')
        plt.ylabel('Y Coordinate')
        plt.axis('equal')
        plt.grid(True)

        plt.savefig(f'pose_player{player_id}.png')
        plt.show()


if __name__ == '__main__':
    session_id = "f72f40ce-21ae-4770-b139-38ce346ab6d4"
    s = SquashEDA() # s.scan_sessions()
    s.analyze_session(session_id)

    # Temporal Analysis: Study how player positions change over time
    # Heatmaps: Create heatmaps of player positions during rallies
    # Movement Analysis: Calculate player movement patterns and speeds
    # ?Machine Learning: Use the extracted features to train models for predicting player fatigue or strategy
    # ?Comparative Analysis: Compare different matches or players