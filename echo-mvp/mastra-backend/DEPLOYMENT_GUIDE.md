# LifeOS (Echo) - Deployment Guide

**Version:** 2.0 (Hosted Architecture)
**Date:** December 7, 2025
**Status:** Ready for deployment (75% complete)

---

## 🎯 Current Status

### ✅ Completed (6/8 milestones)
- [x] Neon PostgreSQL schema designed (`schema.sql`)
- [x] Database connection module created (`src/db/index.ts`)
- [x] Backend authentication endpoints (register/login/logout)
- [x] Message persistence endpoints (GET/POST `/api/messages`)
- [x] Frontend JWT authentication integrated
- [x] Unified chat interface working

### ⬜ Remaining (2/8 milestones)
- [ ] **Database configured with real Neon connection** ← BLOCKER
- [ ] **End-to-end testing** (requires database)
- [ ] VPS deployment
- [ ] Multi-device testing

---

## 🚀 Quick Start (Development)

### Prerequisites
- Node.js 20+ installed
- Neon PostgreSQL account (free tier: https://neon.tech)
- OpenAI API key (for AI agents)

### Step 1: Clone and Install

```bash
cd /home/louisdup/Agents/lifeOS/echo-mvp/mastra-backend
npm install
```

### Step 2: Configure Environment

Create `.env` file with the following (see `.env.example`):

```bash
# ============================================
# NEON DATABASE (PostgreSQL) - REQUIRED
# ============================================
DATABASE_URL=postgresql://user:password@ep-xxx-xxx.region.neon.tech/dbname?sslmode=require

# ============================================
# OPENAI API - REQUIRED
# ============================================
OPENAI_API_KEY=sk-...

# ============================================
# JWT AUTHENTICATION - REQUIRED
# ============================================
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-secret-key-here-change-in-production

# ============================================
# GOOGLE OAUTH (Gmail Integration) - OPTIONAL FOR MVP
# ============================================
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback

# ============================================
# SERVER CONFIGURATION
# ============================================
API_PORT=3001
NODE_ENV=development
```

### Step 3: Set Up Database

Follow the detailed instructions in `DATABASE_SETUP.md`:

```bash
# Test database connection
npm run db:test

# Create schema (tables, indexes, triggers)
npm run db:setup
```

You should see:
```
✅ Tables created:
   - users
   - messages
   - agent_state
   - sessions
   - oauth_tokens
   - schema_version
```

### Step 4: Start Backend

```bash
npm run api
```

Expected output:
```
🚀 API server running on http://localhost:3001
✅ Database connected
📊 Mastra agents initialized: @mail, @cal, @mem
```

### Step 5: Start Frontend

In a new terminal:

```bash
cd /home/louisdup/Agents/lifeOS/echo-mvp/expo-app
npm install
npx expo start
```

Press `i` for iOS simulator or `a` for Android emulator.

---

## 🗄️ Database Setup (Neon PostgreSQL)

### Why Neon?
- ✅ Serverless PostgreSQL (auto-scales)
- ✅ Free tier: 0.5 GB storage
- ✅ Built-in connection pooling
- ✅ Automatic backups
- ✅ Low latency globally

### Getting Your Connection String

1. **Create Account**: https://neon.tech
2. **Create Project**: Click "Create a project"
   - Name: `lifeos-echo`
   - Region: Choose closest to you
   - PostgreSQL version: 16
3. **Copy Connection String**:
   - Go to "Connection Details"
   - Copy the PostgreSQL connection string
   - It looks like: `postgresql://user:pass@ep-xxx.region.neon.tech/dbname?sslmode=require`
4. **Add to `.env`**:
   ```bash
   DATABASE_URL=postgresql://...
   ```

### Running Setup Scripts

```bash
# Install dependencies (includes pg, bcrypt, jsonwebtoken)
npm install

# Test connection
npm run db:test

# Create schema
npm run db:setup
```

**Troubleshooting**:
- `ECONNREFUSED`: Check your `DATABASE_URL` is correct
- `SSL required`: Ensure `?sslmode=require` is in the URL
- `Too many connections`: Close unused connections (pool limit: 20)

See `DATABASE_SETUP.md` for full details.

---

## 🔐 Authentication Setup

### JWT Secret

Generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add to `.env`:
```bash
JWT_SECRET=<generated-secret>
```

### Google OAuth (Optional for MVP)

Gmail integration requires OAuth setup:

1. **Create Google Cloud Project**: https://console.cloud.google.com
2. **Enable Gmail API**
3. **Create OAuth 2.0 Credentials**:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3001/auth/google/callback`
4. **Add to `.env`**:
   ```bash
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```

**Note**: Gmail integration is optional for MVP. The app works without it (uses mock data in development mode).

---

## 🧪 Testing

### Backend API Endpoints

Health check:
```bash
curl http://localhost:3001/api/health
```

Register user:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","username":"Test User"}'
```

Login:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Send message (requires JWT token from login):
```bash
curl -X POST http://localhost:3001/api/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{"message":"Hello @mail, show me my emails"}'
```

### End-to-End Testing

1. Start backend: `npm run api`
2. Start frontend: `npx expo start` (in expo-app directory)
3. Register a new user in the app
4. Send a test message
5. Verify message appears in database:
   ```sql
   SELECT * FROM messages ORDER BY created_at DESC LIMIT 5;
   ```

---

## 🚢 Production Deployment

### Deployment Options

**Recommended**: Railway (easiest)
- ✅ Auto-deploy from GitHub
- ✅ $5/month
- ✅ Built-in PostgreSQL option (or use Neon)
- ✅ Automatic SSL

**Alternatives**:
- Fly.io ($5/month, Docker-based)
- DigitalOcean ($6/month droplet)
- Render (free tier available)

### Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd /home/louisdup/Agents/lifeOS/echo-mvp/mastra-backend
railway init

# Set environment variables
railway variables set DATABASE_URL="postgresql://..."
railway variables set OPENAI_API_KEY="sk-..."
railway variables set JWT_SECRET="<generated-secret>"
railway variables set NODE_ENV="production"

# Deploy
railway up
```

Railway will give you a public URL like: `https://your-app.up.railway.app`

### Update Frontend Configuration

Update `expo-app/src/api/auth.ts` and `expo-app/src/api/mastra.ts`:

```typescript
export const API_URL = __DEV__
  ? 'http://localhost:3001/api'
  : 'https://your-app.up.railway.app/api'; // Your Railway URL
```

### Environment Variables (Production)

**Required**:
- `DATABASE_URL` - Neon connection string
- `OPENAI_API_KEY` - OpenAI API key
- `JWT_SECRET` - Random 32-byte hex string
- `NODE_ENV` - Set to `production`
- `API_PORT` - Default 3001

**Optional**:
- `GOOGLE_CLIENT_ID` - For Gmail OAuth
- `GOOGLE_CLIENT_SECRET` - For Gmail OAuth
- `GOOGLE_REDIRECT_URI` - Update to production URL

---

## 📊 Architecture Overview

```
┌─────────────────┐
│  Mobile App     │ (React Native Expo)
│  (iOS/Android)  │
└────────┬────────┘
         │
         │ HTTPS/REST (JWT Auth)
         │
┌────────▼────────┐
│  VPS Backend    │ (Node.js + Express + Mastra)
│  - Auth API     │ /api/auth/register, /login, /logout
│  - Messages API │ /api/messages (GET/POST)
│  - Agents       │ @mail, @cal, @mem
└────────┬────────┘
         │
         │ PostgreSQL Connection
         │
┌────────▼────────┐
│  Neon DB        │ (PostgreSQL - Hosted)
│  - users        │
│  - messages     │
│  - agent_state  │
│  - sessions     │
│  - oauth_tokens │
└─────────────────┘
```

### Database Schema

See `schema.sql` for full schema. Key tables:

- **users**: User accounts (email, password_hash)
- **messages**: Chat history (user_id, content, role, agent_name)
- **sessions**: JWT sessions (token, expires_at)
- **agent_state**: Agent memory (user_id, agent_name, state_data)
- **oauth_tokens**: Gmail OAuth tokens (user_id, access_token, refresh_token)

### API Endpoints

**Authentication**:
- `POST /api/auth/register` - Create user
- `POST /api/auth/login` - Login, get JWT
- `POST /api/auth/logout` - Invalidate session

**Messages** (requires JWT):
- `GET /api/messages?limit=50&offset=0` - Get chat history
- `POST /api/messages` - Send message, get AI response

**Health**:
- `GET /api/health` - Health check

---

## 🔧 Troubleshooting

### Backend won't start

**Error**: `DATABASE_URL environment variable is not set`
- **Solution**: Add `DATABASE_URL` to `.env` file (see Step 2 above)

**Error**: `Database connection failed`
- Check your Neon connection string is correct
- Ensure `?sslmode=require` is in the URL
- Test connection: `npm run db:test`

### Frontend can't connect to backend

**Error**: `Network request failed`
- Ensure backend is running: `npm run api`
- Check API_URL in `src/api/auth.ts` and `src/api/mastra.ts`
- For iOS simulator: use `http://localhost:3001`
- For Android emulator: use `http://10.0.2.2:3001`
- For physical device: use your computer's local IP

### Authentication errors

**Error**: `Invalid or expired token`
- Token may have expired (7-day expiry)
- User needs to log in again
- Check `JWT_SECRET` is set in `.env`

**Error**: `User already exists`
- Email is already registered
- Use a different email or log in instead

### Gmail integration not working

**Note**: Gmail integration requires OAuth setup (optional for MVP)
- Backend works without Gmail OAuth
- Uses mock data in development mode
- See "Google OAuth" section above for setup

---

## 📝 Next Steps

### Before Production Launch

- [ ] Set up Neon database with production connection string
- [ ] Generate secure JWT_SECRET for production
- [ ] Test full registration → login → message flow
- [ ] Deploy backend to Railway/Fly.io/DigitalOcean
- [ ] Update frontend API_URL to production URL
- [ ] Test multi-device access
- [ ] Set up monitoring (Sentry, LogRocket, etc.)
- [ ] Enable Neon backups
- [ ] Add rate limiting (express-rate-limit)
- [ ] Implement refresh tokens for JWT

### Optional Enhancements

- [ ] Gmail OAuth integration (@mail agent)
- [ ] Calendar integration (@cal agent)
- [ ] Memory/search agent (@mem agent)
- [ ] Email verification on registration
- [ ] Password reset flow
- [ ] Push notifications
- [ ] Web app (React PWA)

---

## 📞 Support

### Documentation
- Main spec: `/docs/stage-0-spec.md`
- Architecture: `HOSTED_ARCHITECTURE.md`
- Database setup: `DATABASE_SETUP.md`
- Implementation status: `IMPLEMENTATION_STATUS.md`

### Logs
- Backend logs: Console output from `npm run api`
- Frontend logs: Expo DevTools console
- Database logs: Neon dashboard

### Common Commands

```bash
# Backend
npm run api          # Start API server
npm run db:test      # Test database connection
npm run db:setup     # Create database schema
npm run dev          # Start Mastra dev server

# Frontend
npx expo start       # Start Expo dev server
npx expo start -c    # Clear cache and start
```

---

**Last Updated**: December 7, 2025
**Architecture Version**: 2.0 (Hosted-First)
**Completion**: 75% (6/8 milestones)
