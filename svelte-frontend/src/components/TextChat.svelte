<script>
  import { onMount, afterUpdate } from 'svelte';

  // Props
  export let messages = [];
  export let sendMessage;
  export let connectionStatus;

  // Local state
  let inputText = '';
  let messagesEnd;

  // Auto-scroll to bottom when new messages arrive
  afterUpdate(() => {
    if (messagesEnd) {
      messagesEnd.scrollIntoView({ behavior: 'smooth' });
    }
  });

  // Handle message submission
  function handleSubmit(e) {
    e.preventDefault();
    if (inputText.trim() && connectionStatus === 'connected') {
      sendMessage(inputText);
      inputText = '';
    }
  }

  // Format timestamp for display
  function formatTime(isoString) {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  }
</script>

<div class="chat-container">
  <h2>Text Chat</h2>
  
  <div class="chat-messages">
    {#if messages.length === 0}
      <p class="empty-chat">No messages yet. Start the conversation!</p>
    {:else}
      {#each messages as msg, index}
        <div 
          class="message {msg.fromMe ? 'local' : 'remote'}"
        >
          <div class="message-content">{msg.text}</div>
          <div class="message-time">{formatTime(msg.time)}</div>
        </div>
      {/each}
    {/if}
    <div bind:this={messagesEnd}></div>
  </div>
  
  <form on:submit={handleSubmit} class="chat-input">
    <input
      type="text"
      bind:value={inputText}
      placeholder={
        connectionStatus === 'connected' 
          ? "Type a message..." 
          : "Connect to send messages"
      }
      disabled={connectionStatus !== 'connected'}
    />
    <button 
      type="submit" 
      disabled={connectionStatus !== 'connected' || !inputText.trim()}
    >
      Send
    </button>
  </form>
</div>