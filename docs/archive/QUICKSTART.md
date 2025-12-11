# LifeOS - Quick Start Guide

**Last Updated:** December 7, 2025
**Architecture:** Hosted (VPS + Neon PostgreSQL)
**Status:** 75% Complete - Database configuration required

---

## ⚡ TL;DR - What You Need to Do

The app is **75% complete** but needs **database configuration** to run.

### Critical Next Step (5 minutes):

1. **Get Neon PostgreSQL connection string**:
   - Sign up at https://neon.tech (free tier)
   - Create a project called "lifeos-echo"
   - Copy the connection string (looks like `postgresql://user:pass@...`)

2. **Configure backend**:
   ```bash
   cd echo-mvp/mastra-backend
   # Edit .env and add:
   DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require
   JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
   ```

3. **Set up database**:
   ```bash
   npm install
   npm run db:setup
   ```

4. **Start everything**:
   ```bash
   # Terminal 1: Backend
   npm run api

   # Terminal 2: Frontend
   cd ../expo-app
   npx expo start
   ```

**Done!** The app will be running on your device/simulator.

---

## 📚 Full Documentation

If you need more details, see:

- **[DEPLOYMENT_GUIDE.md](echo-mvp/mastra-backend/DEPLOYMENT_GUIDE.md)** - Complete setup guide
- **[DATABASE_SETUP.md](echo-mvp/mastra-backend/DATABASE_SETUP.md)** - Database-specific instructions
- **[HOSTED_ARCHITECTURE.md](HOSTED_ARCHITECTURE.md)** - Architecture overview
- **[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)** - Current progress

---

## 🏗️ What's Already Built (75%)

### ✅ Backend (Node.js + Express + Mastra)
- PostgreSQL schema designed (6 tables)
- Authentication API (JWT-based)
  - `POST /api/auth/register` - Create user
  - `POST /api/auth/login` - Login
  - `POST /api/auth/logout` - Logout
- Message API
  - `GET /api/messages` - Get chat history
  - `POST /api/messages` - Send message, get AI response
- Database connection module (Neon PostgreSQL)
- @mail, @cal, @mem agents (Mastra framework)

### ✅ Frontend (React Native Expo)
- Login/Register screen
- Chat interface (unified messages)
- JWT token management
- Message history loading
- User authentication flow
- Backend status indicator

### ⬜ Still Need (25%)
- **Database connection** ← YOU ARE HERE
- End-to-end testing
- VPS deployment (Railway/Fly.io)
- Multi-device testing

---

## 🐛 Troubleshooting

### "Backend won't start"
**Error**: `DATABASE_URL environment variable is not set`

**Fix**:
1. Create Neon account and get connection string
2. Add to `.env` file in `echo-mvp/mastra-backend/`
3. Run `npm run db:setup`

### "Frontend can't connect"
**Error**: `Network request failed`

**Fix**:
1. Make sure backend is running: `npm run api`
2. Check API_URL in `expo-app/src/api/auth.ts`:
   - iOS simulator: `http://localhost:3001`
   - Android emulator: `http://10.0.2.2:3001`
   - Physical device: Use your computer's IP address

### "Database connection failed"
**Error**: `Connection refused` or `SSL required`

**Fix**:
1. Verify your Neon connection string includes `?sslmode=require`
2. Check your internet connection
3. Run `npm run db:test` to test connection

---

## 📊 Architecture at a Glance

```
┌─────────────────┐
│   Expo App      │  React Native (iOS/Android)
│  (expo-app/)    │  - Login/Register UI
└────────┬────────┘  - Chat interface
         │           - JWT token storage
         │
         │ HTTPS REST API (JWT Auth)
         │
┌────────▼────────┐
│  Backend API    │  Node.js + Express + Mastra
│ (mastra-backend)│  - Auth endpoints
└────────┬────────┘  - Message endpoints
         │           - AI agents (@mail/@cal/@mem)
         │
         │ PostgreSQL
         │
┌────────▼────────┐
│   Neon DB       │  PostgreSQL (serverless)
│ (neon.tech)     │  - users, messages, sessions
└─────────────────┘  - agent_state, oauth_tokens
```

---

## 🚀 Production Deployment (Later)

Once you've tested locally, deploy to production:

### Option 1: Railway (Recommended - Easiest)
```bash
npm install -g @railway/cli
railway login
railway init
railway variables set DATABASE_URL="postgresql://..."
railway up
```

### Option 2: Fly.io
```bash
fly launch
fly secrets set DATABASE_URL="postgresql://..."
fly deploy
```

### Option 3: DigitalOcean
- Manual VPS setup
- Install Node.js, PM2
- Clone repo, set env vars
- Run with PM2

See **[DEPLOYMENT_GUIDE.md](echo-mvp/mastra-backend/DEPLOYMENT_GUIDE.md)** for full instructions.

---

## 🎯 What Works Right Now

Once database is configured:

- ✅ **User Registration**: Create account with email/password
- ✅ **User Login**: Authenticate and get JWT token
- ✅ **Send Messages**: Chat with AI agents
- ✅ **@mail Agent**: Ask about emails (uses mock data for now)
- ✅ **@cal Agent**: Calendar queries (coming soon)
- ✅ **@mem Agent**: Search/memory (coming soon)
- ✅ **Message History**: All messages persist to database
- ✅ **Multi-Session**: Login from multiple devices
- ✅ **Auto-Logout**: Session expiry after 7 days

---

## 📞 Need Help?

1. **Read the docs**:
   - [DEPLOYMENT_GUIDE.md](echo-mvp/mastra-backend/DEPLOYMENT_GUIDE.md)
   - [DATABASE_SETUP.md](echo-mvp/mastra-backend/DATABASE_SETUP.md)

2. **Check troubleshooting section** (above)

3. **Review implementation status**: [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)

4. **Check backend logs**: Console output from `npm run api`

5. **Check frontend logs**: Expo DevTools console

---

## 📝 Next Steps (Priority Order)

1. ✅ **[DONE]** Backend authentication API
2. ✅ **[DONE]** Frontend authentication UI
3. ✅ **[DONE]** Message persistence
4. 🚧 **[NOW]** Configure Neon database ← **YOU ARE HERE**
5. ⬜ Test end-to-end flow
6. ⬜ Deploy to production (Railway/Fly.io)
7. ⬜ Add Gmail OAuth integration
8. ⬜ Multi-device testing
9. ⬜ Rate limiting & monitoring
10. ⬜ Launch! 🎉

---

**Last Updated:** December 7, 2025
**Completion:** 75% (6/8 milestones)
**Time to Deploy:** ~2-3 weeks (after database config)
