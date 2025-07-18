# Quick Database Setup for Sofeia AI

## Your Database Connection URL:
```
postgresql://interactive17072025_db_user:fasySje46m5AhW2QbvAMpWtnrkiGaGPT@dpg-d1t02aumcj7s73b0f2c0-a.oregon-postgres.render.com/interactive17072025_db
```

## Step-by-Step Database Setup

### Option A: Using Render Web Shell (EASIEST)
1. Go to your **Render Dashboard**
2. Click on your **Web Service** (not the database)
3. Click **"Shell"** tab
4. Type: `npm run db:push`
5. Press Enter and wait for completion

### Option B: Using psql Command Line (if you have it installed)
```bash
psql "postgresql://interactive17072025_db_user:fasySje46m5AhW2QbvAMpWtnrkiGaGPT@dpg-d1t02aumcj7s73b0f2c0-a.oregon-postgres.render.com/interactive17072025_db"
```
Then copy and paste the SQL from init-db.sql

### Option C: Using Online Database Client
1. Go to: https://www.db-fiddle.com/ or https://www.sqliteviewer.app/
2. Select "PostgreSQL"
3. Use connection details:
   - Host: `dpg-d1t02aumcj7s73b0f2c0-a.oregon-postgres.render.com`
   - Database: `interactive17072025_db`
   - Username: `interactive17072025_db_user`
   - Password: `fasySje46m5AhW2QbvAMpWtnrkiGaGPT`
   - Port: `5432`

## What This Will Do:
- Create all required tables (users, conversations, messages, etc.)
- Set up proper indexes and constraints
- Create your admin account with full privileges
- Initialize the authentication system

## Expected Result:
After setup, your registration form will work and you'll be able to:
- Register new accounts successfully
- Login with created accounts
- Access all AI features
- Use the full Sofeia AI platform

**RECOMMENDED: Try Option A first (Render Web Shell) as it's the simplest and most reliable method.**