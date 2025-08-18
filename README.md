# Voice CodeGen Hexa

An integrated AI-powered code generation application with a voice-enabled hexagon assistant. This project combines the best of both worlds: a sophisticated code generation backend with an intelligent voice interface.

## 🏗️ Architecture Overview

This project follows a **hybrid architecture** that leverages the strengths of different technologies:

- **Frontend**: React + TypeScript + Vite (deployed on Cloudflare Workers)
- **Voice Agent**: Animated hexagon character with OpenAI Realtime API integration
- **Backend**: Python FastAPI service for code generation (deployed separately)
- **Communication**: WebSocket for real-time voice, HTTP for code generation

## 🎯 Features

### Phase 1: Blended but Separate (Current)
- **Code Generation Workflow**: Traditional web interface for generating flowcharts and code
- **Voice Assistant**: Intelligent hexagon character that can answer questions about generated code
- **Independent Operation**: Both systems work separately but share the same UI space
- **Context Awareness**: Voice agent understands what code was generated and can explain it

### Phase 2: Voice-Driven UI Control (Future)
- **Voice Navigation**: Control the interface entirely through voice commands
- **Smart Interactions**: Agent can click buttons, navigate sections, and perform actions
- **Natural Language**: Describe what you want to see or do in plain English

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and Yarn
- Python 3.8+ (for backend)
- OpenAI API key with Realtime API access
- Cloudflare account with Workers enabled

### 1. Install Dependencies
```bash
yarn install
```

### 2. Configure Environment
Create a `.env` file in the root directory:
```env
VITE_WS_URL=wss://your-worker.your-subdomain.workers.dev/voice
VITE_PYTHON_API_URL=https://your-python-backend.com
```

### 3. Update Worker Configuration
Edit `wrangler.jsonc`:
```json
{
  "env": {
    "OPENAI_REALTIME_MODEL": "your-actual-openai-api-key-here"
  },
  "vars": {
    "PYTHON_API_URL": "https://your-python-backend-url.com"
  }
}
```

### 4. Development
```bash
# Start development server
yarn dev

# Build worker
yarn build:worker

# Deploy to Cloudflare
yarn deploy
```

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── animated/        # Animated hexagon character parts
│   ├── CodeGenInterface.tsx    # Code generation workflow
│   ├── VoiceAgent.tsx          # Voice assistant interface
│   ├── MermaidDiagram.tsx      # Flowchart rendering
│   └── CodeDisplay.tsx         # Code display with syntax highlighting
├── hooks/               # Custom React hooks
│   ├── useVoiceInteraction.tsx # Voice interaction management
│   ├── useVoiceConnection.ts   # WebSocket connection handling
│   └── useCodeGen.ts           # Code generation workflow
├── store/               # State management
│   └── codeGenStore.tsx        # Zustand store for app state
└── worker-voice/        # Cloudflare Workers backend
    ├── index.ts                 # Main worker entry point
    └── voice-session.ts         # Durable Object for voice sessions
```

## 🔧 Configuration

### Python Backend Integration
The application communicates with your existing Python CodeGen backend through HTTP API calls. Update the `PYTHON_API_URL` in your worker configuration to point to your deployed Python service.

### Voice Agent Setup
1. **OpenAI Realtime API**: Configure your API key in `wrangler.jsonc`
2. **WebSocket Endpoint**: The voice agent connects to `/voice` endpoint
3. **Durable Objects**: Voice sessions are managed using Cloudflare Durable Objects

## 🎨 Customization

### Styling
- **Tailwind CSS**: All styling uses Tailwind with custom CSS variables
- **Theme Support**: Built-in light/dark mode support
- **Responsive Design**: Mobile-first approach with responsive breakpoints

### Animations
- **Framer Motion**: Smooth animations for the hexagon character
- **Custom Animations**: Eyes, mouth, and glow effects that respond to voice activity
- **Performance**: Optimized animations that don't impact performance

### Voice Agent
- **Character Design**: Customizable hexagon appearance and animations
- **Response Patterns**: Configurable voice response behaviors
- **Context Awareness**: Agent can understand and explain generated code

## 🚀 Deployment

### Cloudflare Workers
1. **Build the worker**: `yarn build:worker`
2. **Deploy**: `yarn deploy` or `wrangler deploy`
3. **Enable Durable Objects**: Ensure Durable Objects are enabled in your Cloudflare dashboard

### Frontend
1. **Build the app**: `yarn build`
2. **Deploy**: The worker serves the built React app
3. **Custom Domain**: Configure your custom domain in Cloudflare

## 🔌 API Endpoints

### Voice WebSocket
- `GET /voice` - WebSocket upgrade for voice connections

### Code Generation (Proxy to Python)
- `POST /api/generate-diagram` - Generate Mermaid flowchart
- `POST /api/generate-code` - Generate code from flowchart

### Health Check
- `GET /health` - Service health status

## 🧪 Development

### Local Development
```bash
# Start development server
yarn dev

# Build for production
yarn build

# Preview production build
yarn preview

# Lint code
yarn lint

# Format code
yarn format
```

### Testing Voice Integration
1. Start the development server
2. Click "Start Listening" in the voice agent
3. Speak your question about the code
4. The agent will respond with explanations

### Testing Code Generation
1. Enter a code requirement description
2. Click "Generate Flowchart"
3. Review the generated diagram
4. Click "Generate Code" to create actual code files
5. Use the voice agent to ask questions about the code

## 🔮 Future Enhancements

### Phase 2 Features
- **Voice Navigation**: Control UI elements through voice commands
- **Smart Context**: Agent understands user intent and navigates accordingly
- **Advanced Interactions**: Complex workflows controlled entirely by voice

### Additional Integrations
- **Marimo Notebooks**: Direct integration with Marimo for interactive code execution
- **Git Integration**: Commit and push generated code directly
- **Team Collaboration**: Share code generation sessions with team members

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Issues**: Create GitHub issues for bugs or feature requests
- **Documentation**: Check the inline code comments and this README
- **Community**: Join our Discord or community channels

---

**Note**: This project is designed to work alongside your existing Python CodeGen backend. The voice agent provides an intelligent interface layer while maintaining the robust code generation capabilities you already have.
