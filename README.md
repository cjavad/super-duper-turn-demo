# Super Duper TURN Demo

A comprehensive WebRTC demonstration project showcasing a complete end-to-end implementation of WebRTC communication with a custom TURN server.

## Project Overview

This project demonstrates the implementation and usage of WebRTC (Web Real-Time Communication) technology with a custom TURN (Traversal Using Relays around NAT) server. It consists of three main components:

1. **TURN Server**: A Go-based TURN server implementation using the [pion/turn](https://github.com/pion/turn) library
2. **Frontend WebRTC Client**: A web-based client for WebRTC communication
3. **Python WebRTC Client**: A Python-based client for WebRTC communication

The project serves as both a learning resource and a practical demonstration of WebRTC technology, NAT traversal techniques, and real-time communication across different platforms.

## Architecture

```
┌─────────────────┐                  ┌─────────────────┐
│                 │                  │                 │
│  Frontend       │◄──WebRTC P2P────►│  Python         │
│  WebRTC Client  │                  │  WebRTC Client  │
│                 │                  │                 │
└────────┬────────┘                  └────────┬────────┘
         │                                    │
         │                                    │
         │         ┌─────────────────┐        │
         │         │                 │        │
         └─────────►  TURN Server    ◄────────┘
                   │  (Go)           │
                   │                 │
                   └─────────────────┘
```

- **Direct Communication**: When possible, WebRTC clients communicate directly with each other through peer-to-peer connections.
- **TURN Relay**: When direct communication is not possible (e.g., due to NAT or firewall restrictions), the TURN server acts as a relay to facilitate the connection.

## Components

### TURN Server (Go)

The TURN server is implemented in Go using the [pion/turn](https://github.com/pion/turn) library. It provides the following functionality:

- STUN (Session Traversal Utilities for NAT) services for NAT traversal
- TURN relay services for situations where direct peer-to-peer connections are not possible
- Authentication and authorization for secure access
- Bandwidth management and traffic optimization
- Logging and monitoring capabilities

#### Key Features

- Standards-compliant implementation of TURN (RFC 5766)
- Support for both UDP and TCP transport protocols
- Configurable relay address allocation
- Performance optimized for production use

### Frontend WebRTC Client

The frontend client is a web application that demonstrates WebRTC capabilities:

- Real-time audio and video communication
- Data channel for text and file sharing
- Connection management with the TURN server
- User-friendly interface for managing WebRTC sessions

#### Technologies Used

- HTML5, CSS3, and JavaScript
- WebRTC API
- Modern frontend framework (Svelte)
- WebSockets for signaling

### Python WebRTC Client

The Python client provides similar functionality to the web client but in a Python environment:

- Audio and video streaming capabilities
- Data channel implementation
- Integration with the TURN server
- Command-line and optional GUI interfaces

#### Technologies Used

- Python 3.8+
- [aiortc](https://github.com/aiortc/aiortc) library for WebRTC implementation
- [aiohttp](https://github.com/aio-libs/aiohttp) for signaling
- Optional GUI using PyQt or Tkinter

## Setup and Usage

### Prerequisites

- Go 1.16+ (for TURN server)
- Node.js 14+ (for frontend client)
- Python 3.8+ (for Python client)
- Docker (optional, for containerized deployment)

### TURN Server Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/cjavad/super-duper-turn-demo.git
   cd super-duper-turn-demo/turn-server
   ```

2. Install dependencies:
   ```bash
   go mod download
   ```

3. Configure the server (edit `config.yaml`):
   ```yaml
   # Example configuration
   port: 3478
   realm: "turn.example.com"
   auth_secret: "your-secret-key"
   ```

4. Run the server:
   ```bash
   go run cmd/server/main.go
   ```

### Frontend Client Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the client (edit `.env`):
   ```
   TURN_SERVER_URL=turn:turn.example.com:3478
   TURN_USERNAME=username
   TURN_CREDENTIAL=password
   SIGNALING_SERVER=wss://signaling.example.com
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   
   Note: The frontend is built with Svelte and uses Vite as the build tool.

5. Access the client at `http://localhost:3000`

### Python Client Setup

1. Navigate to the Python client directory:
   ```bash
   cd python-client
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure the client (edit `config.py`):
   ```python
   TURN_SERVER = "turn:turn.example.com:3478"
   TURN_USERNAME = "username"
   TURN_PASSWORD = "password"
   SIGNALING_SERVER = "wss://signaling.example.com"
   ```

5. Run the client:
   ```bash
   python client.py
   ```

## Deployment

### Docker Deployment

The project includes Docker configurations for easy deployment:

```bash
# Build and run the TURN server
cd turn-server
docker build -t turn-server .
docker run -p 3478:3478/udp -p 3478:3478/tcp turn-server

# Build and run the frontend
cd frontend
docker build -t webrtc-frontend .
docker run -p 80:80 webrtc-frontend

# Build and run the Python client (if needed)
cd python-client
docker build -t python-client .
docker run python-client
```

### Production Considerations

For production deployment:

- Use HTTPS for the frontend client
- Configure proper authentication for the TURN server
- Set up monitoring and logging
- Consider using a load balancer for the TURN server in high-traffic scenarios

## Development Roadmap

1. **Phase 1: Core Implementation**
   - Basic TURN server implementation
   - Simple frontend and Python clients
   - Peer-to-peer audio/video communication

2. **Phase 2: Enhanced Features**
   - Data channel implementation
   - File sharing capabilities
   - Improved UI/UX
   - Authentication system

3. **Phase 3: Advanced Features**
   - Multi-party communication
   - Recording capabilities
   - Screen sharing
   - Mobile client support

## Dependencies

### TURN Server
- [pion/turn](https://github.com/pion/turn) - Go TURN server implementation
- [go-yaml](https://github.com/go-yaml/yaml) - YAML support for Go
- [zerolog](https://github.com/rs/zerolog) - Zero allocation JSON logger

### Frontend Client
- [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Svelte](https://svelte.dev/) - Reactive frontend framework
- [simple-peer](https://github.com/feross/simple-peer) - WebRTC peer connection simplification

### Python Client
- [aiortc](https://github.com/aiortc/aiortc) - WebRTC and ORTC implementation for Python
- [aiohttp](https://github.com/aio-libs/aiohttp) - Async HTTP client/server
- [PyAudio](https://people.csail.mit.edu/hubert/pyaudio/) - Audio I/O library

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [WebRTC.org](https://webrtc.org/) for the WebRTC standards and documentation
- [Pion](https://github.com/pion) for the excellent Go WebRTC and TURN implementations
- [aiortc](https://github.com/aiortc/aiortc) team for the Python WebRTC implementation