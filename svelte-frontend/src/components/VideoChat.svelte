<script>
  // Props
  export let localVideoRef;
  export let remoteVideoRef;
  export let toggleAudio;
  export let toggleVideo;
  export let endCall;
  export let connectionStatus;
</script>

<div>
  <div class="video-container">
    <div class="video-item">
      <h3>Local Video</h3>
      <video 
        bind:this={localVideoRef} 
        autoplay 
        muted 
        playsinline
      ></video>
    </div>
    
    <div class="video-item">
      <h3>Remote Video</h3>
      <video 
        bind:this={remoteVideoRef} 
        autoplay 
        playsinline
      ></video>
      {#if connectionStatus !== 'connected'}
        <div class="video-placeholder">
          <p>Waiting for connection...</p>
        </div>
      {/if}
    </div>
  </div>
  
  <div class="controls">
    <button on:click={toggleAudio}>
      Toggle Audio
    </button>
    <button on:click={toggleVideo}>
      Toggle Video
    </button>
    <button 
      on:click={endCall} 
      disabled={connectionStatus !== 'connected'}
      style="background-color: #f44336"
    >
      End Call
    </button>
  </div>
</div>