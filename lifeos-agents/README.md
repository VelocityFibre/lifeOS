# lifeOS Agents Service

Dedicated Mastra agents API for lifeOS - runs independently and provides AI agent functionality via HTTP API.

## Architecture

```
lifeOS Frontend (Expo)
    ↓
lifeOS Backend API (port 3001)
    ↓ HTTP
lifeOS Agents Service (port 5001) ← This repo
    ↓
MCP Servers (Gmail, Instagram, Spotify, etc.)
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

### 3. Run Locally

```bash
npm run dev
```

Server will start on `http://localhost:5001`

### 4. Test the API

```bash
# Health check
curl http://localhost:5001/health

# List agents
curl http://localhost:5001/api/agents

# Chat with Gmail agent
curl -X POST http://localhost:5001/api/agents/gmail/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Help me with my emails", "userId": "user123"}'
```

## Available Agents

- **gmail** - Gmail management (MCP integration coming soon)
- **instagram** - Instagram management (coming soon)
- **spotify** - Music & playlists (coming soon)
- **calendar** - Schedule management (coming soon)
- **memory** - Personal knowledge (coming soon)
- **tasks** - To-do lists (coming soon)
- **finance** - Budget tracking (coming soon)
- **health** - Wellness tracking (coming soon)
- **google-photos** - Photo library (coming soon)
- **google-drive** - File storage (coming soon)

## API Endpoints

### GET /health
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "service": "lifeos-agents",
  "version": "1.0.0",
  "port": "5001",
  "timestamp": "2025-12-08T10:00:00.000Z"
}
```

### GET /api/agents
List all available agents

**Response:**
```json
{
  "success": true,
  "agents": ["gmail", "instagram", "spotify"],
  "count": 3
}
```

### POST /api/agents/:agentId/chat
Chat with a specific agent

**Request:**
```json
{
  "message": "Show me my unread emails",
  "userId": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "agent": "gmail",
  "text": "Gmail integration is being set up! Soon you'll be able to check emails...",
  "userId": "user123"
}
```

## Development

```bash
# Run in dev mode with auto-reload
npm run dev

# Build for production
npm run build

# Run built version
npm start
```

## Deployment (VPS)

### Using PM2

```bash
# Build the project
npm run build

# Start with PM2
pm2 start dist/api/server.js --name lifeos-agents

# Save PM2 config
pm2 save
```

### Using Dokploy

1. Push code to GitHub
2. Open Dokploy UI (http://72.61.166.168:3000)
3. Create new Application
4. Select repository
5. Set environment variables
6. Deploy!

## Environment Variables

Required:
- `OPENAI_API_KEY` - OpenAI API key for agents

Optional:
- `PORT` - Server port (default: 5001)
- `NODE_ENV` - Environment (development/production)

MCP credentials (when integrating):
- `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`
- `INSTAGRAM_ACCESS_TOKEN`
- `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`
- etc.

## Adding New Agents

1. Create agent file in `src/agents/`
2. Register in `src/config/mastra.ts`
3. Agent will be available via API automatically!

Example:
```typescript
// src/agents/spotify.agent.ts
import { Agent } from "@mastra/core";

export const spotifyAgent = new Agent({
  name: "spotify-agent",
  instructions: "You help users manage their Spotify...",
  model: { provider: "openai", name: "gpt-4o-mini" },
});

// src/config/mastra.ts
import { spotifyAgent } from "../agents/spotify.agent.js";

export const mastra = new Mastra({
  agents: {
    gmail: gmailAgent,
    spotify: spotifyAgent, // ← Add here
  },
});
```

## Project Structure

```
lifeos-agents/
├── src/
│   ├── agents/           # Agent definitions
│   │   └── gmail.agent.ts
│   ├── tools/            # Custom tools (future)
│   ├── api/              # Express API server
│   │   └── server.ts
│   └── config/           # Configuration
│       └── mastra.ts
├── package.json
├── tsconfig.json
├── .env
└── README.md
```

## License

MIT
