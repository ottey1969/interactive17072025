# Render Deployment Guide for Sofeia AI

## Why Render is Best for Your Project
- **✅ Free PostgreSQL database** (managed, no setup needed)
- **✅ Automatic builds** from GitHub
- **✅ Environment variables** easy setup
- **✅ HTTPS certificates** automatic
- **✅ Real-time applications** supported
- **✅ Node.js/Express** native support

## Step-by-Step Deployment

### 1. Prepare GitHub Repository
1. Go to [GitHub.com](https://github.com) and create new repository called `sofeia-ai`
2. Upload your `sofeia-ai-github.tar.gz` file or extract and push files
3. Make sure these files are in the root:
   - `package.json`
   - `client/` folder
   - `server/` folder
   - `shared/` folder

### 2. Create Render Account & Database
1. Go to [render.com](https://render.com) and sign up (free)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure database:
   - **Name**: `sofeia-ai-db`
   - **Database**: `sofeia_ai`
   - **User**: `sofeia_user`
   - **Region**: Select closest to your users
   - **Plan**: Free (sufficient for testing)
4. Click **"Create Database"**
5. **IMPORTANT**: Copy the **External Database URL** (starts with `postgresql://`)

### 3. Deploy Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository `sofeia-ai`
3. Configure deployment:
   - **Name**: `sofeia-ai-app`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (upgrade later if needed)

### 4. Set Environment Variables
In Render dashboard, go to your web service → **Environment** tab and add:

```
NODE_ENV=production
DATABASE_URL=[paste your PostgreSQL External Database URL here]
SESSION_SECRET=your-super-secret-session-key-here
ANTHROPIC_API_KEY=[your Anthropic API key]
GROQ_API_KEY=[your Groq API key] 
PERPLEXITY_API_KEY=[your Perplexity API key]
PORT=10000
```

### 5. Get Your API Keys
You'll need these API keys for full functionality:

**Anthropic (Required for main AI):**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up and get $5 free credits
3. Go to **"API Keys"** → **"Create Key"**
4. Copy your key (starts with `sk-ant-`)

**Groq (Required for fast responses):**
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up (free tier available)
3. Go to **"API Keys"** → **"Create API Key"**
4. Copy your key

**Perplexity (Required for research):**
1. Go to [perplexity.ai](https://www.perplexity.ai/settings/api)
2. Sign up and get free credits
3. Create API key
4. Copy your key

### 6. Deploy & Test
1. Click **"Create Web Service"** in Render
2. Wait 5-10 minutes for build and deployment
3. Render will give you a URL like: `https://sofeia-ai-app.onrender.com`
4. Test login with: `test@test.com` / `password123`

### 7. Database Setup
Your app will automatically create database tables on first run. If you need to manually run migrations:
1. Go to Render Dashboard → Your Service → **"Shell"**
2. Run: `npm run db:push`

## Alternative Platforms

### Vercel (Frontend-focused, requires serverless adaptation)
- ❌ **Not recommended** - Your Express server needs adaptation
- ✅ Good for: Static sites, Next.js
- Database: Need external provider

### Railway (Similar to Render)
- ✅ **Good alternative** - Similar to Render
- ✅ PostgreSQL included
- ❌ Less generous free tier

### Heroku
- ❌ **No longer free**
- ✅ PostgreSQL add-on available
- ❌ More expensive than alternatives

## Troubleshooting Common Issues

### Build Fails
- Check `package.json` has all dependencies
- Ensure Node.js version compatibility
- Verify build script: `"build": "npm run build:client && npm run build:server"`

### Database Connection Issues
- Verify `DATABASE_URL` is correctly set
- Check database is in same region as web service
- Ensure database allows external connections

### API Keys Not Working
- Double-check each API key is valid
- Verify environment variables are saved
- Restart web service after adding keys

### App Loads But Errors
- Check Render logs: Dashboard → Service → **"Logs"**
- Common issue: Missing environment variables
- Verify all required API keys are configured

## Cost Breakdown

### Free Tier (Perfect for Testing)
- **Render Web Service**: Free (sleeps after 15min inactivity)
- **PostgreSQL**: Free (1GB storage)
- **Custom Domain**: Free HTTPS
- **Total**: $0/month

### Production Tier (Recommended)
- **Render Web Service**: $7/month (always on, faster)
- **PostgreSQL**: $7/month (more storage, backup)
- **Total**: $14/month

## Your Live App URL
After deployment, you'll get a URL like:
`https://sofeia-ai-app.onrender.com`

This URL will be your live Sofeia AI platform accessible worldwide!