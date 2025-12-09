# LifeOS Hosted Architecture (MVP)

**Decision Date:** 2025-12-07
**Status:** Active Development

---

## Architecture Pivot

**FROM:** Local-first iOS app with SQLite + CloudKit sync
**TO:** Hosted backend (VPS) + Neon PostgreSQL + Mobile clients

## Why This Change?

1. **Unified Chat Interface First**: Single database = single source of truth
2. **Faster MVP**: Skip complex local sync, encryption, CloudKit
3. **Multi-device Ready**: Access from phone, web, desktop immediately
4. **Simpler Testing**: One backend to test against
5. **Standard Stack**: Easier to hire, maintain, scale

---

## New Architecture

```
┌─────────────────┐
│  Mobile App     │ (React Native Expo)
│  (iOS/Android)  │
└────────┬────────┘
         │
         │ HTTPS/REST
         │
┌────────▼────────┐
│  VPS Backend    │ (Node.js + Mastra)
│  - API Server   │
│  - Mastra Agents│ (@mail, @cal, @mem)
│  - Auth/Sessions│
└────────┬────────┘
         │
         │ PostgreSQL Connection
         │
┌────────▼────────┐
│  Neon DB        │ (PostgreSQL - Hosted)
│  - messages     │
│  - users        │
│  - agent_state  │
│  - sessions     │
└─────────────────┘
```

---

## Database Schema (Neon PostgreSQL)

### Core Tables

```sql
-- Users (simple auth for MVP)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100),
  password_hash VARCHAR(255), -- bcrypt
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages (unified chat)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
  agent_name VARCHAR(50), -- '@mail', '@cal', '@mem', or null
  metadata JSONB, -- attachments, tool results, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent State (memory, context)
CREATE TABLE agent_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  agent_name VARCHAR(50) NOT NULL,
  state_data JSONB NOT NULL, -- agent-specific state
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, agent_name)
);

-- Sessions (optional - for multi-device)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_user_created ON messages(user_id, created_at DESC);
CREATE INDEX idx_messages_agent ON messages(agent_name, created_at DESC);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user ON sessions(user_id);
```

---

## Backend API (Mastra on VPS)

### Tech Stack
- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Database:** Neon PostgreSQL (via @neondatabase/serverless)
- **Agents:** Mastra framework
- **Auth:** JWT (simple for MVP)

### API Endpoints

```
POST   /api/auth/register     - Create user
POST   /api/auth/login        - Login, get JWT
POST   /api/auth/logout       - Invalidate session

GET    /api/messages          - Get chat history
POST   /api/messages          - Send message (triggers agent)

GET    /api/agents            - List available agents
POST   /api/agents/:name/chat - Chat with specific agent

GET    /api/health            - Health check
```

### Environment Variables

```bash
# Neon Database
DATABASE_URL=postgresql://user:pass@host.neon.tech/dbname?sslmode=require

# OpenAI (for agents)
OPENAI_API_KEY=sk-...

# Gmail OAuth (for @mail agent)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://yourvps.com/auth/google/callback

# JWT Secret
JWT_SECRET=your-secret-key

# Server
PORT=3001
NODE_ENV=production
```

---

## Frontend (Expo App)

### Configuration

```javascript
// config.js
export const API_URL = __DEV__
  ? 'http://localhost:3001/api'  // Development
  : 'https://your-vps.com/api';   // Production
```

### Key Changes
- Remove local SQLite
- Remove CloudKit sync
- Add API client for backend
- Add JWT storage (AsyncStorage)
- Simple chat UI → POST to /api/messages

---

## Deployment

### VPS Options (Choose One)
1. **Railway** (easiest) - $5/month, auto-deploy from GitHub
2. **Fly.io** - $5/month, Docker-based
3. **DigitalOcean** - $6/month droplet, manual setup
4. **Render** - Free tier available

### Deployment Steps (Railway Example)

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Create project
cd echo-mvp/mastra-backend
railway init

# 4. Add Neon database connection
railway variables set DATABASE_URL="postgresql://..."

# 5. Deploy
railway up
```

---

## Migration Path (Old → New)

### Remove
- ❌ `ios/` directory (Swift/SwiftUI prototype)
- ❌ Local SQLite setup
- ❌ GRDB/SQLCipher
- ❌ CloudKit sync code
- ❌ Local LLM integration

### Keep
- ✅ `echo-mvp/mastra-backend/` (adapt for Neon)
- ✅ `echo-mvp/expo-app/` (update API client)
- ✅ Agent logic (@mail, @cal, @mem)
- ✅ Mastra framework

### Add
- ➕ Neon PostgreSQL schema
- ➕ User authentication (JWT)
- ➕ API middleware (auth, rate limiting)
- ➕ Deployment configs (Dockerfile, railway.json)

---

## Autonomous Builder Focus

The autonomous agent will now focus on:

1. **Database Setup**
   - Create Neon schema
   - Add migrations
   - Seed test data

2. **Backend API**
   - Connect to Neon
   - Implement auth endpoints
   - Implement message endpoints
   - Update agent routing for DB storage

3. **Frontend Updates**
   - Remove local DB code
   - Add API client
   - Add auth flow (login/register)
   - Update chat UI to use API

4. **Deployment**
   - Create Dockerfile
   - Set up Railway/Fly.io config
   - Environment variable management
   - Deploy and test

5. **Testing**
   - End-to-end chat flow
   - Agent @mention routing
   - Multi-device access
   - Error handling

---

## Success Criteria (Hosted MVP)

### Technical
- ✅ Backend deployed on VPS
- ✅ Neon database connected
- ✅ API endpoints working
- ✅ Frontend connects to backend
- ✅ Messages persist to database
- ✅ @mail agent functional

### User Experience
- ✅ Register/login works
- ✅ Chat interface loads
- ✅ Send message → get response
- ✅ @mail mentions route correctly
- ✅ Works on multiple devices

### Performance
- ✅ API response < 500ms
- ✅ Agent response < 5s
- ✅ No database connection issues
- ✅ Handle 10+ concurrent users

---

## Next Steps

1. Get Neon connection string from user
2. Update Mastra backend to use Neon
3. Create database schema
4. Deploy backend to VPS
5. Update frontend to connect
6. Test end-to-end

---

**Last Updated:** 2025-12-07
**Architecture Version:** 2.0 (Hosted-First)
