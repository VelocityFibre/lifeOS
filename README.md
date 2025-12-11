# LifeOS - Unified AI Agent Platform

## 🎨 Overview
LifeOS is a minimalist, Apple-inspired unified interface for managing your digital life through AI agents. Built with React Native/Expo, it features a WhatsApp-style chat interface with a clean, Steve Jobs-inspired design philosophy.

## 🌐 Live Deployment
**Access LifeOS**: http://72.60.17.245:3010

## ✨ Features

### Design
- **Apple-Inspired UI**: Clean, minimalist interface following Steve Jobs' design principles
- **WhatsApp-Style Chat**: Familiar messaging experience with bubble-based conversations
- **Dark/Light Mode**: Beautiful theme switching for day and night use
- **Mobile-First**: Responsive design that works perfectly on all devices

### AI Agents
1. **Mail Agent** (✉️) - Gmail integration for email management
2. **Claude Agent** (◉) - AI-powered assistant for general tasks
3. **WhatsApp Agent** (◓) - WhatsApp messaging integration with conversation memory

### Technical Features
- Real-time message streaming
- Conversation history with memory
- Tool execution feedback
- Secure authentication
- Cross-platform support (Web, iOS, Android)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI

### Local Development (Backend Agents)

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/lifeos.git
cd lifeos/lifeos-agents
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your API keys
```

4. **Run the development server**
```bash
npm run dev
```

5. **Access the API**
- Agents API: http://localhost:5001
- Test endpoints: /api/agents

## 🏗️ Architecture

### Frontend (Deployed)
- **Framework**: React Native with Expo
- **State Management**: Zustand
- **Styling**: Tailwind CSS (NativeWind)
- **Navigation**: React Navigation
- **HTTP Client**: Axios
- **Location**: Deployed at http://72.60.17.245:3010

### Backend (lifeos-agents/)
- **Framework**: Express.js with TypeScript
- **AI Integration**: Mastra Framework
- **Agents**: Gmail (MCP), Claude, WhatsApp (whatsapp-web.js)
- **Memory**: In-memory conversation storage

## 📱 User Interface

### Main Features
- **Agent Selection**: Visual grid of available agents with icons
- **Chat Interface**: WhatsApp-style messaging with:
  - Message bubbles (user/assistant differentiation)
  - Typing indicators
  - Tool execution feedback
  - Real-time streaming responses
- **Theme Toggle**: System-aware dark/light mode switching
- **Authentication**: Secure login/register flow

## 🛠️ Development

### Project Structure
```
lifeos/
├── lifeos-agents/         # Backend API
│   ├── src/
│   │   ├── agents/       # AI agent implementations
│   │   │   ├── gmail.agent.ts
│   │   │   ├── claude-code.agent.ts
│   │   │   └── whatsapp.agent.ts
│   │   ├── api/          # Express server
│   │   │   └── server.ts
│   │   └── config/       # Mastra & agent configs
│   │       ├── mastra.ts
│   │       └── whatsapp-client.ts
│   ├── dist/             # Compiled TypeScript
│   └── package.json
│
└── docs/                  # Documentation
    └── *.md              # Various docs
```

### Available Scripts

**Backend (lifeos-agents/)**
```bash
npm run dev            # Development with hot reload
npm run build          # Build TypeScript
npm start              # Production server
```

## 🔧 Configuration

### Environment Variables

**Frontend (.env)**
```
API_URL=http://localhost:5001
```

**Backend (.env)**
```
PORT=5001
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

## 📦 Deployment

### VPS Deployment
The app is deployed on a VPS at `72.60.17.245`:

- **Frontend**: Nginx serves the web build on port 3010
- **Agents API**: PM2 manages the Node.js server on port 5001
- **LifeOS API**: PM2 manages the auth server on port 3009

### Deploy Updates

**Backend Updates**
```bash
# Build and package backend
cd lifeos-agents
npm run build
tar -czf lifeos-agents.tar.gz dist/ package.json package-lock.json .env
scp lifeos-agents.tar.gz root@72.60.17.245:/var/www/

# Deploy on VPS
ssh root@72.60.17.245
cd /var/www/lifeos-agents
tar -xzf ../lifeos-agents.tar.gz
pm2 restart lifeos-agents
```

**Note**: Frontend is currently deployed and stable. Contact admin for UI updates.

## 🎯 Roadmap

- [ ] More AI agents (Slack, Discord, Telegram)
- [ ] Voice input/output
- [ ] File attachments
- [ ] Agent marketplace
- [ ] Self-hosting guide
- [ ] Mobile app store releases

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- Inspired by Apple's design philosophy
- WhatsApp for the familiar chat UX
- Built with Expo, React Native, and Mastra

---

**Live Demo**: http://72.60.17.245:3010

*"Simplicity is the ultimate sophistication" - Steve Jobs*