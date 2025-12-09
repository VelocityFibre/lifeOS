# Database Setup Guide - Neon PostgreSQL

This guide will help you set up the Neon PostgreSQL database for LifeOS (Echo).

## Overview

We're using **Neon** as our hosted PostgreSQL database for the following reasons:

- ✅ Serverless PostgreSQL (auto-scales)
- ✅ Free tier available (0.5 GB storage, 10 GB data transfer)
- ✅ Built-in connection pooling
- ✅ Automatic backups
- ✅ Low latency worldwide

---

## Step 1: Create a Neon Account

1. Go to [https://neon.tech](https://neon.tech)
2. Sign up with GitHub, Google, or email
3. Verify your email address

---

## Step 2: Create a Database

1. Click **"Create a project"** in the Neon dashboard
2. Enter project details:
   - **Name**: `lifeos-echo` (or your choice)
   - **Region**: Choose closest to your users
   - **PostgreSQL version**: 16 (recommended)
3. Click **"Create project"**

---

## Step 3: Get Your Connection String

1. In your Neon project dashboard, click **"Connection Details"**
2. Copy the **Connection string** (it looks like this):
   ```
   postgresql://user:password@ep-xxx-xxx.region.neon.tech/dbname?sslmode=require
   ```
3. Keep this safe - you'll need it in the next step

---

## Step 4: Configure Environment Variables

1. Open `/echo-mvp/mastra-backend/.env`
2. Add your Neon connection string:
   ```bash
   DATABASE_URL=postgresql://user:password@ep-xxx-xxx.region.neon.tech/dbname?sslmode=require
   ```
3. Save the file

**Important**: Never commit `.env` to git. It's already in `.gitignore`.

---

## Step 5: Install Dependencies

```bash
cd /home/louisdup/Agents/lifeOS/echo-mvp/mastra-backend
npm install
```

This will install:
- `pg` - PostgreSQL client for Node.js
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT authentication

---

## Step 6: Test Database Connection

```bash
npm run db:test
```

You should see:
```
✅ Database connected: 2025-12-07T...
📊 PostgreSQL version: PostgreSQL 16.x...
⚡ Query completed in Xms
✅ All connection tests passed!
```

If you see errors, double-check your `DATABASE_URL` in `.env`.

---

## Step 7: Create Database Schema

```bash
npm run db:setup
```

This will:
1. Connect to your Neon database
2. Execute `schema.sql` to create tables
3. Verify tables were created successfully

You should see:
```
✅ Tables created:
   - agent_state
   - messages
   - oauth_tokens
   - schema_version
   - sessions
   - users
📌 Schema version: 1
   Initial schema - Users, Messages, Agent State, Sessions, OAuth
```

---

## Database Schema Overview

### Tables Created

1. **users** - User accounts with email/password
2. **messages** - Unified chat history (user + assistant messages)
3. **agent_state** - Agent-specific memory and context
4. **sessions** - JWT session tokens for multi-device auth
5. **oauth_tokens** - Gmail OAuth tokens (access + refresh)
6. **schema_version** - Migration tracking

### Indexes

- User email lookup
- Message queries (by user, date, agent)
- Session token lookup
- OAuth token lookup

### Features

- ✅ UUID primary keys
- ✅ Automatic `updated_at` triggers
- ✅ Cascading deletes (delete user → delete all their data)
- ✅ JSONB for flexible metadata
- ✅ Timezone-aware timestamps

---

## Verifying the Setup

### Check Tables in Neon Dashboard

1. Go to your Neon project
2. Click **"Tables"** in the sidebar
3. You should see all 6 tables listed

### Run a Test Query

```bash
# Connect to your database using psql (if you have it installed)
psql "postgresql://user:password@ep-xxx-xxx.region.neon.tech/dbname?sslmode=require"

# Then run:
SELECT * FROM schema_version;
```

You should see:
```
 version |         applied_at         |                    description
---------+----------------------------+---------------------------------------------------
       1 | 2025-12-07 12:00:00.000+00 | Initial schema - Users, Messages, Agent State...
```

---

## Next Steps

After database setup is complete:

1. ✅ Database schema created
2. ⬜ Implement authentication endpoints (`/api/auth/register`, `/api/auth/login`)
3. ⬜ Update message endpoints to use Neon instead of in-memory
4. ⬜ Integrate OAuth token storage
5. ⬜ Test end-to-end with frontend

---

## Troubleshooting

### "Connection refused" or "ECONNREFUSED"

- Check your `DATABASE_URL` is correct
- Ensure your IP is allowed (Neon allows all IPs by default)
- Check your internet connection

### "SSL required" error

- Make sure your connection string includes `?sslmode=require`
- Neon requires SSL connections

### "Too many connections"

- Neon free tier has a connection limit
- Our connection pool is limited to 20 connections
- Close unused connections

### Need to Reset?

Drop all tables and recreate:
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

Then run `npm run db:setup` again.

---

## Production Deployment

When deploying to production:

1. Use a separate Neon project for production
2. Set `NODE_ENV=production` in environment
3. Update `DATABASE_URL` to production connection string
4. Enable Neon's automatic backups
5. Set up monitoring/alerts in Neon dashboard

---

## Resources

- [Neon Documentation](https://neon.tech/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [node-postgres (pg) Documentation](https://node-postgres.com/)

---

**Last Updated**: 2025-12-07
**Schema Version**: 1.0
