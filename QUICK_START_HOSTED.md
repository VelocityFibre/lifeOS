# Quick Start: LifeOS Hosted Architecture

**Last Updated:** 2025-12-07

---

## Setup in 5 Steps

### 1. Set Up Neon Database

```bash
cd echo-mvp/database

# Set your Neon connection string
export DATABASE_URL='postgresql://neondb_owner:npg_JiIY5sDx6GBP@ep-curly-meadow-a9of4iv6-pooler.gwc.azure.neon.tech/neondb?sslmode=require'

# Run the setup script (creates all tables)
./setup.sh
```

**Verify it worked:**
```bash
psql "$DATABASE_URL" -c "SELECT * FROM users;"
```

You should see the test user: `test@lifeos.dev`

---

### 2. Configure Backend

```bash
cd ../mastra-backend

# Copy environment variables
cp .env.production .env

# Edit .env and add your API keys:
nano .env
# - Add your OPENAI_API_KEY
# - Add Google OAuth credentials (if you have them)
# - Change JWT_SECRET to something random

# Install dependencies
npm install

# Add Neon PostgreSQL client
npm install @neondatabase/serverless
npm install pg
npm install jsonwebtoken bcryptjs
npm install express cors dotenv
```

---

### 3. Start Backend (Manual Test)

```bash
# From mastra-backend directory
npm run api

# Backend should start on http://localhost:3001
```

Test it:
```bash
curl http://localhost:3001/health
```

---

### 4. Start Autonomous Builder

**Option A: Simple (Recommended)**
```bash
cd /home/louisdup/Agents/lifeOS

# Run indefinitely until MVP complete
./start-hosted-builder.sh
```

**Option B: Targeted Agent**
```bash
# Run specific agent for limited iterations
./start-hosted-builder.sh --agent database --max-iterations 5
./start-hosted-builder.sh --agent backend --max-iterations 10
./start-hosted-builder.sh --agent frontend --max-iterations 5
```

**Option C: Manual Python**
```bash
python3 autonomous-lifeos-builder.py --agent orchestrator
```

---

### 5. Monitor Progress

**Check logs:**
```bash
# Real-time
tail -f echo-mvp/logs/orchestrator-session-*.txt

# Progress file
cat echo-mvp/claude-progress.txt

# Backend logs (if running)
# Check the terminal where npm run api is running
```

**Check database:**
```bash
# See all messages
psql "$DATABASE_URL" -c "SELECT * FROM messages ORDER BY created_at DESC LIMIT 10;"

# See recent activity
psql "$DATABASE_URL" -c "SELECT * FROM recent_messages;"
```

---

## What the Autonomous Builder Will Do

The orchestrator agent will automatically:

1. **Database Layer** (Iterations 1-3)
   - Create database connection module
   - Add migration scripts
   - Test connection to Neon
   - Create seed data

2. **Backend API** (Iterations 4-10)
   - Set up Express server
   - Create auth endpoints (register/login)
   - Create message endpoints (GET/POST)
   - Add JWT middleware
   - Update agent routing to use database

3. **Email Agent** (Iterations 11-15)
   - Update to use PostgreSQL instead of LibSQL
   - Store conversations in database
   - Test with Gmail OAuth

4. **Frontend** (Iterations 16-20)
   - Remove local SQLite code
   - Create API client
   - Add auth screens
   - Update chat UI to use API
   - Test end-to-end

5. **Testing & Polish** (Iterations 21+)
   - End-to-end testing
   - Bug fixes
   - Error handling
   - Performance optimization

---

## Expected Timeline

- **Setup (Steps 1-2):** 10 minutes (manual)
- **Autonomous Build:** 2-4 hours (automatic)
- **Total:** ~4 hours to working MVP

The agent runs continuously with 5-second pauses between iterations.

---

## Manual Verification Points

After the autonomous builder runs, test these manually:

### Test 1: Auth Works
```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"test123"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"test123"}'
```

### Test 2: Messages Work
```bash
# Get token from login response, then:
curl http://localhost:3001/api/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Send message
curl -X POST http://localhost:3001/api/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello lifeOS!"}'
```

### Test 3: Agents Work
```bash
# Send @mail mention
curl -X POST http://localhost:3001/api/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"@mail show my unread emails"}'
```

---

## Stopping the Agent

The autonomous builder runs indefinitely. To stop:

```bash
# Press Ctrl+C in the terminal
# Or kill the process:
pkill -f "autonomous-lifeos-builder.py"
```

---

## Next Steps After Build Complete

1. **Test Locally**
   - Start backend: `npm run api`
   - Start frontend: `cd expo-app && npx expo start`
   - Test on phone/simulator

2. **Deploy to VPS**
   - See [HOSTED_ARCHITECTURE.md](HOSTED_ARCHITECTURE.md) for deployment options
   - Railway, Fly.io, or DigitalOcean

3. **Add Your Data**
   - Configure Gmail OAuth
   - Connect Google Calendar
   - Add your own test data

---

## Troubleshooting

**Database connection fails:**
```bash
# Test connection directly
psql "$DATABASE_URL" -c "SELECT NOW();"
```

**Backend won't start:**
```bash
# Check port not in use
lsof -i :3001

# Kill if needed
kill -9 $(lsof -t -i :3001)
```

**Autonomous builder errors:**
```bash
# Check Python environment
which python3
python3 -c "import claude_code_sdk"

# Check harness exists
ls ~/claude-quickstarts/autonomous-coding/
```

---

## Files Created

After setup, you'll have:

```
echo-mvp/
├── database/
│   ├── schema.sql           ✅ Created
│   ├── setup.sh             ✅ Created
│   └── .env.example         ✅ Created
├── mastra-backend/
│   ├── .env.production      ✅ Created
│   ├── .env                 ⏳ Will be created by builder
│   ├── src/
│   │   ├── db/              ⏳ Will be created by builder
│   │   ├── api/             ⏳ Will be created by builder
│   │   └── middleware/      ⏳ Will be created by builder
│   └── package.json         ⏳ Will be updated by builder
├── expo-app/
│   └── (will be updated)    ⏳ Will be updated by builder
└── logs/
    └── orchestrator-session-*.txt  ⏳ Created during build
```

---

## Success Criteria

You'll know it's working when:

✅ Database tables exist in Neon
✅ Backend starts without errors
✅ `/health` endpoint responds
✅ Can register and login
✅ Messages save to database
✅ @mail agent responds
✅ Frontend connects to backend
✅ End-to-end chat works

---

**Ready to build? Run: `./start-hosted-builder.sh`**
