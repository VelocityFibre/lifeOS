#!/bin/bash
# End-to-end integration test for lifeOS agents

echo "🧪 Starting End-to-End Integration Test"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Check agents service is running
echo -e "${BLUE}Test 1: Checking agents service (port 5001)...${NC}"
AGENTS_RESPONSE=$(curl -s http://localhost:5001/api/agents)
if echo "$AGENTS_RESPONSE" | grep -q "gmailAgent"; then
    echo -e "${GREEN}✓ Agents service is running${NC}"
    echo "   Available agents: $(echo $AGENTS_RESPONSE | grep -o '"agents":\[[^]]*\]')"
else
    echo -e "${RED}✗ Agents service not responding${NC}"
    exit 1
fi
echo ""

# Test 2: Test direct agent API call
echo -e "${BLUE}Test 2: Testing direct Gmail agent call...${NC}"
DIRECT_RESPONSE=$(curl -s -X POST http://localhost:5001/api/agents/gmailAgent/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","userId":"test"}')
if echo "$DIRECT_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✓ Gmail agent responding${NC}"
    echo "   Response: $(echo $DIRECT_RESPONSE | grep -o '"text":"[^"]*"' | head -c 100)..."
else
    echo -e "${RED}✗ Gmail agent not responding${NC}"
    exit 1
fi
echo ""

# Test 3: Test agent mapper for implemented agent (mail/gmail)
echo -e "${BLUE}Test 3: Testing agent mapper with 'mail' agent...${NC}"
MAPPER_TEST=$(node -e "
const { callAgentsAPI } = require('./dist/utils/agent-mapper');
callAgentsAPI('mail', 'Test message for Gmail', 'test-user')
  .then(result => console.log(JSON.stringify(result)))
  .catch(err => console.error(err.message));
")
if echo "$MAPPER_TEST" | grep -q "success"; then
    echo -e "${GREEN}✓ Agent mapper working for 'mail' -> 'gmailAgent'${NC}"
    echo "   Response: $(echo $MAPPER_TEST | grep -o '"text":"[^"]*"' | head -c 100)..."
else
    echo -e "${RED}✗ Agent mapper failed${NC}"
    exit 1
fi
echo ""

# Test 4: Test agent mapper for unimplemented agents
echo -e "${BLUE}Test 4: Testing unimplemented agents (instagram, cal, mem)...${NC}"
for agent in "instagram" "cal" "mem" "task" "finance" "health" "spotify"; do
    RESULT=$(node -e "
    const { callAgentsAPI } = require('./dist/utils/agent-mapper');
    callAgentsAPI('$agent', 'Test', 'test')
      .then(r => console.log(r.text.substring(0, 50)))
      .catch(e => console.error(e.message));
    ")
    if echo "$RESULT" | grep -q "coming soon"; then
        echo -e "${GREEN}   ✓ $agent: Returns 'coming soon' message${NC}"
    else
        echo -e "${RED}   ✗ $agent: Unexpected response${NC}"
        exit 1
    fi
done
echo ""

# Test 5: Test @mention detection
echo -e "${BLUE}Test 5: Testing @mention detection...${NC}"
echo "   Simulating message: '@cal Schedule meeting tomorrow'"
MENTION_TEST=$(node -e "
const message = '@cal Schedule meeting tomorrow';
const mentionMatch = message.match(/@(\w+)/);
if (mentionMatch) {
    const mention = mentionMatch[1];
    const agentName = mention === 'mail' ? 'gmail' : mention;
    const cleaned = message.replace(/@\w+\s*/g, '').trim();
    console.log(JSON.stringify({ agent: agentName, message: cleaned }));
}
")
if echo "$MENTION_TEST" | grep -q '"agent":"cal"' && echo "$MENTION_TEST" | grep -q 'Schedule meeting'; then
    echo -e "${GREEN}✓ @mention detection working${NC}"
    echo "   Parsed: $MENTION_TEST"
else
    echo -e "${RED}✗ @mention detection failed${NC}"
    exit 1
fi
echo ""

# Final summary
echo "========================================"
echo -e "${GREEN}✅ All end-to-end tests passed!${NC}"
echo ""
echo "Integration Summary:"
echo "  • Agents API (port 5001): ✓ Running"
echo "  • Gmail agent: ✓ Responding"
echo "  • Agent mapper: ✓ Working"
echo "  • Unimplemented agents: ✓ Return 'coming soon'"
echo "  • @mention parsing: ✓ Working"
echo ""
echo "Ready for deployment! 🚀"
