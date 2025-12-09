# Personal OS - Product Documentation

> A single, end-to-end encrypted, WhatsApp-style app that serves as your personal operating system.

---

## 📋 Documentation Index

### Core Specifications

1. **[SPEC.md](SPEC.md)** - Main product specification
   - Vision & strategy
   - 4-stage rollout plan
   - Success metrics & monetization
   - Competitive positioning

### Stage Specifications

2. **[Stage 0: Solo Mode](docs/stage-0-spec.md)** (Months 1–4)
   - MVP features (chat + 3 core agents)
   - 0 → 1,000 users, $10k MRR
   - Local-first, single-user focus

3. **[Stage 1: Power User](docs/stage-1-spec.md)** (Months 5–9)
   - Premium agents (travel, finance, health, tasks)
   - 1k → 20k users, $200k MRR
   - Android launch

4. **[Stage 2: Shared Spaces](docs/stage-2-spec.md)** (Months 10–18)
   - Limited multiplayer via workspaces
   - 20k → 200k users, $1M+ MRR
   - Web app (PWA)

5. **[Stage 3: Full Messenger](docs/stage-3-spec.md)** (Year 2–3)
   - Complete WhatsApp replacement
   - 200k → 1M+ users, $10M+ ARR
   - Voice/video calls, channels, marketplace

### Technical Documentation

6. **[Technical Architecture](docs/architecture.md)**
   - System design (all stages)
   - Data models & encryption
   - Infrastructure & scaling
   - Security & monitoring

7. **[Feature Prioritization](docs/prioritization.md)**
   - RICE scoring framework
   - Build order & trade-offs
   - Kill criteria & quarterly reviews
   - 18-month roadmap

### Hosted Architecture (Current)

8. **[Hosted Architecture Spec](HOSTED_ARCHITECTURE.md)** - NEW!
   - VPS backend + Neon PostgreSQL architecture
   - Database schema design
   - API endpoints specification
   - Deployment strategy

9. **[Database Setup Guide](echo-mvp/mastra-backend/DATABASE_SETUP.md)**
   - Neon PostgreSQL account setup
   - Schema creation instructions
   - Connection testing

10. **[Deployment Guide](echo-mvp/mastra-backend/DEPLOYMENT_GUIDE.md)** - NEW!
    - Quick start guide
    - Environment configuration
    - Production deployment (Railway/Fly.io)
    - Testing procedures

---

## 🎯 Quick Start

### For Product/Business

1. Read [SPEC.md](SPEC.md) for overall vision
2. Read [Stage 0 spec](docs/stage-0-spec.md) for immediate next steps
3. Review [prioritization framework](docs/prioritization.md) for decision-making

### For Engineering

1. Read [architecture.md](docs/architecture.md) for technical design
2. Read [Stage 0 spec](docs/stage-0-spec.md) for MVP scope
3. Review code structure & data models in architecture doc

### For Design

1. Read [Stage 0 spec](docs/stage-0-spec.md) for UX flows
2. Review agent interaction patterns
3. Check visual style requirements

---

## 🚀 Current Status

- **Stage:** Stage 0 (Solo Mode) - Development Phase
- **Architecture:** HOSTED (VPS + Neon PostgreSQL) - **PIVOT from local-first**
- **Progress:** 75% complete (6/8 hosted MVP milestones)
- **Next Milestone:** Configure Neon database and deploy backend
- **Launch Target:** Production deployment in 2–3 weeks
- **Working Name:** Echo/Lark (LifeOS)

### Implementation Progress (Hosted MVP)

- ✅ Complete product specifications (8 docs including deployment guide)
- ✅ Neon PostgreSQL schema designed (users, messages, sessions, agent_state, oauth_tokens)
- ✅ Backend authentication API (JWT-based register/login/logout)
- ✅ Message persistence endpoints (GET/POST /api/messages)
- ✅ Frontend JWT authentication integrated (login/register UI)
- ✅ Unified chat interface working (React Native Expo)
- 🚧 **DATABASE CONFIGURATION** ← BLOCKER (needs Neon connection string)
- 🚧 End-to-end testing (blocked by database setup)
- ⏳ VPS deployment (Railway/Fly.io/DigitalOcean)
- ⏳ Multi-device testing

**See [DEPLOYMENT_GUIDE.md](echo-mvp/mastra-backend/DEPLOYMENT_GUIDE.md) for setup instructions.**

See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for detailed progress.

---

## 📊 Key Metrics (Targets)

| Stage | Timeline | Users | MRR | Retention |
|-------|----------|-------|-----|-----------|
| 0 | Month 3 | 1,000 | $10k | 60% (week 1) |
| 1 | Month 9 | 15,000 | $200k | 70% (month 1) |
| 2 | Month 18 | 100,000 | $1M | 80% (month 1) |
| 3 | Year 3 | 1M+ | $10M+ | 85% (month 1) |

---

## 🛠️ Tech Stack (Stage 0 - Hosted MVP)

**Current Architecture (Hosted-First)**:
- **Frontend:** React Native Expo (iOS/Android)
- **Backend:** Node.js + Express.js + Mastra framework
- **Database:** Neon PostgreSQL (serverless)
- **Authentication:** JWT tokens (bcrypt password hashing)
- **AI:** GPT-4o-mini (OpenAI)
- **Deployment:** Railway/Fly.io/DigitalOcean
- **API:** REST (JSON)

**Previous Architecture (Local-First - DEPRECATED)**:
- ~~iOS 17+ SwiftUI~~
- ~~SQLite (SQLCipher)~~
- ~~CloudKit sync~~
- ~~Local LLM (Llama 3.2)~~

---

## 📝 Document Status

| Document | Status | Last Updated |
|----------|--------|--------------|
| SPEC.md | ✅ Complete | 2025-12-02 |
| stage-0-spec.md | ✅ Complete | 2025-12-02 |
| stage-1-spec.md | ✅ Complete | 2025-12-02 |
| stage-2-spec.md | ✅ Complete | 2025-12-02 |
| stage-3-spec.md | ✅ Complete | 2025-12-02 |
| architecture.md | ✅ Complete | 2025-12-02 |
| prioritization.md | ✅ Complete | 2025-12-02 |
| HOSTED_ARCHITECTURE.md | ✅ Complete | 2025-12-07 |
| DATABASE_SETUP.md | ✅ Complete | 2025-12-07 |
| DEPLOYMENT_GUIDE.md | ✅ Complete | 2025-12-07 |
| IMPLEMENTATION_STATUS.md | ✅ Complete | 2025-12-07 |

---

## 💻 Code Structure (Hosted MVP)

### Backend (`/echo-mvp/mastra-backend/`)

```
mastra-backend/
├── src/
│   ├── api/
│   │   ├── server.ts         # Express server + routes
│   │   └── auth.ts           # Authentication endpoints
│   ├── db/
│   │   └── index.ts          # Neon PostgreSQL connection
│   ├── agents/
│   │   ├── email-agent.ts    # @mail agent (Gmail)
│   │   ├── calendar-agent.ts # @cal agent
│   │   └── memory-agent.ts   # @mem agent
│   └── tools/
│       └── gmail-tools.ts    # Gmail API integration
├── schema.sql                # Database schema
├── package.json              # Dependencies
├── .env.example              # Environment template
└── DEPLOYMENT_GUIDE.md       # Setup instructions
```

### Frontend (`/echo-mvp/expo-app/`)

```
expo-app/
├── src/
│   ├── screens/
│   │   ├── ChatScreen.tsx    # Main chat interface
│   │   └── AuthScreen.tsx    # Login/register
│   ├── store/
│   │   └── chatStore.ts      # Zustand state management
│   ├── api/
│   │   ├── auth.ts           # Auth API client
│   │   └── mastra.ts         # Message API client
│   └── components/
│       └── *.tsx             # Reusable components
├── App.tsx                   # App entry point
└── package.json              # Dependencies
```

See [DEPLOYMENT_GUIDE.md](echo-mvp/mastra-backend/DEPLOYMENT_GUIDE.md) for setup.

---

## 🔒 Principles (Non-Negotiable)

1. **Privacy First** - E2E encryption, zero-knowledge server
2. **Local-First** - Data lives on device
3. **No Ads** - Subscription-only monetization
4. **Quality > Speed** - 3 great agents > 10 mediocre ones
5. **User-Controlled** - No lock-in, export anytime

---

## 📧 Contact

- **Owner:** [TBD]
- **Feedback:** [TBD]
- **Repository:** [TBD]

---

**Built with [spec-kit](https://github.github.io/spec-kit/) philosophy**
