import React, { useState, useEffect, useRef } from 'react';
import SimplePeer from 'simple-peer';
import io from 'socket.io-client';
import VideoChat from './components/VideoChat';
import TextChat from './components/TextChat';
import ConnectionStatus from './components/ConnectionStatus';

function App() {
  // State for WebRTC connection
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [messages, setMessages] = useState([]);
  const [turnConfig, setTurnConfig] = useState({
    urls: process.env.REACT_APP_TURN_SERVER || 'turn:turn.example.com:3478',
    username: process.env.REACT_APP_TURN_USERNAME || 'username',
    credential: process.env.REACT_APP_TURN_PASSWORD || 'password'
  });

  // References
  const peerRef = useRef(null);
  const socketRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const dataChannelRef = useRef(null);

  // Initialize WebRTC connection
  useEffect(() => {
    // Connect to signaling server
    const signalServerUrl = process.env.REACT_APP_SIGNALING_SERVER || 'http://localhost:8080';
    socketRef.current = io(signalServerUrl);

    // Get local media stream
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Socket event handlers
        socketRef.current.on('connect', () => {
          console.log('Connected to signaling server');
        });

        socketRef.current.on('user-joined', userId => {
          console.log(`User joined: ${userId}`);
          initiateCall(stream);
        });

        socketRef.current.on('offer', handleReceiveOffer);
        socketRef.current.on('answer', handleReceiveAnswer);
        socketRef.current.on('ice-candidate', handleNewICECandidateMsg);
      })
      .catch(error => {
        console.error('Error accessing media devices:', error);
      });

    // Cleanup on component unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Update remote video when remote stream changes
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Initiate a call to a peer
  const initiateCall = (stream) => {
    setConnectionStatus('connecting');
    
    const peer = new SimplePeer({
      initiator: true,
      trickle: true,
      stream: stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          {
            urls: turnConfig.urls,
            username: turnConfig.username,
            credential: turnConfig.credential
          }
        ]
      }
    });

    peer.on('signal', data => {
      console.log('Generated offer');
      socketRef.current.emit('offer', data);
    });

    peer.on('connect', () => {
      console.log('Peer connection established');
      setConnectionStatus('connected');
    });

    peer.on('stream', stream => {
      console.log('Received remote stream');
      setRemoteStream(stream);
    });

    peer.on('data', data => {
      const message = JSON.parse(data);
      setMessages(prevMessages => [...prevMessages, { ...message, fromMe: false }]);
    });

    peer.on('close', () => {
      console.log('Connection closed');
      setConnectionStatus('disconnected');
    });

    peer.on('error', err => {
      console.error('Peer error:', err);
      setConnectionStatus('disconnected');
    });

    // Create data channel
    dataChannelRef.current = peer._channel;
    peerRef.current = peer;
  };

  // Handle incoming offer
  const handleReceiveOffer = (offer) => {
    console.log('Received offer');
    setConnectionStatus('connecting');

    const peer = new SimplePeer({
      initiator: false,
      trickle: true,
      stream: localStream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          {
            urls: turnConfig.urls,
            username: turnConfig.username,
            credential: turnConfig.credential
          }
        ]
      }
    });

    peer.on('signal', data => {
      console.log('Generated answer');
      socketRef.current.emit('answer', data);
    });

    peer.on('connect', () => {
      console.log('Peer connection established');
      setConnectionStatus('connected');
    });

    peer.on('stream', stream => {
      console.log('Received remote stream');
      setRemoteStream(stream);
    });

    peer.on('data', data => {
      const message = JSON.parse(data);
      setMessages(prevMessages => [...prevMessages, { ...message, fromMe: false }]);
    });

    peer.on('close', () => {
      console.log('Connection closed');
      setConnectionStatus('disconnected');
    });

    peer.on('error', err => {
      console.error('Peer error:', err);
      setConnectionStatus('disconnected');
    });

    // Signal the peer with the offer
    peer.signal(offer);
    
    // Create data channel
    dataChannelRef.current = peer._channel;
    peerRef.current = peer;
  };

  // Handle incoming answer
  const handleReceiveAnswer = (answer) => {
    console.log('Received answer');
    peerRef.current.signal(answer);
  };

  // Handle ICE candidates
  const handleNewICECandidateMsg = (candidate) => {
    console.log('Received ICE candidate');
    peerRef.current.signal({ candidate });
  };

  // Send a message through the data channel
  const sendMessage = (text) => {
    if (peerRef.current && peerRef.current.connected) {
      const message = {
        text,
        time: new Date().toISOString()
      };
      
      peerRef.current.send(JSON.stringify(message));
      setMessages(prevMessages => [...prevMessages, { ...message, fromMe: true }]);
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  };

  // End call
  const endCall = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    setConnectionStatus('disconnected');
    setRemoteStream(null);
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Super Duper TURN Demo</h1>
        <p>WebRTC Frontend Client</p>
      </div>

      <ConnectionStatus status={connectionStatus} />

      <VideoChat
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        toggleAudio={toggleAudio}
        toggleVideo={toggleVideo}
        endCall={endCall}
        connectionStatus={connectionStatus}
      />

      <TextChat
        messages={messages}
        sendMessage={sendMessage}
        connectionStatus={connectionStatus}
      />
    </div>
  );
}

export default App;