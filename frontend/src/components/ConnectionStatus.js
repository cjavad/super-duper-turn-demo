import React from 'react';

/**
 * ConnectionStatus component for displaying the current WebRTC connection status.
 */
function ConnectionStatus({ status }) {
  // Get appropriate message and class based on status
  const getStatusInfo = () => {
    switch (status) {
      case 'connected':
        return {
          message: 'Connected to peer',
          className: 'status connected'
        };
      case 'connecting':
        return {
          message: 'Connecting to peer...',
          className: 'status connecting'
        };
      case 'disconnected':
      default:
        return {
          message: 'Disconnected. Waiting for connection...',
          className: 'status disconnected'
        };
    }
  };

  const { message, className } = getStatusInfo();

  return (
    <div className={className}>
      <p>{message}</p>
    </div>
  );
}

export default ConnectionStatus;