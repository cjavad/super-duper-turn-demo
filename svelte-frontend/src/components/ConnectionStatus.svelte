<script>
  // Props
  export let status;

  // Get appropriate message and class based on status
  $: statusInfo = getStatusInfo(status);

  function getStatusInfo(status) {
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
  }
</script>

<div class={statusInfo.className}>
  <p>{statusInfo.message}</p>
</div>