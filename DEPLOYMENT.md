# LifeOS Deployment Quick Reference

## 🌐 Live Access
**Web App**: http://72.60.17.245:3010

## 🚀 Current Stack
- **Frontend**: Apple-inspired UI with WhatsApp-style chat (Port 3010)
- **Agents API**: Gmail, Claude, WhatsApp agents (Port 5001)
- **Auth API**: LifeOS authentication (Port 3009)

## 📦 Quick Deploy Commands

### Backend Update
```bash
cd lifeos-agents
npm run build
tar -czf lifeos-agents.tar.gz dist/ package.json package-lock.json .env
sshpass -p "VeloF@2025@@" scp lifeos-agents.tar.gz root@72.60.17.245:/var/www/
sshpass -p "VeloF@2025@@" ssh root@72.60.17.245 'cd /var/www/lifeos-agents && tar -xzf ../lifeos-agents.tar.gz && pm2 restart lifeos-agents'
```

### Check Status
```bash
# View running processes
sshpass -p "VeloF@2025@@" ssh root@72.60.17.245 'pm2 list'

# View agent logs
sshpass -p "VeloF@2025@@" ssh root@72.60.17.245 'pm2 logs lifeos-agents --lines 20'

# Check ports
sshpass -p "VeloF@2025@@" ssh root@72.60.17.245 'netstat -tlnp | grep -E ":(3009|3010|5001)"'
```

## 🎨 Frontend Note
The Apple-inspired UI is stable and deployed. Frontend source has been archived to prevent confusion. Contact admin for UI updates.

## 🔑 Environment Variables (Backend)
```
PORT=5001
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
```

---
*Last Updated: December 10, 2024*