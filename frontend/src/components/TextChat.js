import React, { useState, useRef, useEffect } from 'react';

/**
 * TextChat component for displaying and sending text messages
 * through WebRTC data channel.
 */
function TextChat({ messages, sendMessage, connectionStatus }) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle message submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim() && connectionStatus === 'connected') {
      sendMessage(inputText);
      setInputText('');
    }
  };

  // Format timestamp for display
  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="chat-container">
      <h2>Text Chat</h2>
      
      <div className="chat-messages">
        {messages.length === 0 ? (
          <p className="empty-chat">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={index} 
              className={`message ${msg.fromMe ? 'local' : 'remote'}`}
            >
              <div className="message-content">{msg.text}</div>
              <div className="message-time">{formatTime(msg.time)}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="chat-input">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
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
  );
}

export default TextChat;