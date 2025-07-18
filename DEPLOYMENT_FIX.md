# Deployment Fix for Render

## Files to Add to Your GitHub Repository

To fix the deployment issues you're experiencing, add these files to your GitHub repository:

### 1. Updated server/index.ts (PORT Configuration)
The server now properly uses the PORT environment variable that Render provides.

### 2. Updated server/db.ts (SSL Configuration) 
Added SSL configuration for production database connections.

### 3. New Files Added:
- `render.yaml` - Render deployment configuration
- `Dockerfile` - Alternative containerized deployment option
- `server/config.ts` - Production configuration settings
- `.env.example` - Environment variable template

### 4. Health Check Endpoint
Added `/api/health` endpoint that Render can use to verify your app is running.

## Steps to Fix Your Deployment:

### Step 1: Update Your GitHub Repository
1. Add all the new/updated files to your GitHub repository
2. Push the changes

### Step 2: Update Environment Variables in Render
Make sure these environment variables are set in your Render dashboard:

```
NODE_ENV=production
PORT=10000
DATABASE_URL=[your PostgreSQL External Database URL from Render]
SESSION_SECRET=your-super-secret-session-key-here-minimum-32-characters
ANTHROPIC_API_KEY=[your Anthropic API key]
GROQ_API_KEY=[your Groq API key]
PERPLEXITY_API_KEY=[your Perplexity API key]
```

### Step 3: Redeploy
1. Go to your Render dashboard
2. Click "Manual Deploy" on your web service
3. Wait for the deployment to complete

### Step 4: Test the Fix
Your app should now load properly at your Render URL. You can test:
1. Health check: `https://your-app.onrender.com/api/health`
2. Login page: `https://your-app.onrender.com/auth`

## Common Issues Fixed:

1. **ECONNREFUSED Error**: Fixed by properly configuring PORT and host binding
2. **Database Connection**: Added SSL configuration for production
3. **Session Issues**: Updated session configuration for production environment
4. **Health Checks**: Added endpoint for Render to monitor app health

## If You Still Have Issues:

1. Check Render logs in your dashboard under "Logs" tab
2. Verify all environment variables are correctly set
3. Make sure your DATABASE_URL includes the correct SSL parameters
4. Ensure your API keys are valid and have sufficient credits

The login should now work properly with `test@test.com` and any password you set during registration.