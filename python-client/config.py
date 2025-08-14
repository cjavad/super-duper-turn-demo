"""
Configuration module for the Python WebRTC client.
"""

import os
import yaml
from typing import Dict, Any, Optional

# Default configuration
DEFAULT_CONFIG = {
    "turn_server": "turn:turn.example.com:3478",
    "turn_username": "username",
    "turn_password": "password",
    "signaling_server": "wss://signaling.example.com",
    "media": {
        "audio": True,
        "video": True,
        "video_resolution": {
            "width": 640,
            "height": 480
        }
    },
    "data_channel": {
        "enabled": True,
        "label": "data"
    }
}


def load_config(config_path: Optional[str] = None) -> Dict[str, Any]:
    """
    Load configuration from a YAML file or environment variables.
    
    Args:
        config_path: Path to the YAML configuration file (optional)
        
    Returns:
        Dict containing the configuration
    """
    config = DEFAULT_CONFIG.copy()
    
    # Try to load from file if provided
    if config_path and os.path.exists(config_path):
        try:
            with open(config_path, 'r') as f:
                file_config = yaml.safe_load(f)
                if file_config:
                    config.update(file_config)
        except Exception as e:
            print(f"Error loading configuration from {config_path}: {e}")
    
    # Override with environment variables if present
    if os.environ.get('TURN_SERVER'):
        config['turn_server'] = os.environ.get('TURN_SERVER')
    if os.environ.get('TURN_USERNAME'):
        config['turn_username'] = os.environ.get('TURN_USERNAME')
    if os.environ.get('TURN_PASSWORD'):
        config['turn_password'] = os.environ.get('TURN_PASSWORD')
    if os.environ.get('SIGNALING_SERVER'):
        config['signaling_server'] = os.environ.get('SIGNALING_SERVER')
    
    return config


# Global configuration instance
CONFIG = load_config()


def get_config() -> Dict[str, Any]:
    """
    Get the current configuration.
    
    Returns:
        Dict containing the configuration
    """
    return CONFIG


def update_config(new_config: Dict[str, Any]) -> None:
    """
    Update the current configuration.
    
    Args:
        new_config: Dict containing the new configuration values
    """
    global CONFIG
    CONFIG.update(new_config)