# Registration Fix for Render Deployment

## The Issue
Registration is failing with "Internal server error" which indicates:
1. Database schema may not be properly initialized
2. User creation process may have validation issues
3. Database connection issues in production

## Immediate Solutions

### Solution 1: Initialize Database Schema
Run this command in your Render dashboard Shell:
```bash
npm run db:push
```

### Solution 2: Environment Variable Check
Ensure these are properly set in Render:
```
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
NODE_ENV=production
SESSION_SECRET=your-secret-key-at-least-32-characters
```

### Solution 3: Create Simple Test User
Try registering with simpler data first:
- Email: `test@test.com`
- Password: `password123`
- First Name: `Test`
- Last Name: `User`

## Quick Database Setup

If the database tables don't exist, add this to your server startup code:

```sql
-- Run in Render Database Shell
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  first_name VARCHAR,
  last_name VARCHAR,
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
```

## Debugging Steps

1. **Check Render Logs:**
   - Go to your Render dashboard
   - Click on your web service
   - Go to "Logs" tab
   - Look for error messages during registration attempt

2. **Test Database Connection:**
   - Visit: `https://your-app.onrender.com/api/health`
   - Should return: `{"status":"healthy"}`

3. **Manual Database Setup:**
   - Go to Render Database dashboard
   - Use "Connect" to access database shell
   - Run: `\dt` to list tables
   - Run database creation commands if tables missing

## Expected Result
After applying the fix:
- Registration completes successfully
- User is created in database
- Automatic login occurs
- Redirect to main application

The most likely issue is that the database schema hasn't been properly initialized in the production environment.