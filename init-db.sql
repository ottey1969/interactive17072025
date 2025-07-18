-- Sofeia AI Database Initialization Script
-- Run this in your Render PostgreSQL database to create required tables

-- Sessions table (required for authentication)
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions(expire);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  is_premium BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  unlimited_credits BOOLEAN DEFAULT false,
  grant_writing_access BOOLEAN DEFAULT false,
  monthly_questions_used INTEGER DEFAULT 0,
  current_month VARCHAR,
  total_credits INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES conversations(id),
  role VARCHAR NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Activities table
CREATE TABLE IF NOT EXISTS ai_activities (
  id SERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES conversations(id),
  phase VARCHAR NOT NULL CHECK (phase IN ('research', 'analysis', 'strategy', 'generation')),
  status VARCHAR NOT NULL CHECK (status IN ('pending', 'active', 'completed', 'failed')),
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  paypal_subscription_id VARCHAR,
  status VARCHAR NOT NULL CHECK (status IN ('active', 'cancelled', 'expired')),
  plan_type VARCHAR NOT NULL CHECK (plan_type IN ('pro')),
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  bulk_job_id INTEGER,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  meta_title VARCHAR(60) NOT NULL,
  meta_description VARCHAR(160) NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  keyword VARCHAR(100) NOT NULL,
  tags TEXT[],
  image_url VARCHAR,
  image_alt VARCHAR,
  schema JSONB,
  seo_score INTEGER DEFAULT 0,
  estimated_read_time INTEGER DEFAULT 0,
  word_count INTEGER DEFAULT 0,
  status VARCHAR DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  target_country VARCHAR(2) DEFAULT 'US',
  content_length VARCHAR DEFAULT 'medium' CHECK (content_length IN ('short', 'medium', 'long')),
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create admin user
INSERT INTO users (
  id, 
  email, 
  password,
  first_name,
  last_name,
  is_admin,
  unlimited_credits,
  grant_writing_access
) VALUES (
  'admin_user_1',
  'ottmar.francisca1969@gmail.com',
  '$2b$10$dummy.hash.for.initial.setup.replace.on.first.login',
  'Ottmar',
  'Francisca',
  true,
  true,
  true
) ON CONFLICT (email) DO NOTHING;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO PUBLIC;