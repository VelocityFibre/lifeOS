# Product Specification: Personal OS

## Vision Statement

A single, end-to-end encrypted, WhatsApp-style application that serves as your personal operating system. Users chat with themselves, AI agents, and eventually friends/family. All productivity tools (email, calendar, files, tasks) are accessible through conversational agents within the chat interface.

## Core Insight

The primary value proposition is NOT messaging—it's **consolidation**. Users will adopt this because they can replace 17+ apps with a single, unified interface. Lead with the personal OS value, not the messenger features.

## Product Name

**Finalists:**
- Echo (clean, memorable, implies memory + response)
- Lark (light, fast, joyful, .com available)
- Orbit (user-centric positioning)

**Recommendation:** Launch with **Echo** or **Lark**

## Strategic Approach

### Four-Stage Rollout

#### Stage 0: Solo Mode (MVP) → 0–1,000 users
- Timeline: 3–4 months
- Focus: Single-user personal OS
- Goal: 500 paying users, $10k MRR
- No multiplayer features

#### Stage 1: Power User → 1k–20k users
- Timeline: +4–6 months
- Focus: Advanced agent ecosystem
- Goal: 15k users, $200k MRR
- Add premium agents (travel, finance, health)

#### Stage 2: Shared Spaces → 20k–200k users
- Timeline: +6–9 months
- Focus: Limited multiplayer via shared workspaces
- Goal: 100k users, $1M+ MRR
- Network effects begin

#### Stage 3: Full Messenger → 200k+ users
- Timeline: 2027+
- Focus: Complete P2P messaging platform
- Goal: $10M+ ARR
- Full WhatsApp replacement

## Success Metrics

### North Star Metric
**Daily Active Minutes per User** (target: 45+ minutes/day by Stage 1)

### Stage-Specific KPIs

**Stage 0:**
- 500 paying beta users
- 60% week-1 retention
- $10–20/month average revenue per user (ARPU)

**Stage 1:**
- 15,000 total users
- 3+ agents used per user per week
- 70% month-1 retention
- $19–39/month ARPU

**Stage 2:**
- 100,000 total users
- 2+ shared spaces per user
- 40% of users invite at least one person
- 80% month-1 retention

**Stage 3:**
- 500,000+ total users
- 50+ messages sent per user per day
- Network effect: viral coefficient >1.2

## Monetization Strategy

### Pricing Tiers

**Stage 0–1:**
- Solo: $19/month (basic agents: mem, cal, mail)
- Pro: $39/month (adds travel, finance, health agents)

**Stage 2+:**
- Individual: $19/month
- Plus: $39/month (premium agents + 5 shared spaces)
- Team: $99/month (unlimited shared spaces, admin controls)

### Revenue Projections

| Stage | Timeline | Users | MRR Target |
|-------|----------|-------|------------|
| 0 | Month 3 | 1,000 | $10k |
| 1 | Month 7 | 15,000 | $200k |
| 2 | Month 13 | 100,000 | $1M |
| 3 | 2027 | 500,000+ | $10M |

## Technical Philosophy

### Core Principles

1. **Local-First:** Data lives on user's device (SQLite + local storage)
2. **Zero-Knowledge E2E Encryption:** Server cannot read user data
3. **Sync Optional:** iCloud/Dropbox sync for backups
4. **Progressive Enhancement:** Works offline, syncs when online
5. **Cross-Platform:** iOS, macOS, Android, Web (in that order)

### Agent Architecture

- **On-Device LLM:** For basic queries, privacy-sensitive tasks
- **Cloud Fallback:** GPT-4 class models for complex reasoning
- **Tool/Function Calling:** Agents can invoke tools (APIs, local functions)
- **Context Management:** RAG system for long-term memory

## Competitive Positioning

### Direct Competitors
- Superhuman (email only)
- Notion (not conversational)
- Apple Notes (no AI)
- ChatGPT (no integrations)

### Key Differentiators
1. **All-in-one:** Replace 10+ apps
2. **Privacy:** Local-first + E2E encryption
3. **Conversational:** Natural language for everything
4. **Smart Memory:** Full-text search across all contexts

## Go-to-Market Strategy

### Stage 0 Launch
- Closed beta via TestFlight
- Discord community for power users
- Indie Twitter/X promotion
- Charge from day 1 (Superhuman model)

### Stage 1 Expansion
- Product Hunt launch
- Reddit (r/productivity, r/macapps)
- YouTube tech reviewers
- Sponsorships on tech podcasts

### Stage 2–3 Growth
- Invite-based viral loops
- Referral bonuses
- Enterprise sales (team plans)

## Risk Mitigation

### Technical Risks
- **On-device LLM performance:** Fall back to cloud, optimize models
- **Sync conflicts:** Use CRDTs, last-write-wins with timestamps
- **Battery drain:** Aggressive caching, background task limits

### Market Risks
- **Low adoption:** Focus on retention over growth in Stage 0
- **Competition from Big Tech:** Emphasize privacy + consolidation
- **Agent quality:** Curate agents carefully, don't ship mediocre features

### Regulatory Risks
- **GDPR/Privacy laws:** Local-first helps; get legal review
- **E2E encryption regulations:** Monitor legislation, prepare fallbacks

## Next Steps

1. **Lock the name** (Echo or Lark)
2. **Finalize Stage 0 scope** (see stage-0-spec.md)
3. **Build minimal prototype** (iOS + macOS)
4. **Launch closed beta** (100 users in 6 weeks)
5. **Iterate to PMF** (500 paying users by Month 3)

---

**Last Updated:** 2025-12-02
**Status:** Draft → Ready for Stage 0 Build
**Owner:** [TBD]
