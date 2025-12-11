# LifeOS - Unified AI Agent Platform

## 🎯 Overview
LifeOS is a minimalist, Apple-inspired unified interface for managing your digital life through AI agents. Built with React Native/Expo, it features a WhatsApp-style chat interface with a clean, Steve Jobs-inspired design philosophy.

## 🌐 Live Deployment
- **Web App**: http://72.60.17.245:3010
- **Domain** (DNS pending): http://lifeos.fibreflow.app

## 🏗 Architecture

### Frontend (React Native/Expo)
- **Location**: `/echo-mvp/expo-app`
- **Design**: Minimalist Apple-inspired UI with WhatsApp-style chat
- **Features**:
  - Dark/Light mode with system preference detection
  - Secure JWT authentication
  - Real-time message streaming
  - Mobile-first responsive design
  - Minimalist icon-based agent selection

### Backend Services

#### 1. LifeOS API (Port 3009)
- **Location**: `/lifeos` (original backend)
- **PM2 Process**: `lifeos-api` (ID: 10)
- **Features**: Authentication, message history, user management

#### 2. Agents API (Port 5001)
- **Location**: `/lifeos-agents`
- **PM2 Process**: `lifeos-agents` (ID: 13)
- **Active Agents**:
  - **Gmail Agent** (✉): 19 MCP tools for email management
  - **Claude Code Agent** (◉): AI coding assistant
  - **WhatsApp Agent** (◓): Full WhatsApp Web integration with conversation memory

## 🤖 Agent Capabilities

### Gmail Agent
- List, read, search, send emails
- Trash/delete messages
- Mark as read/unread
- Labels and filters
- Batch operations
- Conversation memory

### WhatsApp Agent
- List recent chats with unread counts
- Read messages from contacts/groups
- Send messages with confirmation
- Search conversations
- Full conversation memory
- Authenticated session (no QR scan needed)

### Claude Code Agent
- Code generation and assistance
- Development support
- Claude Code SDK (Max plan)

## 🚀 Deployment

### VPS Configuration
- **Server**: 72.60.17.245
- **Nginx**: Serves frontend on port 3010, proxies API to 3009
- **PM2**: Process management for both APIs
- **Auth**: WhatsApp session copied from local

### Quick Deploy Commands
```bash
# Build frontend
cd echo-mvp/expo-app
npx expo export --platform web --output-dir ./web-build

# Package and deploy
tar -czf lifeos-ui.tar.gz web-build/
sshpass -p "VeloF@2025@@" scp lifeos-ui.tar.gz root@72.60.17.245:/var/www/

# Extract on VPS
ssh root@72.60.17.245
cd /var/www
tar -xzf lifeos-ui.tar.gz
rm -rf lifeos-frontend && mv web-build lifeos-frontend
chown -R ubuntu:ubuntu lifeos-frontend
```

## 📝 API Endpoints

### Agents API (Port 5001)
```bash
GET  http://72.60.17.245:5001/health
GET  http://72.60.17.245:5001/api/agents
POST http://72.60.17.245:5001/api/agents/:agentId/chat

# Agent IDs: gmailAgent, claudeCodeAgent, whatsappAgent
```

### Example Usage
```bash
curl -X POST http://72.60.17.245:5001/api/agents/whatsappAgent/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Show me my recent chats","userId":"user123"}'
```

## 🎨 Design Philosophy
- **Minimalist**: Clean, distraction-free interface
- **Familiar**: WhatsApp-style chat UI for instant familiarity
- **Elegant**: Apple-inspired aesthetics with attention to detail
- **Unified**: All agents accessible through one seamless interface
- **Responsive**: Perfect on mobile, tablet, and desktop

## 🔧 Development

### Local Setup
```bash
# Frontend
cd echo-mvp/expo-app
npm install
npm start

# Agents API
cd lifeos-agents
npm install
npm run build
npm run dev
```

### Environment Variables
```bash
# lifeos-agents/.env
PORT=5001
NODE_ENV=development
OPENAI_API_KEY="your-key-here"
```

## 📊 PM2 Status
```bash
ssh root@72.60.17.245
pm2 list
pm2 logs lifeos-agents
pm2 logs lifeos-api
```

## ✅ Current Status
- **Frontend**: ✅ Apple-inspired UI deployed
- **Gmail Agent**: ✅ 19 tools working
- **WhatsApp Agent**: ✅ Authenticated & working with memory
- **Claude Code Agent**: ✅ SDK integrated
- **Authentication**: ✅ JWT-based secure auth
- **Dark Mode**: ✅ System-aware theme switching

## 🚀 Next Steps
- [ ] Add Calendar agent
- [ ] Add Notes/Memory agent
- [ ] Add Reminders/Tasks agent
- [ ] Configure DNS for lifeos.fibreflow.app
- [ ] Add SSL certificate
- [ ] Implement push notifications

---
Last Updated: December 10, 2024