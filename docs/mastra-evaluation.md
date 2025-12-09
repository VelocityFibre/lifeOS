# Mastra Evaluation for Echo App

**Evaluated:** 2025-12-03
**Decision:** ✅ USE MASTRA (with hybrid architecture)

---

## What Is Mastra?

**Mastra = TypeScript AI Agent Framework**

Created by the Gatsby team, it's a comprehensive toolkit for building AI agents with:
- 40+ AI model providers (OpenAI, Anthropic, Google, Llama, etc.)
- Agent orchestration with tool calling
- Built-in observability and tracing
- Studio UI for development/testing
- MCP (Model Context Protocol) for integrations

**GitHub:** https://github.com/mastra-ai/mastra
**Docs:** https://mastra.ai/docs

---

## Key Features

### 1. Agent System
```typescript
import { Agent } from "@mastra/core/agent"

const memAgent = new Agent({
  name: "Memory Agent",
  instructions: "Search user's message history",
  model: "gpt-4o-mini",
  tools: { searchTool }
})

// Call agent
const result = await memAgent.generate("search for Berlin")
```

### 2. Tool/Function Calling
```typescript
import { createTool } from "@mastra/core/tools"
import { z } from "zod"

const searchTool = createTool({
  id: "search-messages",
  description: "Search through message history",
  inputSchema: z.object({
    query: z.string()
  }),
  execute: async ({ query }) => {
    // SQLite search logic
    return { results: [...] }
  }
})
```

### 3. Mastra Studio (UI Dashboard)
- **Launch:** `mastra dev` → http://localhost:4111
- **Features:**
  - Chat with agents directly
  - View agent reasoning steps
  - Test tools in isolation
  - Observe traces/logs
  - Switch models dynamically
  - Workflow visualization

### 4. MCP Integrations
Pre-built integrations via Model Context Protocol:
- Gmail (via Composio)
- Google Calendar (via Composio)
- Google Sheets
- Salesforce, HubSpot
- 150+ SaaS apps (via Ampersand)

### 5. Multi-Model Support
Switch between providers easily:
- OpenAI (GPT-4o, GPT-4o-mini)
- Anthropic (Claude 3.5 Sonnet/Haiku)
- Google (Gemini Pro/Flash)
- Meta (Llama 3.2, 3.3)
- Local models (via Ollama)

---

## How It Fits Echo

### ✅ Perfect Match For:

**1. Agent Management**
- No need to build agent routing from scratch
- Mastra handles tool calling, context, memory
- Easy to add new agents (just create new Agent instance)

**2. Development Speed**
- Studio UI for testing agents (no need to build admin panel)
- Built-in observability (see what agents are doing)
- Hot reload during development

**3. LLM Flexibility**
- Start with cloud (OpenAI/Claude)
- Switch to local models later (Ollama)
- No vendor lock-in

**4. Tool/API Integration**
- MCP provides Gmail, Calendar integrations
- Easy to add custom tools (SQLite search, etc.)
- Structured function calling

### ⚠️ Considerations:

**1. Backend Required**
- Mastra runs on Node.js server (not in React Native)
- Need to deploy backend separately
- Expo app calls Mastra API

**Architecture:**
```
[Expo App] → HTTP/WebSocket → [Mastra Backend] → [LLMs/APIs]
   (UI)                         (Agent orchestration)
```

**2. Not a Full Framework**
- Mastra = agent layer only
- You still need to build:
  - Expo UI
  - SQLite database (local on device)
  - User authentication
  - Message sync

**3. Deployment Complexity**
- Need to host Mastra server (Railway, Render, Fly.io)
- Not fully "local-first" (agents run on server)
- Adds infrastructure cost

---

## Recommended Architecture

### Hybrid Approach: Expo + Mastra Backend

```
┌─────────────────────────────────────┐
│  Expo App (React Native)            │
│  ├── Chat UI (GiftedChat)          │
│  ├── Local SQLite (messages)       │
│  └── State Management (Zustand)    │
└──────────────┬──────────────────────┘
               │ HTTP/WebSocket
┌──────────────▼──────────────────────┐
│  Mastra Backend (Node.js)           │
│  ├── Agent Orchestration            │
│  ├── @mem, @cal, @mail agents      │
│  ├── LLM Integration                │
│  └── Tool Functions                 │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  External Services                   │
│  ├── OpenAI / Anthropic (LLMs)     │
│  ├── Gmail API (via MCP)            │
│  ├── Google Calendar (via MCP)     │
│  └── Other integrations             │
└─────────────────────────────────────┘
```

### Communication Flow

**User sends message:**
```
1. User types "@mem search Berlin"
2. Expo app saves to local SQLite
3. Expo app sends to Mastra API:
   POST /api/agent/mem
   { "query": "search Berlin" }

4. Mastra routes to memAgent
5. memAgent calls searchTool
6. searchTool queries Expo's database (via API)
7. Mastra returns response:
   { "text": "Found 3 messages about Berlin...", "results": [...] }

8. Expo app displays response
9. Response saved to local SQLite
```

---

## Stage 0 Implementation Plan

### Week 1: Setup
```bash
# 1. Create Mastra backend
npm create mastra@latest echo-backend
cd echo-backend

# 2. Create Expo app
npx create-expo-app echo-app
cd echo-app
npm install react-native-gifted-chat zustand axios
```

### Week 2: Build Agents
```typescript
// echo-backend/src/agents/mem-agent.ts
import { Agent } from "@mastra/core/agent"
import { searchTool } from "../tools/search-tool"

export const memAgent = new Agent({
  name: "Memory Agent",
  instructions: "You search through the user's message history...",
  model: "gpt-4o-mini",
  tools: { searchTool }
})

// echo-backend/src/tools/search-tool.ts
import { createTool } from "@mastra/core/tools"

export const searchTool = createTool({
  id: "search-messages",
  description: "Search user's messages",
  inputSchema: z.object({
    query: z.string(),
    userId: z.string()
  }),
  execute: async ({ query, userId }) => {
    // Query user's local messages via API or database
    return { results: [...] }
  }
})
```

### Week 3: Connect Expo to Mastra
```typescript
// echo-app/src/api/mastra.ts
export async function callAgent(agentId: string, query: string) {
  const response = await fetch('http://localhost:3000/api/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId, query })
  })
  return response.json()
}

// echo-app/src/screens/ChatScreen.tsx
const onSend = async (message) => {
  // Save locally
  saveMessageToSQLite(message)

  // Call Mastra
  const response = await callAgent('mem', message.text)

  // Display response
  addMessage(response)
}
```

### Week 4: Polish + Deploy
- Deploy Mastra to Railway/Render
- Update Expo app to call production API
- Test on physical device
- Demo ready

---

## Pros & Cons

### ✅ Pros

**Development Speed:**
- Don't reinvent agent orchestration
- Studio UI for testing (huge time saver)
- MCP integrations (Gmail, Calendar work out-of-box)

**Flexibility:**
- Easy to add agents (just create new Agent instance)
- Switch LLM providers (no vendor lock-in)
- Built-in observability

**Scalability:**
- Mastra handles concurrent agent calls
- Production-ready (created by Gatsby team)
- Can scale to Stage 2/3 (shared spaces, multi-user)

### ❌ Cons

**Complexity:**
- Requires backend deployment (not just Expo app)
- More moving parts (Expo + Mastra server)
- Initial setup more complex than pure Expo

**Cost:**
- Need to host Mastra server (~$5-20/month)
- LLM API costs (OpenAI/Anthropic)

**Local-First Compromise:**
- Agents run on server, not device
- Requires internet connection
- Privacy: messages sent to Mastra server (can encrypt)

---

## Alternative: Pure Expo (No Mastra)

If you want simpler:

```typescript
// Minimal agent routing (no Mastra)
async function callAgent(query: string) {
  if (query.startsWith('@mem')) {
    return searchLocalSQLite(query)
  } else if (query.startsWith('@cal')) {
    return handleCalendar(query)
  } else {
    return callOpenAI(query)
  }
}
```

**Pros:**
- Simpler (no backend needed initially)
- True local-first
- Cheaper (no server costs)

**Cons:**
- Reinventing agent orchestration
- No visual dashboard
- Manual LLM integration
- Harder to scale to Stage 2

---

## Final Recommendation

### ✅ Use Mastra IF:

- You're comfortable deploying a backend
- You want rapid development (Studio UI is huge)
- You plan to scale to Stage 2+ (server needed anyway)
- You value flexibility (easy to add agents/integrations)

### ❌ Skip Mastra IF:

- You want pure local-first (Stage 0 only)
- You want to avoid deployment complexity
- You're okay building agent routing yourself
- Budget is tight (avoid server costs)

---

## My Recommendation for You

**START with Mastra** for these reasons:

1. **Speed:** Studio UI will save you weeks of debugging
2. **Scalability:** You need a backend in Stage 2 anyway (shared spaces)
3. **Integrations:** MCP gives you Gmail/Calendar for free
4. **Flexibility:** Easy to add @travel, @finance agents later
5. **Observability:** See exactly what agents are doing

**Compromise on "local-first" for Stage 0:**
- Messages still stored locally (SQLite on device)
- Agent reasoning happens on server (necessary for good LLMs anyway)
- Can add local LLM fallback later

**Deployment:**
- Use Railway.app (free tier for development)
- Upgrade when you hit 500 users (Stage 0 complete)

---

## Next Steps

### Option A: Mastra + Expo (Recommended)
1. Generate Mastra backend structure
2. Create @mem agent with search tool
3. Generate Expo app with chat UI
4. Connect Expo → Mastra API
5. Ship in 3-4 weeks

### Option B: Pure Expo (Simpler)
1. Generate Expo app only
2. Build minimal agent routing (if/else)
3. Direct OpenAI API calls from Expo
4. Ship in 2 weeks (but less scalable)

**Which do you prefer?**

---

**Last Updated:** 2025-12-03
**Status:** Ready to implement
