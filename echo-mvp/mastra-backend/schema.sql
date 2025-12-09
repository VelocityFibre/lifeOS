-- LifeOS (Echo) - Neon PostgreSQL Schema
-- Architecture: Hosted Backend with Neon Database
-- Created: 2025-12-07
-- Version: 1.0

-- Enable UUID extension (Neon has this by default)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100),
  password_hash VARCHAR(255), -- bcrypt hash
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for email lookup (login)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- MESSAGES TABLE (Unified Chat)
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  agent_name VARCHAR(50), -- '@mail', '@cal', '@mem', or NULL
  metadata JSONB, -- attachments, tool results, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for message queries
CREATE INDEX IF NOT EXISTS idx_messages_user_created ON messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_agent ON messages(agent_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);

-- ============================================
-- AGENT STATE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS agent_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  agent_name VARCHAR(50) NOT NULL,
  state_data JSONB NOT NULL, -- agent-specific state/memory
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, agent_name)
);

-- Index for agent state lookup
CREATE INDEX IF NOT EXISTS idx_agent_state_user_agent ON agent_state(user_id, agent_name);

-- ============================================
-- SESSIONS TABLE (JWT + Multi-device)
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  device_info JSONB, -- device type, OS, etc.
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for session lookup
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- ============================================
-- OAUTH TOKENS TABLE (Gmail/Google)
-- ============================================
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'google', 'microsoft', etc.
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type VARCHAR(50) DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ,
  scope TEXT, -- OAuth scopes granted
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Index for OAuth token lookup
CREATE INDEX IF NOT EXISTS idx_oauth_user_provider ON oauth_tokens(user_id, provider);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
-- Automatically update updated_at timestamp on row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_state_updated_at BEFORE UPDATE ON agent_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oauth_tokens_updated_at BEFORE UPDATE ON oauth_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (Development/Testing)
-- ============================================
-- Uncomment below to insert sample data for testing

-- INSERT INTO users (email, username) VALUES
--   ('test@example.com', 'Test User')
-- ON CONFLICT (email) DO NOTHING;

-- Get the test user ID for sample messages
-- WITH test_user AS (
--   SELECT id FROM users WHERE email = 'test@example.com' LIMIT 1
-- )
-- INSERT INTO messages (user_id, content, role, agent_name)
-- SELECT
--   test_user.id,
--   'Show me my recent emails',
--   'user',
--   '@mail'
-- FROM test_user
-- ON CONFLICT DO NOTHING;

-- ============================================
-- SCHEMA VERSION TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT
);

INSERT INTO schema_version (version, description) VALUES
  (1, 'Initial schema - Users, Messages, Agent State, Sessions, OAuth')
ON CONFLICT (version) DO NOTHING;
