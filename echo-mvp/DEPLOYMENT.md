# LifeOS Deployment Guide

## Quick Start

### First Time Setup

1. **Set up Git-based deployment on VPS:**
   ```bash
   cd /home/louisdup/Agents/lifeOS/echo-mvp
   ./setup-vps-git-deploy.sh
   ```

2. **Configure Git (if not already done):**
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your@email.com"
   ```

### Daily Development Workflow

```bash
# 1. Run autonomous builder to make improvements
cd /home/louisdup/Agents/lifeOS
./start-hosted-builder.sh --max-iterations 10

# 2. Review changes
cd echo-mvp
git status
git diff

# 3. Test locally (optional)
cd mastra-backend
npm run api
# Test at http://localhost:3001

# 4. Deploy to production when ready
cd /home/louisdup/Agents/lifeOS/echo-mvp
./deploy-to-production.sh "Describe your changes here"
```

## Deployment Scripts

### `./deploy-to-production.sh "message"`
- Commits all changes
- Pushes to GitHub
- Deploys to VPS
- Restarts PM2 process

**Example:**
```bash
./deploy-to-production.sh "Add calendar agent and improve email routing"
```

### `./setup-vps-git-deploy.sh`
- One-time setup script
- Clones repo to VPS
- Configures PM2
- Only run once!

### `./deploy-lifeos-to-vps.sh`
- Legacy deployment script
- Uploads build directly to VPS
- Use for hotfixes without Git

## Architecture

### Local Development
```
/home/louisdup/Agents/lifeOS/
├── autonomous-lifeos-builder.py   # Autonomous improvement agent
├── start-hosted-builder.sh        # Run the builder
└── echo-mvp/                      # Main codebase
    ├── database/                  # Neon DB schema
    ├── mastra-backend/            # Node.js + Mastra backend
    ├── expo-app/                  # React Native frontend
    ├── deploy-to-production.sh    # Git-based deploy
    └── setup-vps-git-deploy.sh    # VPS setup
```

### VPS (72.60.17.245)
```
/var/www/
├── lifeos/                 # Legacy deployment (direct upload)
└── lifeos-repo/            # Git-based deployment
    └── mastra-backend/
        ├── dist/           # Built JavaScript
        ├── .env            # Production secrets
        └── node_modules/
```

### GitHub
- **Repository:** https://github.com/VelocityFibre/lifeOS
- **Branch:** main
- **`.gitignore`:** Excludes `.env`, `node_modules`, `dist`, etc.

## Environment Variables

### Local Development (`.env`)
```env
DATABASE_URL=postgresql://...neon.tech/neondb
OPENAI_API_KEY=sk-proj-...
PORT=3001
NODE_ENV=development
JWT_SECRET=local-dev-secret
```

### Production (VPS `.env`)
```env
DATABASE_URL=postgresql://...neon.tech/neondb
OPENAI_API_KEY=sk-proj-...
PORT=3009
NODE_ENV=production
JWT_SECRET=production-secret-change-this
```

**Important:** `.env` files are NOT committed to Git!

## Useful Commands

### Check VPS Status
```bash
sshpass -p 'VeloF@2025@@' ssh root@72.60.17.245 'pm2 list'
```

### View VPS Logs
```bash
sshpass -p 'VeloF@2025@@' ssh root@72.60.17.245 'pm2 logs lifeos-api'
```

### Restart VPS
```bash
sshpass -p 'VeloF@2025@@' ssh root@72.60.17.245 'pm2 restart lifeos-api'
```

### Manual VPS Deploy
```bash
sshpass -p 'VeloF@2025@@' ssh root@72.60.17.245 << 'EOF'
cd /var/www/lifeos-repo
git pull origin main
cd mastra-backend
npm ci --production
npm run build
pm2 restart lifeos-api
EOF
```

## Troubleshooting

### "Permission denied" on push
```bash
# Configure Git credentials
git config --global credential.helper store
git push  # Enter credentials once
```

### VPS deployment fails
```bash
# Check VPS status
ssh root@72.60.17.245
cd /var/www/lifeos-repo
git status
npm run build
pm2 logs lifeos-api
```

### Database connection issues
```bash
# Test from VPS
ssh root@72.60.17.245
cd /var/www/lifeos-repo/mastra-backend
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"
```

## URLs

- **Production API:** http://72.60.17.245:3009
- **With Domain:** https://lifeos.fibreflow.app (after DNS setup)
- **GitHub Repo:** https://github.com/VelocityFibre/lifeOS
- **Neon Database:** ep-curly-meadow-a9of4iv6 (Lithuania)

## Next Steps

1. ✅ Set up Git-based deployment → Run `./setup-vps-git-deploy.sh`
2. ⏳ Add DNS record: `lifeos.fibreflow.app` → `72.60.17.245`
3. ⏳ Set up SSL: `certbot --nginx -d lifeos.fibreflow.app`
4. ⏳ Update frontend to connect to production API
5. ⏳ Test end-to-end with mobile app

---

**Last Updated:** 2025-12-07
