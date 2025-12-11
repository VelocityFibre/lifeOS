# WhatsApp Agent Documentation

## Overview
The WhatsApp Agent is a Mastra-based agent that provides WhatsApp messaging capabilities through the lifeOS system. It uses the `whatsapp-web.js` library to connect to WhatsApp Web and allows users to interact with their WhatsApp account programmatically.

## Architecture

### Components
1. **WhatsApp Client** (`src/config/whatsapp-client.ts`)
   - Manages the WhatsApp Web client connection
   - Handles authentication with LocalAuth strategy
   - Stores session data in `.wwebjs_auth/` directory
   - Uses Puppeteer in headless mode for browser automation

2. **WhatsApp Agent** (`src/agents/whatsapp.agent.ts`)
   - Mastra agent with natural language processing
   - Provides tools for chat management
   - Maintains conversation history per user
   - Integrates with the lifeOS agent framework

### Key Features
- **Recent Chats**: List recent WhatsApp conversations
- **Read Messages**: Fetch messages from specific chats
- **Send Messages**: Send text messages to contacts/groups
- **Session Persistence**: Authentication persists across restarts
- **Multi-user Support**: Separate conversation history per user

## Authentication Process

### Local Development Setup

#### 1. Initial QR Code Generation
When the WhatsApp client initializes for the first time, it generates a QR code in the terminal:

```javascript
// From whatsapp-client.ts
whatsappClient.on("qr", (qr: string) => {
  console.log("📱 WhatsApp QR Code:");
  qrcode.generate(qr, { small: true });  // Displays ASCII QR in terminal
  qrCodeData = qr;  // Stores QR data for potential reuse
  console.log("👆 Scan this QR code with WhatsApp on your phone");
});
```

#### 2. Scanning Process
1. Run the agent server locally: `npm run dev`
2. QR code appears as ASCII art in terminal
3. Open WhatsApp on phone → Settings → Linked Devices
4. Scan the QR code from terminal
5. Authentication completes and session saves

#### 3. Session Storage
After successful authentication:
- Session data saved in `.wwebjs_auth/session/` directory
- Contains Chrome browser session and WhatsApp Web cookies
- Enables automatic reconnection without rescanning

### Directory Structure
```
.wwebjs_auth/
└── session/
    ├── Default/
    │   ├── Cache/
    │   ├── Cookies
    │   ├── Local Storage/
    │   └── Session Storage/
    └── session.json
```

## VPS Deployment Process

### Step 1: Local Authentication
```bash
# 1. Start the agent locally
cd lifeos-agents
npm run dev

# 2. Scan QR code with phone
# 3. Wait for "WhatsApp client is ready!" message
# 4. Stop the server (Ctrl+C)
```

### Step 2: Prepare Authentication for Transfer
```bash
# Create archive with auth data
tar -czf wwebjs-auth.tar.gz .wwebjs_auth/

# This preserves:
# - Session cookies
# - Browser profile
# - WhatsApp Web authentication
```

### Step 3: Transfer to VPS
```bash
# Transfer auth archive to VPS
sshpass -p "VeloF@2025@@" scp wwebjs-auth.tar.gz root@72.60.17.245:/var/www/lifeos-agents/

# SSH to VPS and extract
sshpass -p "VeloF@2025@@" ssh -o StrictHostKeyChecking=no root@72.60.17.245 \
  'cd /var/www/lifeos-agents && tar -xzf wwebjs-auth.tar.gz'
```

### Step 4: Deploy Full Agent
```bash
# Create deployment package
tar -czf lifeos-agents-deploy.tar.gz \
  dist/ \
  package.json \
  package-lock.json \
  .env

# Transfer to VPS
sshpass -p "VeloF@2025@@" scp lifeos-agents-deploy.tar.gz root@72.60.17.245:/var/www/

# Deploy and start
sshpass -p "VeloF@2025@@" ssh -o StrictHostKeyChecking=no root@72.60.17.245 \
  'cd /var/www/lifeos-agents && \
   tar -xzf ../lifeos-agents-deploy.tar.gz && \
   pm2 restart lifeos-agents'
```

## Environment Configuration

### Required Dependencies
```json
{
  "whatsapp-web.js": "^1.26.0",
  "qrcode-terminal": "^0.12.0",
  "puppeteer": "^21.0.0"
}
```

### Puppeteer Configuration
For VPS deployment, requires no-sandbox mode:
```javascript
puppeteer: {
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"]
}
```

## API Integration

### Endpoint Structure
```
POST /api/agents/whatsappAgent/chat
{
  "message": "Show my recent chats",
  "userId": "user123"
}
```

### Tool Execution Flow
1. User sends natural language message
2. Agent interprets intent using GPT-4
3. Agent calls appropriate tool:
   - `get_recent_chats`: Lists conversations
   - `get_chat_messages`: Reads messages
   - `send_message`: Sends messages
4. Response formatted and returned

## Troubleshooting

### Common Issues

#### 1. QR Code Not Appearing
- Check if `.wwebjs_auth/` exists and delete if corrupted
- Ensure Puppeteer dependencies installed
- Verify node version compatibility

#### 2. Session Lost on VPS
- Ensure `.wwebjs_auth/` has correct permissions
- Check PM2 logs: `pm2 logs lifeos-agents`
- Verify Chromium installation on VPS

#### 3. Authentication Transfer Failed
- Preserve directory structure when archiving
- Transfer entire `.wwebjs_auth/` directory
- Don't modify session files manually

### Debug Commands
```bash
# Check WhatsApp connection status
curl -X POST http://localhost:5001/api/agents/whatsappAgent/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test connection","userId":"test"}'

# View PM2 logs
pm2 logs lifeos-agents --lines 50

# Check auth directory
ls -la /var/www/lifeos-agents/.wwebjs_auth/
```

## Security Considerations

1. **Session Protection**
   - `.wwebjs_auth/` should be in `.gitignore`
   - Never commit session data to repository
   - Use secure transfer methods (SSH/SCP)

2. **Access Control**
   - Implement user authentication before agent access
   - Rate limit API endpoints
   - Monitor for suspicious activity

3. **Data Privacy**
   - Messages processed in memory only
   - No persistent message storage
   - Conversation history limited to 10 messages

## Implementation Notes

### Key Design Decisions

1. **LocalAuth Strategy**: Chosen for simplicity and persistence
2. **Headless Puppeteer**: Reduces resource usage on VPS
3. **In-Memory Conversation**: Avoids database dependency
4. **Mastra Integration**: Leverages existing agent framework

### Future Enhancements
- Media message support (images, documents)
- Group management features
- Message search functionality
- Webhook support for incoming messages
- Multi-account support

## Complete Deployment Checklist

- [ ] Local Development
  - [ ] Install dependencies
  - [ ] Start agent server
  - [ ] Scan QR code
  - [ ] Verify connection

- [ ] Authentication Transfer
  - [ ] Stop local server
  - [ ] Create auth archive
  - [ ] Transfer to VPS
  - [ ] Extract on VPS

- [ ] VPS Deployment
  - [ ] Build TypeScript
  - [ ] Create deployment package
  - [ ] Transfer package
  - [ ] Start with PM2
  - [ ] Test endpoints

- [ ] Verification
  - [ ] Check PM2 status
  - [ ] Test chat listing
  - [ ] Send test message
  - [ ] Monitor logs

## Summary
The WhatsApp Agent provides seamless WhatsApp integration for lifeOS. The authentication process involves:
1. Generating QR code locally in terminal
2. Scanning with phone to create session
3. Archiving `.wwebjs_auth/` directory
4. Transferring to VPS via SCP
5. Running agent with persisted session

This approach ensures continuous WhatsApp connectivity without requiring repeated QR scanning on the VPS.