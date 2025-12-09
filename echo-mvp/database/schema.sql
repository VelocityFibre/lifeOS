-- LifeOS Neon PostgreSQL Schema
-- ================================
-- Hosted architecture for unified chat interface
-- Created: 2025-12-07

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
-- Stores user accounts for authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL, -- bcrypt hash
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================
-- Unified chat message storage
-- Stores both user messages and agent responses
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    agent_name VARCHAR(50), -- '@mail', '@cal', '@mem', or null for general chat
    metadata JSONB DEFAULT '{}', -- attachments, tool results, email data, etc.
    parent_id UUID REFERENCES messages(id) ON DELETE SET NULL, -- for threading
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_user_created ON messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_agent ON messages(agent_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_parent ON messages(parent_id);

-- ============================================================================
-- AGENT_STATE TABLE
-- ============================================================================
-- Stores agent-specific state and memory
CREATE TABLE IF NOT EXISTS agent_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    agent_name VARCHAR(50) NOT NULL,
    state_data JSONB NOT NULL DEFAULT '{}', -- agent-specific state
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, agent_name)
);

CREATE INDEX IF NOT EXISTS idx_agent_state_user_agent ON agent_state(user_id, agent_name);

-- ============================================================================
-- SESSIONS TABLE
-- ============================================================================
-- JWT session management for multi-device support
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    device_info JSONB DEFAULT '{}', -- device type, OS, etc.
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- ============================================================================
-- EMAIL_CACHE TABLE (for @mail agent)
-- ============================================================================
-- Caches Gmail messages to reduce API calls
CREATE TABLE IF NOT EXISTS email_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    gmail_id VARCHAR(255) NOT NULL, -- Gmail message ID
    thread_id VARCHAR(255),
    from_address VARCHAR(255),
    to_address TEXT,
    subject TEXT,
    body TEXT,
    snippet TEXT,
    labels TEXT[], -- array of Gmail labels
    received_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, gmail_id)
);

CREATE INDEX IF NOT EXISTS idx_email_cache_user ON email_cache(user_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_cache_gmail_id ON email_cache(gmail_id);
CREATE INDEX IF NOT EXISTS idx_email_cache_thread ON email_cache(thread_id);
CREATE INDEX IF NOT EXISTS idx_email_cache_from ON email_cache(from_address);

-- ============================================================================
-- CALENDAR_EVENTS TABLE (for @cal agent)
-- ============================================================================
-- Caches Google Calendar events
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    gcal_id VARCHAR(255) NOT NULL, -- Google Calendar event ID
    calendar_id VARCHAR(255) NOT NULL,
    summary TEXT,
    description TEXT,
    location TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    all_day BOOLEAN DEFAULT FALSE,
    attendees JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, gcal_id)
);

CREATE INDEX IF NOT EXISTS idx_calendar_user_time ON calendar_events(user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_gcal_id ON calendar_events(gcal_id);

-- ============================================================================
-- MEMORY_ITEMS TABLE (for @mem agent)
-- ============================================================================
-- Personal knowledge base / RAG storage
CREATE TABLE IF NOT EXISTS memory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    source VARCHAR(100), -- 'user_input', 'email', 'calendar', 'note'
    tags TEXT[],
    embedding VECTOR(1536), -- OpenAI ada-002 embeddings (requires pgvector extension)
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memory_user ON memory_items(user_id, created_at DESC);
-- Vector similarity search (requires pgvector extension)
-- CREATE INDEX IF NOT EXISTS idx_memory_embedding ON memory_items USING ivfflat (embedding vector_cosine_ops);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_state_updated_at BEFORE UPDATE ON agent_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_cache_updated_at BEFORE UPDATE ON email_cache
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memory_items_updated_at BEFORE UPDATE ON memory_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA (for testing)
-- ============================================================================

-- Create a test user (password: 'password123')
-- Hash generated with bcrypt rounds=10
INSERT INTO users (email, username, password_hash) VALUES
    ('test@lifeos.dev', 'testuser', '$2b$10$rKjHvEOExGbNz5VkH4z3/.VqP4xF0L0oV6Z0YrKW8jXwKd8h8jN8K')
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- VIEWS (helpful queries)
-- ============================================================================

-- Recent messages view
CREATE OR REPLACE VIEW recent_messages AS
SELECT
    m.id,
    m.user_id,
    u.username,
    m.content,
    m.role,
    m.agent_name,
    m.created_at
FROM messages m
JOIN users u ON m.user_id = u.id
ORDER BY m.created_at DESC
LIMIT 100;

-- Active sessions view
CREATE OR REPLACE VIEW active_sessions AS
SELECT
    s.id,
    s.user_id,
    u.username,
    u.email,
    s.expires_at,
    s.created_at
FROM sessions s
JOIN users u ON s.user_id = u.id
WHERE s.expires_at > NOW()
ORDER BY s.created_at DESC;

-- ============================================================================
-- GRANT PERMISSIONS (if needed for specific database user)
-- ============================================================================
-- Uncomment and modify as needed for your database user
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_db_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_db_user;

-- ============================================================================
-- CLEANUP QUERIES (useful for development)
-- ============================================================================

-- Uncomment to reset database (DANGER: deletes all data!)
-- TRUNCATE users, messages, agent_state, sessions, email_cache, calendar_events, memory_items CASCADE;
