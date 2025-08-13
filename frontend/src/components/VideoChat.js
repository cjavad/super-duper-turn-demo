import React from 'react';

/**
 * VideoChat component for displaying local and remote video streams
 * and providing media controls.
 */
function VideoChat({ 
  localVideoRef, 
  remoteVideoRef, 
  toggleAudio, 
  toggleVideo, 
  endCall, 
  connectionStatus 
}) {
  return (
    <div>
      <div className="video-container">
        <div className="video-item">
          <h3>Local Video</h3>
          <video 
            ref={localVideoRef} 
            autoPlay 
            muted 
            playsInline
          />
        </div>
        
        <div className="video-item">
          <h3>Remote Video</h3>
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline
          />
          {connectionStatus !== 'connected' && (
            <div className="video-placeholder">
              <p>Waiting for connection...</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="controls">
        <button onClick={toggleAudio}>
          Toggle Audio
        </button>
        <button onClick={toggleVideo}>
          Toggle Video
        </button>
        <button 
          onClick={endCall} 
          disabled={connectionStatus !== 'connected'}
          style={{ backgroundColor: '#f44336' }}
        >
          End Call
        </button>
      </div>
    </div>
  );
}

export default VideoChat;