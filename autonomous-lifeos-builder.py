#!/usr/bin/env python3
"""
Autonomous LifeOS Builder
=========================

Continuously builds lifeOS using multiple specialized ACH agents.
Each agent focuses on a specific component (email, calendar, memory, frontend).

Usage:
    python3 autonomous-lifeos-builder.py [--max-iterations N] [--agent AGENT_NAME]

Agents:
    - email: Email agent (@mail) implementation
    - calendar: Calendar agent (@cal) implementation
    - memory: Memory agent (@mem) implementation
    - frontend: Expo frontend integration
    - orchestrator: Coordinates all agents (default)
"""

import asyncio
import sys
from pathlib import Path
from typing import Optional
import argparse
import json
from datetime import datetime

# Add the autonomous coding harness to path
sys.path.insert(0, str(Path.home() / "claude-quickstarts" / "autonomous-coding"))

from claude_code_sdk import ClaudeSDKClient
from client import create_client
from progress import print_session_header, print_progress_summary


# Configuration
LIFEOS_ROOT = Path("/home/louisdup/Agents/lifeOS")
ECHO_MVP_DIR = LIFEOS_ROOT / "echo-mvp"
MASTRA_BACKEND = ECHO_MVP_DIR / "mastra-backend"
EXPO_APP = ECHO_MVP_DIR / "expo-app"

AUTO_CONTINUE_DELAY = 5  # seconds between iterations


def get_agent_prompt(agent_type: str, iteration: int) -> str:
    """Get the appropriate prompt for each agent type."""

    common_context = f"""# LifeOS Autonomous Build - {agent_type.upper()} Agent

**Project:** LifeOS (Echo/Lark) - Personal Operating System MVP
**Root:** {LIFEOS_ROOT}
**Backend:** {MASTRA_BACKEND}
**Frontend:** {EXPO_APP}
**Iteration:** {iteration}

## Your Mission
You are a specialized autonomous coding agent responsible for building and maintaining
the {agent_type} component of lifeOS. You work continuously and autonomously.

## Project Context
LifeOS is a WhatsApp-style personal OS app with AI agents for productivity:
- @mail agent: Gmail/email management
- @cal agent: Calendar integration
- @mem agent: Personal memory/search
- Frontend: React Native Expo app

Current status: ~70% code complete, needs testing, completion, and polish.

## Your Responsibilities
"""

    agent_prompts = {
        "database": """
**Component:** Neon PostgreSQL Database Setup
**Architecture:** Hosted backend (VPS + Neon)

### Tasks (Priority Order):
1. Read HOSTED_ARCHITECTURE.md to understand new architecture
2. Create database schema file (schema.sql) with tables:
   - users (id, email, username, password_hash)
   - messages (id, user_id, content, role, agent_name, metadata)
   - agent_state (id, user_id, agent_name, state_data)
   - sessions (id, user_id, token, expires_at)
3. Create migration script to set up Neon database
4. Add database connection to Mastra backend
5. Update backend to use PostgreSQL instead of LibSQL
6. Test database connection and queries

### Success Criteria:
- Schema file created and documented
- Can connect to Neon from backend
- Messages table can store/retrieve chat messages
- All indexes created for performance

### Technologies:
- @neondatabase/serverless
- PostgreSQL
- SQL migrations
""",

        "email": """
**Component:** Email Agent (@mail) - Mastra backend + Neon DB
**Files:** {mastra}/src/agents/email-agent.ts, {mastra}/src/tools/gmail-tools.ts

### Tasks (Priority Order):
1. Update email agent to store messages in Neon database
2. Update agent memory to use PostgreSQL (agent_state table)
3. Test Gmail OAuth integration (see GMAIL_OAUTH_SETUP.md)
4. Verify all email tools work with database: list, search, get details, draft, send
5. Ensure conversation history persists to database
6. Add error handling and edge cases
7. Test with real Gmail API

### Success Criteria:
- Email agent uses Neon for message storage
- Conversation history persists across sessions
- All Gmail tools functional with DB integration
- OAuth flow works
- Draft → send workflow reliable

### Current Issues to Address:
- Migrate from LibSQL to PostgreSQL
- Store agent state in agent_state table
- Update memory configuration for Neon
""",

        "calendar": """
**Component:** Calendar Agent (@cal) - Needs implementation
**Files:** {mastra}/src/agents/ (create calendar-agent.ts), {mastra}/src/tools/ (create calendar-tools.ts)

### Tasks (Priority Order):
1. Review calendar requirements in docs/stage-0-spec.md
2. Create calendar agent following email-agent.ts pattern
3. Implement Google Calendar OAuth
4. Create calendar tools: list events, create event, update event, delete event
5. Add natural language date parsing
6. Test with real Google Calendar API
7. Add to agent registry/routing
8. Create tests

### Success Criteria:
- Calendar agent created and registered
- Google Calendar OAuth working
- All CRUD operations functional
- Natural language date handling ("tomorrow at 3pm")
- Tests passing

### Reference:
- Email agent structure: {mastra}/src/agents/email-agent.ts
- Mastra docs for agent creation
""",

        "memory": """
**Component:** Memory Agent (@mem) - Search/RAG system
**Files:** {mastra}/src/agents/ (create memory-agent.ts), database setup

### Tasks (Priority Order):
1. Review memory requirements in docs/stage-0-spec.md
2. Design memory storage (LibSQL/SQLite)
3. Create memory agent for semantic search
4. Implement full-text search across all contexts
5. Add conversation history storage
6. Implement RAG-based retrieval
7. Create memory tools: search, store, recall
8. Test with sample data

### Success Criteria:
- Memory agent created
- Database schema defined
- Full-text search working
- RAG retrieval functional
- Conversation history persisted
- Fast search (<500ms)

### Technologies:
- LibSQLStore (already used in email-agent)
- Vector embeddings (optional MVP enhancement)
- Mastra Memory system
""",

        "frontend": """
**Component:** Expo React Native Frontend
**Files:** {expo}/App.js, {expo}/app/**, {expo}/components/**

### Tasks (Priority Order):
1. Review existing Expo app structure
2. Fix any dependency issues (npm install)
3. Test chat interface
4. Connect to Mastra backend (http://localhost:3001)
5. Implement @mention agent routing
6. Test email agent UI flows
7. Add calendar agent UI (when ready)
8. Add memory agent UI (when ready)
9. Polish UI/UX
10. Test on physical device (if available)

### Success Criteria:
- App runs without errors
- Chat interface functional
- Backend connection working
- @mail agent accessible via @mention
- Message sending/receiving works
- UI is polished and responsive

### Technologies:
- React Native / Expo
- Expo Router (app/ directory)
- Backend API calls to localhost:3001
""",

        "backend": """
**Component:** Backend API Server (Express + Mastra + Neon)
**Files:** {mastra}/src/index.ts, {mastra}/src/api/**, {mastra}/package.json

### Tasks (Priority Order):
1. Read HOSTED_ARCHITECTURE.md for new architecture
2. Install Neon PostgreSQL client (@neondatabase/serverless)
3. Create API endpoints:
   - POST /api/auth/register
   - POST /api/auth/login
   - GET  /api/messages
   - POST /api/messages
   - GET  /api/agents
4. Add database connection middleware
5. Add JWT authentication middleware
6. Update agent routing to store in database
7. Add error handling and logging
8. Test all endpoints

### Success Criteria:
- Backend connects to Neon
- Auth endpoints work (register/login)
- Messages endpoint saves to database
- Agent routing integrated
- CORS configured for frontend
- Environment variables properly configured

### Technologies:
- Express.js
- @neondatabase/serverless
- jsonwebtoken (JWT)
- bcrypt (password hashing)
""",

        "frontend": """
**Component:** Expo Frontend - API Integration
**Files:** {expo}/App.js, {expo}/app/**, {expo}/components/**

### Tasks (Priority Order):
1. Read HOSTED_ARCHITECTURE.md for new architecture
2. Remove local SQLite code
3. Create API client (fetch wrapper)
4. Add auth screens (login/register)
5. Add JWT token storage (AsyncStorage)
6. Update chat UI to use API endpoints
7. Add @mention routing to backend
8. Test message sending/receiving
9. Add error handling for network issues
10. Test on device/simulator

### Success Criteria:
- App connects to backend API
- Login/register works
- Messages save to database via API
- Chat interface responsive
- @mail mentions route correctly
- Works on iOS and Android

### Technologies:
- React Native / Expo
- AsyncStorage (JWT storage)
- Fetch API
- Expo Router
""",

        "orchestrator": """
**Component:** Full Stack Orchestrator - HOSTED ARCHITECTURE
**Architecture:** VPS Backend + Neon PostgreSQL + Expo Frontend
**Scope:** Entire LifeOS MVP - Unified Chat Interface

### CRITICAL: Read HOSTED_ARCHITECTURE.md First!
We've pivoted to a hosted architecture. Local-first iOS is DEPRECATED.

### Your Role:
You coordinate the overall build for HOSTED setup. Each iteration:
1. Review HOSTED_ARCHITECTURE.md
2. Identify highest priority task for hosted setup
3. Make progress on that task
4. Update progress tracking
5. Move to next priority

### Current Priority (Hosted MVP):
1. **DATABASE**: Create Neon PostgreSQL schema
2. **BACKEND**: Set up Express API + Neon connection
3. **AUTH**: Implement user registration/login (JWT)
4. **MESSAGES**: Message storage and retrieval endpoints
5. **AGENTS**: Update @mail agent to use Neon
6. **FRONTEND**: Update Expo app to connect to API
7. **DEPLOY**: Prepare for VPS deployment
8. **TEST**: End-to-end testing

### Decision Making:
- Focus on hosted architecture ONLY
- Ignore local SQLite, CloudKit, Swift code
- Build standard REST API
- Use Neon PostgreSQL for everything
- Keep it simple and deployable

### Success Criteria (Hosted MVP Complete):
- ✅ Neon database schema created
- ✅ Backend API deployed on VPS
- ✅ Auth working (register/login)
- ✅ Messages persist to database
- ✅ @mail agent integrated
- ✅ Frontend connects to backend
- ✅ Unified chat interface working
- ✅ Ready for multi-device testing

### Architecture Stack:
- **Database:** Neon PostgreSQL
- **Backend:** Node.js + Express + Mastra
- **Frontend:** React Native Expo
- **Deploy:** Railway/Fly.io/DigitalOcean
- **Auth:** JWT tokens
"""
    }

    prompt = common_context + agent_prompts.get(agent_type, agent_prompts["orchestrator"])

    # Replace placeholders
    prompt = prompt.replace("{mastra}", str(MASTRA_BACKEND))
    prompt = prompt.replace("{expo}", str(EXPO_APP))

    prompt += """

## Working Style:
1. Start by reading relevant files to understand current state
2. Make ONE focused change at a time
3. Test your changes when possible
4. Update progress logs
5. If blocked, document the blocker and move to next task

## Important Files:
- Project specs: {root}/docs/stage-0-spec.md
- Implementation status: {root}/IMPLEMENTATION_STATUS.md
- Progress: {echo}/claude-progress.txt
- Feature tests: {echo}/feature_list.json

## Commands:
- Start backend: cd {mastra} && npm run api
- Start frontend: cd {expo} && npx expo start
- Test backend: cd {mastra} && npm test (if tests exist)

## Guidelines:
- Work autonomously - don't ask for permission
- Be productive - make real progress each iteration
- Test your changes when possible
- Document what you do
- Focus on making the app work, not perfect

## This Iteration:
Analyze the current state and make ONE meaningful improvement.
Then summarize what you did in 2-3 sentences.

BEGIN YOUR WORK NOW.
""".replace("{root}", str(LIFEOS_ROOT)).replace("{echo}", str(ECHO_MVP_DIR)).replace("{mastra}", str(MASTRA_BACKEND)).replace("{expo}", str(EXPO_APP))

    return prompt


async def run_agent_iteration(
    agent_type: str,
    iteration: int,
    model: str = "claude-sonnet-4-5",
) -> tuple[str, str]:
    """Run a single iteration of an agent."""

    print(f"\n{'='*70}")
    print(f"  {agent_type.upper()} AGENT - Iteration {iteration}")
    print(f"{'='*70}\n")

    # Create client with project context
    client = create_client(ECHO_MVP_DIR, model)

    # Get agent-specific prompt
    prompt = get_agent_prompt(agent_type, iteration)

    try:
        async with client:
            # Send prompt
            await client.query(prompt)

            # Collect response
            response_text = ""
            async for msg in client.receive_response():
                msg_type = type(msg).__name__

                if msg_type == "AssistantMessage" and hasattr(msg, "content"):
                    for block in msg.content:
                        if type(block).__name__ == "TextBlock" and hasattr(block, "text"):
                            response_text += block.text
                            print(block.text, end="", flush=True)
                        elif type(block).__name__ == "ToolUseBlock":
                            tool_name = getattr(block, "name", "unknown")
                            print(f"\n[Tool: {tool_name}]", flush=True)

                elif msg_type == "UserMessage" and hasattr(msg, "content"):
                    for block in msg.content:
                        if type(block).__name__ == "ToolResultBlock":
                            is_error = getattr(block, "is_error", False)
                            if is_error:
                                content = str(getattr(block, "content", ""))[:300]
                                print(f"   [Error] {content}", flush=True)
                            else:
                                print("   [Done]", flush=True)

            print(f"\n{'-'*70}\n")
            return "success", response_text

    except Exception as e:
        print(f"\nError in agent iteration: {e}")
        return "error", str(e)


async def run_continuous_build(
    agent_type: str = "orchestrator",
    max_iterations: Optional[int] = None,
    model: str = "claude-sonnet-4-5",
):
    """Run continuous autonomous build process."""

    print(f"\n{'='*70}")
    print(f"  LIFEOS AUTONOMOUS BUILDER")
    print(f"{'='*70}")
    print(f"\nAgent Type: {agent_type}")
    print(f"Model: {model}")
    print(f"Max Iterations: {max_iterations or 'Unlimited'}")
    print(f"Project: {ECHO_MVP_DIR}")
    print(f"\n{'='*70}\n")

    # Create logs directory
    logs_dir = ECHO_MVP_DIR / "logs"
    logs_dir.mkdir(exist_ok=True)

    # Session log
    session_log = logs_dir / f"{agent_type}-session-{datetime.now().strftime('%Y%m%d-%H%M%S')}.txt"

    iteration = 0

    while True:
        iteration += 1

        # Check max iterations
        if max_iterations and iteration > max_iterations:
            print(f"\nReached max iterations ({max_iterations})")
            break

        # Run agent iteration
        status, response = await run_agent_iteration(agent_type, iteration, model)

        # Log response
        with open(session_log, "a") as f:
            f.write(f"\n{'='*70}\n")
            f.write(f"Iteration {iteration} - {datetime.now().isoformat()}\n")
            f.write(f"{'='*70}\n")
            f.write(response)
            f.write("\n")

        # Handle status
        if status == "success":
            print(f"\nIteration {iteration} complete. Continuing in {AUTO_CONTINUE_DELAY}s...")
            await asyncio.sleep(AUTO_CONTINUE_DELAY)
        else:
            print(f"\nIteration {iteration} encountered error. Retrying in {AUTO_CONTINUE_DELAY}s...")
            await asyncio.sleep(AUTO_CONTINUE_DELAY)

        # Brief pause between iterations
        if max_iterations is None or iteration < max_iterations:
            print("\nPreparing next iteration...\n")
            await asyncio.sleep(1)

    # Final summary
    print(f"\n{'='*70}")
    print(f"  BUILD SESSION COMPLETE")
    print(f"{'='*70}")
    print(f"\nAgent: {agent_type}")
    print(f"Iterations: {iteration}")
    print(f"Session log: {session_log}")
    print(f"\n{'='*70}\n")


async def main():
    parser = argparse.ArgumentParser(description="LifeOS Autonomous Builder")
    parser.add_argument(
        "--agent",
        choices=["database", "backend", "email", "calendar", "memory", "frontend", "orchestrator"],
        default="orchestrator",
        help="Which agent to run (default: orchestrator)"
    )
    parser.add_argument(
        "--max-iterations",
        type=int,
        help="Maximum number of iterations (default: unlimited)"
    )
    parser.add_argument(
        "--model",
        default="claude-sonnet-4-5",
        help="Claude model to use (default: claude-sonnet-4-5)"
    )

    args = parser.parse_args()

    await run_continuous_build(
        agent_type=args.agent,
        max_iterations=args.max_iterations,
        model=args.model
    )


if __name__ == "__main__":
    asyncio.run(main())
