# Stage 1 Specification: Power User

**Timeline:** Months 4–9 after Stage 0 launch
**Target Users:** 1,000 → 20,000
**Revenue Goal:** $200k MRR
**Depends On:** Stage 0 achieving 500+ paying users, 60%+ retention

---

## What We're Building

Expand the agent ecosystem with premium capabilities that drive higher willingness to pay. Focus on agents that replace expensive, specialized apps (travel, finance, health tracking).

## Success Criteria

- 15,000 active users by Month 9
- 30%+ of users on Pro tier ($39/month)
- 70% month-1 retention
- 3+ agents used per user per week
- NPS score >50

---

## New Features

### 1. Agent: @travel

**What it does:**
Manages trip planning, flight/hotel tracking, packing lists, and itineraries—all in chat.

**User Queries:**
- "Plan a trip to Barcelona, March 10-15"
- "Track flight UA123"
- "Create packing list for 5-day beach trip"
- "What's my itinerary for tomorrow?"

**Key Capabilities:**
1. **Trip Planning:**
   - Natural language input: "I'm going to Paris next week"
   - Creates trip entity (dates, location, notes)
   - Suggests activities based on location

2. **Flight/Hotel Tracking:**
   - Parse confirmation emails (integrate with @mail)
   - Auto-add flights/hotels to trip
   - Real-time flight status updates (FlightAware API)
   - Gate/terminal notifications

3. **Packing Lists:**
   - AI-generated lists based on trip type (beach, ski, business)
   - Checkboxes to track packed items
   - Suggestions: "Don't forget your passport!"

4. **Itinerary View:**
   - Day-by-day timeline of flights, hotels, activities
   - Shareable format (export to PDF/Calendar)

**Technical Implementation:**
- Integrations: FlightAware, Booking.com (scraping), Gmail parsing
- Local storage for trip data
- Push notifications for flight updates

**Monetization:**
- Exclusive to Pro tier ($39/month)

---

### 2. Agent: @finance

**What it does:**
Connects bank accounts, Stripe, PayPal, crypto wallets to provide financial insights and reporting.

**User Queries:**
- "How much did I earn this month?"
- "What are my recurring expenses?"
- "Show me all transactions at Starbucks"
- "What's my crypto portfolio worth?"

**Key Capabilities:**
1. **Account Aggregation:**
   - Plaid integration (US banks)
   - Stripe API (business income)
   - PayPal API
   - Crypto: read-only wallet tracking (Etherscan, Blockchain.com APIs)

2. **Transaction Search:**
   - Natural language: "Show food spending last month"
   - Filters: category, date range, amount
   - Auto-categorization (ML model)

3. **Financial Reporting:**
   - Monthly income/expense summaries
   - Charts (pie chart for categories, line chart for trends)
   - Export to CSV

4. **Smart Insights:**
   - "You spent 20% more on dining this month"
   - "Your Stripe revenue is up 15% vs last month"
   - Recurring subscription detection

**Security:**
- Plaid tokens stored in Keychain
- No raw bank credentials stored
- User can disconnect accounts anytime

**Technical Implementation:**
- Plaid SDK (bank connections)
- Stripe/PayPal REST APIs
- Local SQLite cache for transactions (encrypted)

**Monetization:**
- Exclusive to Pro tier ($39/month)

---

### 3. Agent: @health

**What it does:**
Aggregates health data from Apple Health, manual logs (mood, energy), and provides trends/insights.

**User Queries:**
- "Log workout: 30 min run"
- "How did I sleep last week?"
- "What's my average mood this month?"
- "Track water intake: 2 liters"

**Key Capabilities:**
1. **Apple Health Integration:**
   - Read: steps, workouts, sleep, heart rate
   - Write: workouts, mindfulness sessions

2. **Manual Logging:**
   - Mood (1-10 scale)
   - Energy level
   - Water intake
   - Custom metrics (e.g., "caffeine intake")

3. **Trends & Insights:**
   - Weekly summaries: "You averaged 8,200 steps/day"
   - Correlations: "You sleep better on days you exercise"
   - Charts: line graphs for weight, steps, sleep

**Technical Implementation:**
- HealthKit framework (iOS/macOS)
- Local storage for custom logs
- ML for correlation insights (scikit-learn or Core ML)

**Monetization:**
- Included in Pro tier ($39/month)

---

### 4. Agent: @tasks (Proper Task Manager)

**What it does:**
Full-featured task management (Notion/Todoist-style) but conversational. Projects, subtasks, due dates, priorities.

**User Queries:**
- "Add task: Finish Q4 report, due Friday"
- "Show high-priority tasks"
- "Move 'Call dentist' to next week"
- "Create project: Website Redesign"

**Key Capabilities:**
1. **Task Creation:**
   - Natural language parsing (due dates, priorities, projects)
   - Subtasks: "Add subtask to Website Redesign: Design mockups"

2. **Task Views:**
   - Today, This Week, All Tasks
   - Filter by project, priority, status
   - Markdown checklist format

3. **Smart Scheduling:**
   - "Schedule tasks for this week" → AI distributes tasks across days
   - Integration with @cal (block time for tasks)

4. **Recurring Tasks:**
   - "Add weekly task: Review team updates, every Monday"

**Technical Implementation:**
- Local SQLite for tasks
- Sync via CloudKit
- Notification reminders (local notifications)

**Monetization:**
- Free tier: 20 tasks max
- Pro tier: Unlimited tasks + projects

---

### 5. Enhanced Tools

#### Web Search & Browse
- "Search for best Italian restaurants in NYC"
- "Summarize this article: [URL]"
- Integration: Brave Search API or Perplexity

#### Image Generation
- "Generate image: sunset over mountains"
- Integration: DALL-E 3 or Stable Diffusion

#### Vision (Image Analysis)
- Upload photo → "What's in this image?"
- OCR: "Extract text from this receipt"
- Integration: GPT-4 Vision or local Core ML model

#### PDF/Document Summarization
- Upload PDF → "Summarize this paper"
- "What are the key takeaways?"
- Integration: PyMuPDF (extract text) + LLM

#### Voice Notes
- Record voice note → auto-transcribed → saved as message
- Integration: Whisper API or iOS Speech framework

---

## Platform Expansion

### Android App
- Native Kotlin/Jetpack Compose
- Feature parity with iOS (all agents)
- Google Drive sync (instead of iCloud)
- Launch on Google Play (closed beta → public)

**Timeline:** Start development in Month 6, launch in Month 9

---

## Updated Pricing

### Solo Tier - $19/month
- Core agents: @mem, @cal, @mail
- Basic @tasks (20 tasks max)
- Basic tools (weather, calc, time zones)

### Pro Tier - $39/month
- All Solo features
- Premium agents: @travel, @finance, @health
- Unlimited @tasks
- Advanced tools (web search, image gen, vision, PDF summaries)
- Priority support

---

## User Flows

### Power User Journey

**Morning Routine:**
1. "What's on my calendar today?" → @cal
2. "Show unread emails" → @mail
3. "What are my tasks for today?" → @tasks

**Business User:**
1. "How much Stripe revenue this month?" → @finance
2. "Draft email to investor: Update on Q4"
3. "Add task: Send investor update by Friday"

**Travel Planning:**
1. "Plan trip to Tokyo, April 1-10"
2. "Create packing list"
3. "Track flight AA456"

---

## Technical Requirements

### Performance Targets
- Message send latency: <100ms
- Agent response time: <2s (local), <5s (cloud)
- App launch time: <1s
- Sync time (full history): <10s

### Scalability
- Handle 100k+ messages per user
- 50+ agents invoked per day
- 10+ connected accounts (email, bank, etc.)

---

## Success Metrics

### Engagement
- 4+ agents used per user per week
- 25+ messages sent per day per user
- 20+ minutes daily active time

### Conversion
- Solo → Pro upgrade rate: 40%+
- Trial → paid conversion: 30%+

### Retention
- Month 1: 70%+
- Month 3: 55%+
- Month 6: 45%+

---

## Launch Plan

### Rollout Strategy
1. **Week 1–2:** Launch @travel + @tasks to existing users (beta)
2. **Week 3–4:** Launch @finance + @health
3. **Week 5–6:** Introduce Pro tier, migrate pricing
4. **Week 7–8:** Product Hunt launch (again), PR push

### Marketing
- Reddit AMAs (r/productivity, r/digitalnomad)
- YouTube sponsorships (Ali Abdaal, Thomas Frank)
- Tech blog reviews (The Verge, TechCrunch)

---

## Risks & Mitigations

### Risk: Agent Quality
- **Mitigation:** Extensive beta testing, phased rollout
- **Fallback:** Disable underperforming agents

### Risk: Low Pro Tier Adoption
- **Mitigation:** Free trial of Pro for 30 days
- **Fallback:** Lower Pro price to $29/month

### Risk: Android Development Delays
- **Mitigation:** Hire Android specialist early
- **Fallback:** Push Android to Stage 2

---

## Open Questions

1. **Android priority:** Start now or after iOS/macOS stabilize?
2. **@finance security:** Is Plaid trusted enough, or build custom bank integrations?
3. **Free tier:** Should Solo tier exist, or go straight to paid?

---

**Next Action:** Finalize @travel spec, begin iOS development (Month 4)

**Last Updated:** 2025-12-02
**Owner:** [TBD]
