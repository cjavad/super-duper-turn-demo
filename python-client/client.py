#!/usr/bin/env python3
"""
Python WebRTC Client for Super Duper TURN Demo

This client demonstrates WebRTC functionality using the aiortc library,
including audio/video streaming and data channel communication.
"""

import argparse
import asyncio
import json
import logging
import os
import sys
import time
from typing import Dict, Any, Optional, List

import aiohttp
import cv2
import numpy as np
from aiohttp import web
from aiortc import (
    RTCPeerConnection,
    RTCSessionDescription,
    RTCIceServer,
    RTCConfiguration,
    MediaStreamTrack,
    VideoStreamTrack,
    AudioStreamTrack,
)
from aiortc.contrib.media import MediaBlackhole, MediaPlayer, MediaRecorder
from aiortc.contrib.signaling import BYE, object_from_string, object_to_string

from config import get_config, update_config

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger("webrtc-client")


class VideoTransformTrack(VideoStreamTrack):
    """
    A video stream track that transforms frames from another track.
    """

    def __init__(self, track, transform=None):
        super().__init__()
        self.track = track
        self.transform = transform or "none"
        self.counter = 0

    async def recv(self):
        frame = await self.track.recv()
        self.counter += 1

        if self.transform == "grayscale":
            # Convert to grayscale
            img = frame.to_ndarray(format="bgr24")
            img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
            new_frame = VideoStreamTrack.frame_from_ndarray(img, format="bgr24")
            new_frame.pts = frame.pts
            new_frame.time_base = frame.time_base
            return new_frame
        elif self.transform == "edges":
            # Edge detection
            img = frame.to_ndarray(format="bgr24")
            img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            img = cv2.Canny(img, 100, 200)
            img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
            new_frame = VideoStreamTrack.frame_from_ndarray(img, format="bgr24")
            new_frame.pts = frame.pts
            new_frame.time_base = frame.time_base
            return new_frame
        else:
            # No transformation
            return frame


class WebRTCClient:
    """
    WebRTC client implementation using aiortc.
    """

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.peer_connection = None
        self.data_channel = None
        self.signaling_client = None
        self.local_tracks = []
        self.remote_tracks = []

    async def connect(self):
        """
        Connect to the signaling server and set up the peer connection.
        """
        # Set up ICE servers (STUN/TURN)
        ice_servers = [
            RTCIceServer(
                urls=self.config["turn_server"],
                username=self.config["turn_username"],
                credential=self.config["turn_password"],
            )
        ]

        # Create peer connection
        self.peer_connection = RTCPeerConnection(
            RTCConfiguration(iceServers=ice_servers)
        )

        # Set up event handlers
        @self.peer_connection.on("iceconnectionstatechange")
        async def on_iceconnectionstatechange():
            logger.info(f"ICE connection state: {self.peer_connection.iceConnectionState}")

        @self.peer_connection.on("track")
        async def on_track(track):
            logger.info(f"Received {track.kind} track")
            self.remote_tracks.append(track)

            @track.on("ended")
            async def on_ended():
                logger.info(f"Track {track.kind} ended")
                self.remote_tracks.remove(track)

        # Set up data channel if enabled
        if self.config["data_channel"]["enabled"]:
            self.data_channel = self.peer_connection.createDataChannel(
                self.config["data_channel"]["label"]
            )

            @self.data_channel.on("open")
            def on_open():
                logger.info("Data channel opened")

            @self.data_channel.on("message")
            def on_message(message):
                if isinstance(message, str):
                    logger.info(f"Received message: {message}")
                else:
                    logger.info(f"Received binary message: {len(message)} bytes")

            @self.peer_connection.on("datachannel")
            def on_datachannel(channel):
                logger.info(f"Received data channel: {channel.label}")
                
                @channel.on("message")
                def on_message(message):
                    if isinstance(message, str):
                        logger.info(f"Received message on {channel.label}: {message}")
                        # Echo back
                        channel.send(f"Echo: {message}")
                    else:
                        logger.info(f"Received binary message on {channel.label}: {len(message)} bytes")

        # Connect to signaling server
        await self.connect_to_signaling()

    async def connect_to_signaling(self):
        """
        Connect to the signaling server using WebSockets.
        """
        logger.info(f"Connecting to signaling server: {self.config['signaling_server']}")
        # This is a placeholder for actual signaling implementation
        # In a real application, you would connect to a WebSocket server
        # and exchange SDP offers/answers and ICE candidates
        logger.info("Signaling connection established (simulated)")

    async def add_media_tracks(self):
        """
        Add local media tracks to the peer connection.
        """
        # Add audio track if enabled
        if self.config["media"]["audio"]:
            # In a real implementation, you would use a real audio source
            # For this demo, we'll use a dummy audio track
            audio_track = AudioStreamTrack()
            self.local_tracks.append(audio_track)
            self.peer_connection.addTrack(audio_track)
            logger.info("Added audio track")

        # Add video track if enabled
        if self.config["media"]["video"]:
            # In a real implementation, you would use a camera
            # For this demo, we'll use a dummy video track or a test pattern
            try:
                # Try to use the camera
                camera = cv2.VideoCapture(0)
                if not camera.isOpened():
                    raise RuntimeError("Could not open camera")
                
                width = self.config["media"]["video_resolution"]["width"]
                height = self.config["media"]["video_resolution"]["height"]
                camera.set(cv2.CAP_PROP_FRAME_WIDTH, width)
                camera.set(cv2.CAP_PROP_FRAME_HEIGHT, height)
                
                # Create a custom video track using OpenCV
                class CameraStreamTrack(VideoStreamTrack):
                    def __init__(self):
                        super().__init__()
                        self.camera = camera
                        self.counter = 0
                    
                    async def recv(self):
                        self.counter += 1
                        ret, frame = self.camera.read()
                        if not ret:
                            # If camera read fails, provide a colored frame
                            frame = np.zeros((height, width, 3), np.uint8)
                            frame[:, :, self.counter % 3] = 255  # Cycle through colors
                        
                        # Convert to VideoFrame
                        video_frame = VideoStreamTrack.frame_from_ndarray(frame, format="bgr24")
                        video_frame.pts = int(self.counter * 1000000 / 30)  # 30 fps
                        video_frame.time_base = fractions.Fraction(1, 1000000)
                        return video_frame
                
                video_track = CameraStreamTrack()
                self.local_tracks.append(video_track)
                self.peer_connection.addTrack(video_track)
                logger.info("Added camera video track")
            except Exception as e:
                logger.warning(f"Could not use camera: {e}")
                logger.info("Using dummy video track instead")
                # Use a dummy video track
                video_track = VideoStreamTrack()
                self.local_tracks.append(video_track)
                self.peer_connection.addTrack(video_track)
                logger.info("Added dummy video track")

    async def create_offer(self):
        """
        Create an offer and set it as local description.
        """
        offer = await self.peer_connection.createOffer()
        await self.peer_connection.setLocalDescription(offer)
        logger.info("Created offer")
        return offer

    async def handle_answer(self, answer):
        """
        Handle an answer from the remote peer.
        """
        answer_desc = RTCSessionDescription(sdp=answer["sdp"], type=answer["type"])
        await self.peer_connection.setRemoteDescription(answer_desc)
        logger.info("Processed answer")

    async def send_message(self, message):
        """
        Send a message through the data channel.
        """
        if self.data_channel and self.data_channel.readyState == "open":
            self.data_channel.send(message)
            logger.info(f"Sent message: {message}")
        else:
            logger.warning("Data channel not open, cannot send message")

    async def close(self):
        """
        Close the peer connection and clean up resources.
        """
        logger.info("Closing connection")
        
        # Close tracks
        for track in self.local_tracks:
            track.stop()
        
        # Close peer connection
        if self.peer_connection:
            await self.peer_connection.close()
        
        logger.info("Connection closed")


async def run_demo():
    """
    Run a simple WebRTC demo.
    """
    config = get_config()
    client = WebRTCClient(config)
    
    try:
        await client.connect()
        await client.add_media_tracks()
        
        # In a real application, you would exchange offers/answers with a remote peer
        # For this demo, we'll just create an offer and print it
        offer = await client.create_offer()
        print("\nGenerated offer SDP:")
        print(json.dumps({
            "type": offer.type,
            "sdp": offer.sdp
        }, indent=4))
        
        # Send a test message if data channel is enabled
        if config["data_channel"]["enabled"]:
            await asyncio.sleep(1)  # Wait a bit for data channel to be established
            await client.send_message("Hello from Python WebRTC client!")
        
        # Keep the connection open for a while
        print("\nPress Ctrl+C to exit...")
        while True:
            await asyncio.sleep(1)
    
    except KeyboardInterrupt:
        print("\nExiting...")
    finally:
        await client.close()


def parse_args():
    """
    Parse command line arguments.
    """
    parser = argparse.ArgumentParser(description="Python WebRTC Client")
    parser.add_argument("--config", help="Path to configuration file")
    parser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose logging")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    
    # Set log level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Run the demo
    try:
        import fractions  # Import here to avoid issues with the class definition
        asyncio.run(run_demo())
    except Exception as e:
        logger.error(f"Error: {e}")
        sys.exit(1)