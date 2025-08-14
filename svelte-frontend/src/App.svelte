<script>
  import { onMount, onDestroy } from 'svelte';
  import SimplePeer from 'simple-peer';
  import io from 'socket.io-client';
  import VideoChat from './components/VideoChat.svelte';
  import TextChat from './components/TextChat.svelte';
  import ConnectionStatus from './components/ConnectionStatus.svelte';

  // State for WebRTC connection
  let connectionStatus = 'disconnected';
  let localStream = null;
  let remoteStream = null;
  let messages = [];
  let turnConfig = {
    urls: import.meta.env.VITE_TURN_SERVER || 'turn:turn.example.com:3478',
    username: import.meta.env.VITE_TURN_USERNAME || 'username',
    credential: import.meta.env.VITE_TURN_PASSWORD || 'password'
  };

  // References
  let peer = null;
  let socket = null;
  let dataChannel = null;
  let localVideoRef;
  let remoteVideoRef;

  // Initialize WebRTC connection
  onMount(() => {
    // Connect to signaling server
    const signalServerUrl = import.meta.env.VITE_SIGNALING_SERVER || 'http://localhost:8080';
    socket = io(signalServerUrl);

    // Get local media stream
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        localStream = stream;
        if (localVideoRef) {
          localVideoRef.srcObject = stream;
        }

        // Socket event handlers
        socket.on('connect', () => {
          console.log('Connected to signaling server');
        });

        socket.on('user-joined', userId => {
          console.log(`User joined: ${userId}`);
          initiateCall(stream);
        });

        socket.on('offer', handleReceiveOffer);
        socket.on('answer', handleReceiveAnswer);
        socket.on('ice-candidate', handleNewICECandidateMsg);
      })
      .catch(error => {
        console.error('Error accessing media devices:', error);
      });
  });

  // Cleanup on component unmount
  onDestroy(() => {
    if (socket) {
      socket.disconnect();
    }
    if (peer) {
      peer.destroy();
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
  });

  // Update remote video when remote stream changes
  $: if (remoteVideoRef && remoteStream) {
    remoteVideoRef.srcObject = remoteStream;
  }

  // Initiate a call to a peer
  function initiateCall(stream) {
    connectionStatus = 'connecting';
    
    const newPeer = new SimplePeer({
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

    newPeer.on('signal', data => {
      console.log('Generated offer');
      socket.emit('offer', data);
    });

    newPeer.on('connect', () => {
      console.log('Peer connection established');
      connectionStatus = 'connected';
    });

    newPeer.on('stream', stream => {
      console.log('Received remote stream');
      remoteStream = stream;
    });

    newPeer.on('data', data => {
      const message = JSON.parse(data);
      messages = [...messages, { ...message, fromMe: false }];
    });

    newPeer.on('close', () => {
      console.log('Connection closed');
      connectionStatus = 'disconnected';
    });

    newPeer.on('error', err => {
      console.error('Peer error:', err);
      connectionStatus = 'disconnected';
    });

    // Create data channel
    dataChannel = newPeer._channel;
    peer = newPeer;
  }

  // Handle incoming offer
  function handleReceiveOffer(offer) {
    console.log('Received offer');
    connectionStatus = 'connecting';

    const newPeer = new SimplePeer({
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

    newPeer.on('signal', data => {
      console.log('Generated answer');
      socket.emit('answer', data);
    });

    newPeer.on('connect', () => {
      console.log('Peer connection established');
      connectionStatus = 'connected';
    });

    newPeer.on('stream', stream => {
      console.log('Received remote stream');
      remoteStream = stream;
    });

    newPeer.on('data', data => {
      const message = JSON.parse(data);
      messages = [...messages, { ...message, fromMe: false }];
    });

    newPeer.on('close', () => {
      console.log('Connection closed');
      connectionStatus = 'disconnected';
    });

    newPeer.on('error', err => {
      console.error('Peer error:', err);
      connectionStatus = 'disconnected';
    });

    // Signal the peer with the offer
    newPeer.signal(offer);
    
    // Create data channel
    dataChannel = newPeer._channel;
    peer = newPeer;
  }

  // Handle incoming answer
  function handleReceiveAnswer(answer) {
    console.log('Received answer');
    peer.signal(answer);
  }

  // Handle ICE candidates
  function handleNewICECandidateMsg(candidate) {
    console.log('Received ICE candidate');
    peer.signal({ candidate });
  }

  // Send a message through the data channel
  function sendMessage(text) {
    if (peer && peer.connected) {
      const message = {
        text,
        time: new Date().toISOString()
      };
      
      peer.send(JSON.stringify(message));
      messages = [...messages, { ...message, fromMe: true }];
    }
  }

  // Toggle audio
  function toggleAudio() {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  }

  // Toggle video
  function toggleVideo() {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  }

  // End call
  function endCall() {
    if (peer) {
      peer.destroy();
    }
    connectionStatus = 'disconnected';
    remoteStream = null;
  }
</script>

<div class="container">
  <div class="header">
    <h1>Super Duper TURN Demo</h1>
    <p>WebRTC Frontend Client (Svelte)</p>
  </div>

  <ConnectionStatus status={connectionStatus} />

  <VideoChat
    bind:localVideoRef
    bind:remoteVideoRef
    {toggleAudio}
    {toggleVideo}
    {endCall}
    {connectionStatus}
  />

  <TextChat
    messages={messages}
    {sendMessage}
    {connectionStatus}
  />
</div>