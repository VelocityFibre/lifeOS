#!/bin/bash

# LifeOS Hosted Architecture Autonomous Builder
# ==============================================
# Starts the autonomous agent to build lifeOS with hosted architecture

set -e

echo "=================================================="
echo "  LIFEOS AUTONOMOUS BUILDER - HOSTED ARCHITECTURE"
echo "=================================================="
echo ""
echo "Architecture: VPS Backend + Neon PostgreSQL + Expo Frontend"
echo "Agent: Orchestrator (coordinates all components)"
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "ERROR: python3 not found. Please install Python 3.8+"
    exit 1
fi

# Check if autonomous coding harness exists
HARNESS_DIR="$HOME/claude-quickstarts/autonomous-coding"
if [ ! -d "$HARNESS_DIR" ]; then
    echo "ERROR: Autonomous coding harness not found at $HARNESS_DIR"
    echo "Please clone it first:"
    echo "  cd ~/claude-quickstarts"
    echo "  git clone <autonomous-coding-repo>"
    exit 1
fi

# Check if venv exists
if [ ! -d "$HARNESS_DIR/venv" ]; then
    echo "Creating Python virtual environment..."
    cd "$HARNESS_DIR"
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    echo "Activating virtual environment..."
    source "$HARNESS_DIR/venv/bin/activate"
fi

# Check if claude-code-sdk is available
if ! python3 -c "import claude_code_sdk" 2>/dev/null; then
    echo "ERROR: claude_code_sdk not found"
    echo "Please install it in the harness venv:"
    echo "  cd $HARNESS_DIR"
    echo "  source venv/bin/activate"
    echo "  pip install claude-code-sdk"
    exit 1
fi

echo ""
echo "=================================================="
echo "  CONFIGURATION"
echo "=================================================="
echo ""

# Parse command line arguments
AGENT_TYPE="orchestrator"
MAX_ITERATIONS=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --agent)
            AGENT_TYPE="$2"
            shift 2
            ;;
        --max-iterations)
            MAX_ITERATIONS="--max-iterations $2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --agent TYPE           Agent type: database, backend, email, frontend, orchestrator (default)"
            echo "  --max-iterations N     Maximum iterations (default: unlimited)"
            echo "  --help                Show this help"
            echo ""
            echo "Examples:"
            echo "  $0                                    # Run orchestrator indefinitely"
            echo "  $0 --agent database --max-iterations 5   # Run database agent for 5 iterations"
            echo "  $0 --agent backend                    # Run backend agent indefinitely"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo "Agent Type: $AGENT_TYPE"
if [ -n "$MAX_ITERATIONS" ]; then
    echo "Max Iterations: $(echo $MAX_ITERATIONS | cut -d' ' -f2)"
else
    echo "Max Iterations: Unlimited"
fi

echo ""
echo "=================================================="
echo "  STARTING AUTONOMOUS BUILDER"
echo "=================================================="
echo ""
echo "The agent will:"
echo "  1. Read HOSTED_ARCHITECTURE.md"
echo "  2. Set up Neon PostgreSQL database"
echo "  3. Build backend API (Express + Mastra)"
echo "  4. Update frontend to connect to API"
echo "  5. Test end-to-end"
echo ""
echo "Press Ctrl+C to stop the agent at any time"
echo ""
echo "=================================================="
echo ""

# Wait 3 seconds
sleep 3

# Ensure we're in the harness venv
cd "$HARNESS_DIR"
source venv/bin/activate

# Run the autonomous builder
cd /home/louisdup/Agents/lifeOS
python3 autonomous-lifeos-builder.py --agent "$AGENT_TYPE" $MAX_ITERATIONS

echo ""
echo "=================================================="
echo "  BUILD SESSION COMPLETE"
echo "=================================================="
echo ""
echo "Check the following for results:"
echo "  - Backend: echo-mvp/mastra-backend/"
echo "  - Frontend: echo-mvp/expo-app/"
echo "  - Logs: echo-mvp/logs/"
echo "  - Progress: echo-mvp/claude-progress.txt"
echo ""
echo "To deploy to VPS, see HOSTED_ARCHITECTURE.md"
echo ""
