import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { getSecurityStats, trackDevice, getIncognitoDetectionScript, addToWhitelist, removeFromWhitelist, addToBlacklist, removeFromBlacklist, clearAllBlacklist } from "./security";
import { researchKeywords, analyzeCompetitors, findAIOverviewOpportunities } from "./services/perplexity";
import { analyzeContent, generateContent, craftStrategy } from "./services/anthropic";
import { generateWithGroq, GRANT_WRITING_SYSTEM_PROMPT } from "./groq-service";
import { getSystemPrompt } from "./services/prompts";
import { getResearchData } from "./research-service";
import { insertMessageSchema, insertConversationSchema, insertBlogPostSchema, insertBulkBlogJobSchema } from "@shared/schema";

interface WebSocketClient extends WebSocket {
  conversationId?: number;
  userId?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for deployment platforms
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // Setup local authentication system
  setupAuth(app);
  console.log("✅ Local authentication system configured successfully");

  // Demo user route for unauthenticated access
  app.get('/api/auth/demo-user', async (req: any, res) => {
    try {
      // Always return demo user for this endpoint
      return res.json({
        id: 'demo_user',
        email: 'demo@example.com',
        firstName: 'Demo',
        lastName: 'User',
        isPremium: false,
        dailyQuestionsUsed: 0,
        lastQuestionDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error getting demo user:", error);
      res.status(500).json({ message: "Failed to get demo user" });
    }
  });

  // The /api/user route is now handled by auth.ts
  
  // Update other auth-dependent routes to use req.user directly
  app.get('/api/auth/user-legacy', async (req: any, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        // Return demo user for unauthenticated users
        return res.json({
          id: 'demo_user',
          email: 'demo@example.com',
          firstName: 'Demo',
          lastName: 'User',
          isPremium: false,
          dailyQuestionsUsed: 0,
          lastQuestionDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      // Check if daily questions need to be reset
      const today = new Date();
      const lastQuestionDate = user?.lastQuestionDate ? new Date(user.lastQuestionDate) : null;
      
      if (!lastQuestionDate || lastQuestionDate.toDateString() !== today.toDateString()) {
        await storage.resetDailyQuestions(userId);
        const updatedUser = await storage.getUser(userId);
        return res.json(updatedUser);
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin routes for user management
  app.get("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is admin - handle multiple authentication formats
      let user = await storage.getUser(req.user.id);
      
      // If not found by ID, try to find by email
      if (!user && req.user.email) {
        user = await storage.getUserByEmail(req.user.email);
      }
      
      // Special handling for admin email
      if (req.user.email === 'ottmar.francisca1969@gmail.com') {
        // Auto-grant admin privileges for this email
        if (!user) {
          user = await storage.getUserByEmail('ottmar.francisca1969@gmail.com');
        }
        if (user && !user.isAdmin) {
          await storage.updateUser(user.id, { isAdmin: true, isPremium: true, unlimitedCredits: true });
          user = await storage.getUser(user.id); // Refresh user data
        }
      }
      
      if (!user?.isAdmin && user?.email !== 'ottmar.francisca1969@gmail.com') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/add-credits", isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is admin - handle multiple authentication formats
      let adminUser = await storage.getUser(req.user.id);
      
      // If not found by ID, try to find by email
      if (!adminUser && req.user.email) {
        adminUser = await storage.getUserByEmail(req.user.email);
      }
      
      // Special handling for admin email
      if (req.user.email === 'ottmar.francisca1969@gmail.com') {
        if (!adminUser) {
          adminUser = await storage.getUserByEmail('ottmar.francisca1969@gmail.com');
        }
        if (adminUser && !adminUser.isAdmin) {
          await storage.updateUser(adminUser.id, { isAdmin: true, isPremium: true, unlimitedCredits: true });
          adminUser = await storage.getUser(adminUser.id);
        }
      }
      
      if (!adminUser?.isAdmin && adminUser?.email !== 'ottmar.francisca1969@gmail.com') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { email, credits } = req.body;
      if (!email || !credits || credits <= 0) {
        return res.status(400).json({ message: "Valid email and credit amount required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.addCreditsToUser(user.id, credits);
      res.json({ message: "Credits added successfully" });
    } catch (error) {
      console.error("Error adding credits:", error);
      res.status(500).json({ message: "Failed to add credits" });
    }
  });

  app.post("/api/admin/toggle-premium", isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is admin
      const adminUser = await storage.getUser(req.user.id);
      if (!adminUser?.isAdmin && adminUser?.email !== 'ottmar.francisca1969@gmail.com') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { email, isPremium } = req.body;
      if (!email || typeof isPremium !== 'boolean') {
        return res.status(400).json({ message: "Valid email and premium status required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.updateUserPremiumStatus(user.id, isPremium);
      res.json({ message: "Premium status updated successfully" });
    } catch (error) {
      console.error("Error updating premium status:", error);
      res.status(500).json({ message: "Failed to update premium status" });
    }
  });

  // PayPal routes (will show proper error if API keys not configured)
  app.get("/api/paypal/setup", async (req, res) => {
    try {
      await loadPaypalDefault(req, res);
    } catch (error) {
      res.status(500).json({ message: "PayPal API keys not configured. Please add your PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET." });
    }
  });

  app.post("/api/paypal/order", async (req, res) => {
    try {
      await createPaypalOrder(req, res);
    } catch (error) {
      res.status(500).json({ message: "PayPal API keys not configured. Please add your PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET." });
    }
  });

  app.post("/api/paypal/order/:orderID/capture", async (req, res) => {
    try {
      await capturePaypalOrder(req, res);
    } catch (error) {
      res.status(500).json({ message: "PayPal API keys not configured. Please add your PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET." });
    }
  });

  // Blog generation routes (Free for admin, requires payment for subscribers)
  app.post("/api/blog/generate", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || 'demo_user';
      let user = null;
      
      if (userId !== 'demo_user') {
        user = await storage.getUser(userId);
      }
      
      // Check access rights (admin has free access, others need premium)
      const isAdmin = user?.isAdmin || user?.email === 'ottmar.francisca1969@gmail.com';
      const isPremium = user?.isPremium || isAdmin;
      
      if (!isPremium && userId !== 'demo_user') {
        return res.status(403).json({ 
          message: "Blog generation requires Pro subscription or admin access" 
        });
      }

      const { keyword, topic, targetCountry = 'US', contentLength = 'medium', includeImages = true } = req.body;
      
      if (!keyword) {
        return res.status(400).json({ message: "Keyword is required" });
      }

      // Generate blog post content using AI services
      const blogContent = await generateSEOBlogPost({
        keyword,
        topic,
        targetCountry,
        contentLength,
        includeImages,
        userId
      });

      res.json(blogContent);
    } catch (error) {
      console.error("Blog generation error:", error);
      res.status(500).json({ message: "Failed to generate blog post" });
    }
  });

  app.post("/api/blog/bulk-generate", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || 'demo_user';
      let user = null;
      
      if (userId !== 'demo_user') {
        user = await storage.getUser(userId);
      }
      
      // Check access rights for bulk features
      const isAdmin = user?.isAdmin || user?.email === 'ottmar.francisca1969@gmail.com';
      const isPremium = user?.isPremium || isAdmin;
      const isAgency = user?.subscriptionType?.includes('agency') || isAdmin;
      
      if (!isPremium && userId !== 'demo_user') {
        return res.status(403).json({ 
          message: "Bulk blog generation requires Pro subscription (150 questions/day) or Agency subscription (unlimited)" 
        });
      }
      
      // Check monthly limits for Pro and Agency users (Admin has unlimited)
      if (isPremium && !isAdmin) {
        // Check if we need to reset monthly questions
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
        let monthlyQuestionsUsed = user?.monthlyQuestionsUsed || 0;
        
        // Reset questions if it's a new month
        if (user?.currentMonth !== currentMonth) {
          monthlyQuestionsUsed = 0;
          await storage.resetMonthlyQuestions(userId);
        }
        
        const isPremiumAgency = user?.subscriptionType?.includes('premium-agency');
        if (isPremiumAgency && monthlyQuestionsUsed >= 1500) {
          return res.status(429).json({ 
            message: "Monthly question limit reached (1500/month). Contact support for enterprise solutions.",
            showUpgrade: false
          });
        } else if (isAgency && !isPremiumAgency && monthlyQuestionsUsed >= 500) {
          return res.status(429).json({ 
            message: "Monthly question limit reached (500/month). Upgrade to Premium Agency for 1500 questions/month.",
            showUpgrade: true
          });
        } else if (!isAgency && monthlyQuestionsUsed >= 150) {
          return res.status(429).json({ 
            message: "Monthly question limit reached (150/month). Upgrade to Agency for 500 questions/month.",
            showUpgrade: true
          });
        }
      }

      const validatedData = insertBulkBlogJobSchema.parse(req.body);
      
      // Create bulk job
      const job = await storage.createBulkBlogJob({
        ...validatedData,
        userId,
        totalPosts: validatedData.keywords.length,
        status: "pending"
      });

      // Start background processing
      processBulkBlogGeneration(job.id, userId);

      res.json(job);
    } catch (error) {
      console.error("Bulk blog generation error:", error);
      res.status(500).json({ message: "Failed to start bulk generation" });
    }
  });

  app.get("/api/blog/bulk-jobs", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || 'demo_user';
      let user = null;
      
      if (userId !== 'demo_user') {
        user = await storage.getUser(userId);
      }
      
      const isAdmin = user?.isAdmin || user?.email === 'ottmar.francisca1969@gmail.com';
      const isPremium = user?.isPremium || isAdmin;
      
      if (!isPremium && userId !== 'demo_user') {
        return res.status(403).json({ message: "Access denied" });
      }

      const jobs = await storage.getUserBulkBlogJobs(userId);
      res.json(jobs);
    } catch (error) {
      console.error("Get bulk jobs error:", error);
      res.status(500).json({ message: "Failed to fetch bulk jobs" });
    }
  });

  app.post("/api/blog/bulk-jobs/:jobId/publish", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || 'demo_user';
      let user = null;
      
      if (userId !== 'demo_user') {
        user = await storage.getUser(userId);
      }
      
      // Only admin can publish to website
      const isAdmin = user?.isAdmin || user?.email === 'ottmar.francisca1969@gmail.com';
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const jobId = parseInt(req.params.jobId);
      const posts = await storage.getBlogPostsByJobId(jobId);
      
      // Update all posts to published status
      for (const post of posts) {
        await storage.updateBlogPost(post.id, { 
          status: "published", 
          publishedAt: new Date() 
        });
      }

      res.json({ message: "Posts published successfully", count: posts.length });
    } catch (error) {
      console.error("Publish posts error:", error);
      res.status(500).json({ message: "Failed to publish posts" });
    }
  });

  app.get("/api/blog/bulk-jobs/:jobId/download", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || 'demo_user';
      let user = null;
      
      if (userId !== 'demo_user') {
        user = await storage.getUser(userId);
      }
      
      // Only admin can download
      const isAdmin = user?.isAdmin || user?.email === 'ottmar.francisca1969@gmail.com';
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const jobId = parseInt(req.params.jobId);
      const posts = await storage.getBlogPostsByJobId(jobId);
      
      // Create simple HTML export for now
      const htmlContent = posts.map(post => `
        <article>
          <h1>${post.title}</h1>
          <meta name="description" content="${post.metaDescription}">
          <div class="content">${post.content}</div>
          <div class="meta">Keywords: ${post.keyword} | SEO Score: ${post.seoScore}</div>
        </article>
        <hr>
      `).join('\n');
      
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="blog-posts-${jobId}.html"`);
      res.send(`<!DOCTYPE html><html><head><title>Blog Posts Export</title></head><body>${htmlContent}</body></html>`);
    } catch (error) {
      console.error("Download posts error:", error);
      res.status(500).json({ message: "Failed to download posts" });
    }
  });

  app.delete("/api/blog/bulk-jobs/:jobId", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || 'demo_user';
      let user = null;
      
      if (userId !== 'demo_user') {
        user = await storage.getUser(userId);
      }
      
      // Only admin can delete
      const isAdmin = user?.isAdmin || user?.email === 'ottmar.francisca1969@gmail.com';
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const jobId = parseInt(req.params.jobId);
      await storage.deleteBulkBlogJob(jobId);
      
      res.json({ message: "Job deleted successfully" });
    } catch (error) {
      console.error("Delete job error:", error);
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  // Subscription routes
  app.post("/api/subscriptions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { paypalSubscriptionId, planType } = req.body;

      const subscription = await storage.createSubscription({
        userId,
        paypalSubscriptionId,
        status: "active",
        planType,
      });

      // Update user to premium
      await storage.upsertUser({
        id: userId,
        isPremium: true,
      });

      res.json(subscription);
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  // Conversation routes - Allow demo mode
  app.get("/api/conversations", async (req: any, res) => {
    try {
      // Return demo conversations for demo users
      if (!req.isAuthenticated() || !req.user?.claims?.sub) {
        try {
          const demoConversations = await storage.getUserConversations("demo_user");
          return res.json(demoConversations);
        } catch (error) {
          return res.json([]);
        }
      }
      
      const userId = req.user.claims.sub;
      const conversations = await storage.getUserConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.post("/api/conversations", async (req: any, res) => {
    try {
      // For demo users, create a real conversation with demo_user
      if (!req.isAuthenticated() || !req.user?.claims?.sub) {
        // Ensure demo_user exists in database
        try {
          await storage.upsertUser({
            id: "demo_user",
            email: "demo@example.com",
            firstName: "Demo",
            lastName: "User",
            password: "demo_password_hash", // Required field
            isPremium: false,
            monthlyQuestionsUsed: 0,
            currentMonth: new Date().toISOString().slice(0, 7),
            isAdmin: false
          });
        } catch (upsertError) {
          console.error("Error creating demo user:", upsertError);
        }
        
        const conversation = await storage.createConversation("demo_user", {
          title: req.body.title || "New Chat"
        });
        
        return res.json(conversation);
      }
      
      const userId = req.user.claims.sub;
      
      // Validate request body
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ message: "Invalid request body" });
      }
      
      // Ensure user exists in database
      try {
        const user = await storage.getUser(userId);
        if (!user) {
          console.log("User not found, creating new user:", userId);
          await storage.upsertUser({
            id: userId,
            email: req.user.claims.email || null,
            firstName: req.user.claims.first_name || null,
            lastName: req.user.claims.last_name || null,
            profileImageUrl: req.user.claims.profile_image_url || null,
            isPremium: false,
            monthlyQuestionsUsed: 0,
            currentMonth: new Date().toISOString().slice(0, 7),
            isAdmin: userId === 'ottmar.francisca1969@gmail.com' || req.user.claims.email === 'ottmar.francisca1969@gmail.com'
          });
        }
      } catch (userError) {
        console.error("Error handling user:", userError);
        return res.status(500).json({ message: "Failed to initialize user" });
      }
      
      const validatedData = insertConversationSchema.parse(req.body);
      
      const conversation = await storage.createConversation(userId, { ...validatedData, userId });
      res.json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      
      // Provide more specific error messages
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid conversation data", 
          details: error.issues 
        });
      }
      
      res.status(500).json({ 
        message: "Failed to create conversation",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.get("/api/conversations/:id/messages", async (req: any, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const messages = await storage.getConversationMessages(conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.get("/api/conversations/:id/activities", async (req: any, res) => {
    try {
      // Return empty array for demo users
      if (!req.isAuthenticated() || !req.user?.claims?.sub) {
        return res.json([]);
      }
      
      const conversationId = parseInt(req.params.id);
      const activities = await storage.getConversationActivities(conversationId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // API Key validation endpoint
  app.get('/api/validate-keys', async (req, res) => {
    try {
      const { validateApiKeys } = await import('./api-key-validator');
      const results = await validateApiKeys();
      res.json(results);
    } catch (error) {
      console.error('Error validating API keys:', error);
      res.status(500).json({ error: 'Failed to validate API keys' });
    }
  });

  // Chat routes - Implement question limits
  app.post("/api/chat", async (req: any, res) => {
    try {
      const { conversationId, message, messageType, chatMode } = req.body;
      
      // Handle demo users
      if (!req.isAuthenticated() || !req.user?.claims?.sub) {
        // Track demo questions in session
        if (!req.session.demoQuestions) {
          req.session.demoQuestions = 0;
        }
        
        if (req.session.demoQuestions >= 3) {
          return res.status(429).json({ 
            message: "Daily question limit reached. Sign up for free to continue or upgrade to Pro for unlimited questions.",
            showUpgrade: true
          });
        }
        
        req.session.demoQuestions++;
        
        // Store user message for demo - use default conversation ID for demo users
        const demoConversationId = 1; // Use default conversation ID for demo users
        try {
          await storage.createMessage(demoConversationId, {
            role: "user",
            content: message
          });
        } catch (error) {
          console.error("Error storing demo user message:", error);
        }

        // Process REAL AI response for demo mode using actual APIs
        const detectedMessageType = categorizeMessage(message);
        console.log(`🎯 Demo mode processing with REAL APIs: "${message}" | Detected type: ${detectedMessageType}`);
        
        // Use the same real AI processing as authenticated users
        processAIResponse(demoConversationId, message, detectedMessageType, chatMode);
        return res.json({ 
          success: true, 
          message: "Processing your request with real AI...", 
          questionsRemaining: 3 - req.session.demoQuestions 
        });
      }
      
      const userId = req.user.claims.sub;
      
      // Check user's daily limit (skip for admin users)
      const user = await storage.getUser(userId);
      
      // Special case: if email is admin email, auto-upgrade to admin with unlimited credits
      if (req.user?.claims?.email === 'ottmar.francisca1969@gmail.com') {
        await storage.upsertUser({
          id: userId,
          email: req.user.claims.email,
          isAdmin: true,
          isPremium: true,
          unlimitedCredits: true,
          grantWritingAccess: true
        });
      }
      
      // Check if we need to reset monthly questions
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      let monthlyQuestionsUsed = user?.monthlyQuestionsUsed || 0;
      
      // Reset questions if it's a new month
      if (user?.currentMonth !== currentMonth) {
        monthlyQuestionsUsed = 0;
        await storage.resetMonthlyQuestions(userId);
      }
      
      if (user?.isAdmin || user?.unlimitedCredits) {
        // Admin users and users with unlimited credits have unlimited access
      } else if (!user?.isPremium) {
        // Free users: 3 questions per month (no overage allowed)
        if (monthlyQuestionsUsed >= 3) {
          return res.status(429).json({ 
            message: "Daily question limit reached (3/day). Contact WhatsApp for unlimited questions + advanced features.",
            showUpgrade: true,
            allowOverage: false
          });
        }
      } else if (user?.isPremium && !user?.subscriptionType?.includes('agency')) {
        // Pro users: 150 questions per month ($35/month)
        const monthlyLimit = 150;
        if (monthlyQuestionsUsed >= monthlyLimit) {
          return res.status(429).json({ 
            message: `Monthly question limit reached (${monthlyQuestionsUsed}/${monthlyLimit}). Contact WhatsApp for unlimited questions.`,
            showUpgrade: true,
            allowOverage: false
          });
        }
      } else if (user?.subscriptionType?.includes('premium-agency')) {
        // Premium Agency users: 1500 questions per month + overage at $0.25 per question
        if (monthlyQuestionsUsed >= 1500) {
          return res.status(200).json({ 
            message: `Question will be charged as overage ($0.25). You've used ${monthlyQuestionsUsed}/1500 included questions.`,
            showUpgrade: false,
            allowOverage: true,
            overageRate: 0.25
          });
        }
      } else if (user?.subscriptionType?.includes('agency')) {
        // Agency users: 500 questions per month + overage at $0.25 per question
        if (monthlyQuestionsUsed >= 500) {
          return res.status(200).json({ 
            message: `Question will be charged as overage ($0.25). You've used ${monthlyQuestionsUsed}/500 included questions.`,
            showUpgrade: true,
            allowOverage: true,
            overageRate: 0.25
          });
        }
      }

      // Create user message
      await storage.createMessage(conversationId, {
        role: "user",
        content: message,
        conversationId
      });
      
      // Update user's question count (skip for admin users)
      if (!user?.isAdmin) {
        const newCount = monthlyQuestionsUsed + 1;
        await storage.updateUserQuestionCount(userId, newCount);
        
        // Track overage questions for billing
        const limits = { free: 3, pro: 150, agency: 500, premiumAgency: 1500 };
        const userLimit = user?.subscriptionType?.includes('premium-agency') ? limits.premiumAgency :
                         user?.subscriptionType?.includes('agency') ? limits.agency :
                         user?.isPremium ? limits.pro : limits.free;
        
        if (newCount > userLimit && user?.isPremium) {
          const overageCount = (user?.overageQuestionsUsed || 0) + 1;
          await storage.updateUserOverageCount(userId, overageCount);
        }
      }

      // Process AI response asynchronously with message type and chat mode
      processAIResponse(conversationId, message, messageType, chatMode);
      
      // Calculate questions remaining based on subscription type
      let questionsRemaining;
      if (user?.isAdmin) {
        questionsRemaining = -1; // unlimited for admin
      } else if (user?.subscriptionType?.includes('premium-agency')) {
        questionsRemaining = Math.max(0, 1500 - monthlyQuestionsUsed - 1);
      } else if (user?.subscriptionType?.includes('agency')) {
        questionsRemaining = Math.max(0, 500 - monthlyQuestionsUsed - 1);
      } else if (user?.isPremium) {
        questionsRemaining = Math.max(0, 150 - monthlyQuestionsUsed - 1);
      } else {
        questionsRemaining = Math.max(0, 3 - monthlyQuestionsUsed - 1);
      }
      
      res.json({ 
        success: true, 
        message: "Processing your request...", 
        questionsRemaining 
      });
    } catch (error) {
      console.error("Error processing chat:", error);
      res.status(500).json({ message: "Failed to process chat" });
    }
  });

  // Research routes
  app.post("/api/research/keywords", isAuthenticated, async (req: any, res) => {
    try {
      const { topic, country } = req.body;
      const research = await researchKeywords(topic, country);
      res.json(research);
    } catch (error) {
      console.error("Error researching keywords:", error);
      res.status(500).json({ message: "Failed to research keywords" });
    }
  });

  app.post("/api/research/competitors", isAuthenticated, async (req: any, res) => {
    try {
      const { keyword, competitors } = req.body;
      const analysis = await analyzeCompetitors(keyword, competitors);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing competitors:", error);
      res.status(500).json({ message: "Failed to analyze competitors" });
    }
  });

  app.post("/api/research/ai-overview", isAuthenticated, async (req: any, res) => {
    try {
      const { topic } = req.body;
      const opportunities = await findAIOverviewOpportunities(topic);
      res.json(opportunities);
    } catch (error) {
      console.error("Error finding AI overview opportunities:", error);
      res.status(500).json({ message: "Failed to find AI overview opportunities" });
    }
  });

  // Content routes
  app.post("/api/content/analyze", isAuthenticated, async (req: any, res) => {
    try {
      const { content, keywords } = req.body;
      const analysis = await analyzeContent(content, keywords);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing content:", error);
      res.status(500).json({ message: "Failed to analyze content" });
    }
  });

  app.post("/api/content/generate", isAuthenticated, async (req: any, res) => {
    try {
      const { prompt, context } = req.body;
      const content = await generateContent(prompt, context);
      res.json({ content });
    } catch (error) {
      console.error("Error generating content:", error);
      res.status(500).json({ message: "Failed to generate content" });
    }
  });

  app.post("/api/content/strategy", isAuthenticated, async (req: any, res) => {
    try {
      const requirements = req.body;
      const strategy = await craftStrategy(requirements);
      res.json(strategy);
    } catch (error) {
      console.error("Error crafting strategy:", error);
      res.status(500).json({ message: "Failed to craft strategy" });
    }
  });

  // Admin routes
  const isAdmin = (req: any, res: any, next: any) => {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Check if user is admin by email
    const userEmail = req.user.claims.email;
    if (userEmail !== 'ottmar.francisca1969@gmail.com') {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    next();
  };

  // Temporary admin routes for testing (remove after auth is fixed)
  app.get("/api/admin/demo-users", async (req: any, res) => {
    try {
      const { email, limit = 50, offset = 0 } = req.query;
      const users = await storage.getAllUsers();
      
      let filteredUsers = users;
      if (email) {
        filteredUsers = users.filter(user => 
          user.email && user.email.toLowerCase().includes(email.toLowerCase())
        );
      }
      
      const paginatedUsers = filteredUsers.slice(
        parseInt(offset), 
        parseInt(offset) + parseInt(limit)
      );
      
      res.json({
        message: "Demo admin endpoint - all users",
        count: filteredUsers.length,
        total: users.length,
        users: paginatedUsers,
        hasMore: parseInt(offset) + parseInt(limit) < filteredUsers.length
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/demo-user-by-email/:email", async (req: any, res) => {
    try {
      const { email } = req.params;
      const users = await storage.getAllUsers();
      const user = users.find(u => u.email === email);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        message: "User found",
        user
      });
    } catch (error) {
      console.error("Error fetching user by email:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/admin/demo-grant-credits/:userId", async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { credits = 10 } = req.body;
      await storage.grantUserCredits(userId, credits);
      res.json({ 
        success: true, 
        message: `Demo: Granted ${credits} credits to user ${userId}` 
      });
    } catch (error) {
      console.error("Error granting credits:", error);
      res.status(500).json({ message: "Failed to grant credits" });
    }
  });

  app.post("/api/admin/demo-create-test-users", async (req: any, res) => {
    try {
      const testUsers = [
        {
          id: "user_admin_ottmar",
          email: "ottmar.francisca1969@gmail.com",
          firstName: "Ottmar",
          lastName: "Francisca",
          isPremium: true,
          isAdmin: true,
          dailyQuestionsUsed: 0
        },
        {
          id: "user_premium_john",
          email: "john.doe@example.com",
          firstName: "John",
          lastName: "Doe",
          isPremium: true,
          isAdmin: false,
          dailyQuestionsUsed: 5
        },
        {
          id: "user_free_jane",
          email: "jane.smith@example.com",
          firstName: "Jane",
          lastName: "Smith",
          isPremium: false,
          isAdmin: false,
          dailyQuestionsUsed: 2
        },
        {
          id: "user_free_mike",
          email: "mike.johnson@gmail.com",
          firstName: "Mike",
          lastName: "Johnson",
          isPremium: false,
          isAdmin: false,
          dailyQuestionsUsed: 3
        },
        {
          id: "user_premium_sarah",
          email: "sarah.wilson@company.com",
          firstName: "Sarah",
          lastName: "Wilson",
          isPremium: true,
          isAdmin: false,
          dailyQuestionsUsed: 15
        }
      ];

      for (const userData of testUsers) {
        await storage.upsertUser(userData);
      }

      res.json({ 
        success: true, 
        message: `Created ${testUsers.length} test users`,
        users: testUsers.map(u => ({ id: u.id, email: u.email, isPremium: u.isPremium, isAdmin: u.isAdmin }))
      });
    } catch (error) {
      console.error("Error creating test users:", error);
      res.status(500).json({ message: "Failed to create test users" });
    }
  });

  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users/:userId/premium", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { isPremium } = req.body;
      await storage.updateUserPremiumStatus(userId, isPremium);
      res.json({ success: true, message: `User premium status updated to ${isPremium}` });
    } catch (error) {
      console.error("Error updating user premium status:", error);
      res.status(500).json({ message: "Failed to update user premium status" });
    }
  });

  app.post("/api/admin/users/:userId/credits", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { credits } = req.body;
      await storage.grantUserCredits(userId, credits);
      res.json({ success: true, message: `Granted ${credits} credits to user` });
    } catch (error) {
      console.error("Error granting user credits:", error);
      res.status(500).json({ message: "Failed to grant user credits" });
    }
  });

  const httpServer = createServer(app);

  // Add reset context endpoint
  app.post("/api/reset-context", async (req: any, res) => {
    try {
      const { chatId } = req.body;
      console.log(`Resetting context for chat: ${chatId}`);
      // In a real app, this would clear any context associated with the chat
      res.json({ success: true, message: 'Context reset successfully' });
    } catch (error) {
      console.error("Error resetting context:", error);
      res.status(500).json({ message: "Failed to reset context" });
    }
  });

  // Auth0 protected endpoint example
  app.get("/api/protected", async (req: any, res) => {
    try {
      // For now, return success without Auth0 validation for demo purposes
      // In production, this would use the Auth0 JWT validation decorator
      res.json({ message: "This is a protected resource! You are authenticated." });
    } catch (error) {
      console.error("Error accessing protected route:", error);
      res.status(500).json({ message: "Failed to access protected resource" });
    }
  });

  // Security monitoring endpoints
  app.get("/api/security/stats", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const stats = getSecurityStats();
      res.json(stats);
    } catch (error) {
      console.error("Error getting security stats:", error);
      res.status(500).json({ message: "Failed to get security stats" });
    }
  });

  // Admin IP management endpoints
  app.post("/api/admin/whitelist-ip", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { ip } = req.body;
      if (!ip) {
        return res.status(400).json({ message: "IP address is required" });
      }
      
      addToWhitelist(ip);
      res.json({ message: `IP ${ip} added to whitelist` });
    } catch (error) {
      console.error("Error adding IP to whitelist:", error);
      res.status(500).json({ message: "Failed to add IP to whitelist" });
    }
  });

  app.delete("/api/admin/whitelist-ip", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { ip } = req.body;
      if (!ip) {
        return res.status(400).json({ message: "IP address is required" });
      }
      
      removeFromWhitelist(ip);
      res.json({ message: `IP ${ip} removed from whitelist` });
    } catch (error) {
      console.error("Error removing IP from whitelist:", error);
      res.status(500).json({ message: "Failed to remove IP from whitelist" });
    }
  });

  app.post("/api/admin/blacklist-ip", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { ip } = req.body;
      if (!ip) {
        return res.status(400).json({ message: "IP address is required" });
      }
      
      addToBlacklist(ip);
      res.json({ message: `IP ${ip} added to blacklist` });
    } catch (error) {
      console.error("Error adding IP to blacklist:", error);
      res.status(500).json({ message: "Failed to add IP to blacklist" });
    }
  });

  app.delete("/api/admin/blacklist-ip", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { ip } = req.body;
      if (!ip) {
        return res.status(400).json({ message: "IP address is required" });
      }
      
      removeFromBlacklist(ip);
      res.json({ message: `IP ${ip} removed from blacklist` });
    } catch (error) {
      console.error("Error removing IP from blacklist:", error);
      res.status(500).json({ message: "Failed to remove IP from blacklist" });
    }
  });

  app.post("/api/admin/clear-blacklist", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      clearAllBlacklist();
      res.json({ message: "All IPs cleared from blacklist" });
    } catch (error) {
      console.error("Error clearing blacklist:", error);
      res.status(500).json({ message: "Failed to clear blacklist" });
    }
  });

  // Incognito detection endpoint
  app.post("/api/security/incognito-detected", async (req: any, res) => {
    try {
      const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || 
                      req.headers['x-real-ip'] || 
                      req.connection.remoteAddress;
      
      console.log(`Incognito browsing detected from IP: ${clientIP}`);
      
      // For now, just log it. In production, you might want to:
      // - Block the request
      // - Require additional verification
      // - Add to suspicious activity log
      
      res.status(403).json({ 
        error: "Private browsing detected",
        message: "Please disable private/incognito browsing and try again"
      });
    } catch (error) {
      console.error("Error handling incognito detection:", error);
      res.status(500).json({ message: "Security check failed" });
    }
  });

  // Device registration endpoint
  app.post("/api/security/register-device", isAuthenticated, async (req: any, res) => {
    try {
      trackDevice(req, req.user.id);
      res.json({ message: "Device registered successfully" });
    } catch (error) {
      console.error("Error registering device:", error);
      res.status(500).json({ message: "Failed to register device" });
    }
  });

  // Security script endpoint for client-side detection
  app.get("/api/security/detection-script", (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(getIncognitoDetectionScript());
  });

  // WebSocket server for real-time AI activity updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocketClient, req) => {
    console.log('WebSocket client connected');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'join_conversation') {
          ws.conversationId = data.conversationId;
          ws.userId = data.userId;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  // Function to broadcast AI activity updates
  global.broadcastAIActivity = (conversationId: number, activity: any) => {
    console.log('Broadcasting activity:', JSON.stringify(activity, null, 2));
    
    wss.clients.forEach((client: WebSocketClient) => {
      if (client.readyState === WebSocket.OPEN && client.conversationId === conversationId) {
        if (activity.type === 'response_complete') {
          // Send response completion message directly
          client.send(JSON.stringify(activity));
        } else {
          // Send regular AI activity
          client.send(JSON.stringify({
            type: 'ai_activity',
            data: activity
          }));
        }
      }
    });
  };

  return httpServer;
}

// Blog generation helper functions
async function generateSEOBlogPost(params: {
  keyword: string;
  topic?: string;
  targetCountry: string;
  contentLength: 'short' | 'medium' | 'long';
  includeImages: boolean;
  userId: string;
}) {
  const { keyword, topic, targetCountry, contentLength, includeImages, userId } = params;
  
  // Research keywords and competitors using Perplexity
  const research = await researchKeywords(keyword, targetCountry);
  
  // Generate comprehensive content using Anthropic
  const contentPrompt = `
Create a comprehensive, SEO-optimized blog post with the following specifications:

PRIMARY KEYWORD: ${keyword}
${topic ? `TOPIC FOCUS: ${topic}` : ''}
TARGET COUNTRY: ${targetCountry}
CONTENT LENGTH: ${contentLength}
RESEARCH DATA: ${JSON.stringify(research, null, 2)}

Requirements:
1. Create an engaging, click-worthy title optimized for the primary keyword
2. Write a compelling meta description (150-160 characters)
3. Generate 8-10 relevant tags for categorization
4. Create SEO-optimized content with proper H1, H2, H3 structure
5. Include internal linking opportunities and call-to-actions
6. Optimize for featured snippets and voice search
7. Calculate estimated read time and SEO score (0-100)
8. Generate JSON-LD schema markup for the article

CONTENT LENGTH GUIDELINES:
- Short: 800-1200 words with 3-5 H2 sections
- Medium: 1200-2000 words with 5-7 H2 sections
- Long: 2000-3500 words with 7-10 H2 sections

OUTPUT FORMAT (JSON):
{
  "title": "SEO-optimized blog post title",
  "slug": "url-friendly-slug",
  "metaTitle": "Title tag (55-60 chars)",
  "metaDescription": "Meta description (150-160 chars)",
  "content": "Full HTML blog post content with proper headings",
  "excerpt": "Brief summary (150-200 chars)",
  "keyword": "${keyword}",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "imageUrl": "${includeImages ? 'https://via.placeholder.com/1200x630/1e293b/ffffff?text=' + encodeURIComponent(keyword) : ''}",
  "imageAlt": "Alt text for featured image",
  "schema": { /* JSON-LD schema markup */ },
  "seoScore": 85,
  "estimatedReadTime": 5,
  "wordCount": 1200
}`;

  const response = await generateContent(contentPrompt);
  
  try {
    const blogData = JSON.parse(response);
    
    // Save to database if user is authenticated
    if (userId !== 'demo_user') {
      const blogPost = await storage.createBlogPost({
        userId,
        title: blogData.title,
        slug: blogData.slug,
        metaTitle: blogData.metaTitle,
        metaDescription: blogData.metaDescription,
        content: blogData.content,
        excerpt: blogData.excerpt,
        keyword: keyword,
        tags: blogData.tags || [],
        imageUrl: blogData.imageUrl,
        imageAlt: blogData.imageAlt,
        schema: blogData.schema,
        seoScore: blogData.seoScore || 0,
        estimatedReadTime: blogData.estimatedReadTime || 0,
        wordCount: blogData.wordCount || 0,
        targetCountry,
        contentLength,
        status: "draft"
      });
      
      return blogPost;
    }
    
    return blogData;
  } catch (error) {
    console.error("Error parsing blog response:", error);
    throw new Error("Failed to generate valid blog post data");
  }
}

async function processBulkBlogGeneration(jobId: number, userId: string) {
  try {
    const job = await storage.getBulkBlogJob(jobId);
    if (!job) return;

    // Check question limits before processing
    const user = await storage.getUser(userId);
    const currentMonth = new Date().toISOString().slice(0, 7);
    let monthlyQuestionsUsed = user?.monthlyQuestionsUsed || 0;
    
    // Reset questions if it's a new month
    if (user?.currentMonth !== currentMonth) {
      monthlyQuestionsUsed = 0;
      await storage.resetMonthlyQuestions(userId);
    }
    
    // Calculate remaining questions based on subscription
    const limits = { free: 3, pro: 150, agency: 500, premiumAgency: 1500 };
    const userLimit = user?.isAdmin ? Infinity :
                     user?.subscriptionType?.includes('premium-agency') ? limits.premiumAgency :
                     user?.subscriptionType?.includes('agency') ? limits.agency :
                     user?.isPremium ? limits.pro : limits.free;
    
    const remainingQuestions = Math.max(0, userLimit - monthlyQuestionsUsed);
    const questionsToGenerate = Math.min(job.keywords.length, remainingQuestions);
    
    if (questionsToGenerate === 0 && !user?.isAdmin) {
      await storage.updateBulkBlogJob(jobId, {
        status: "failed",
        processingCompleted: new Date(),
        completedPosts: 0,
        failedPosts: 0,
        limitReached: true
      });
      return;
    }

    // Update job status to processing
    await storage.updateBulkBlogJob(jobId, {
      status: "processing",
      processingStarted: new Date()
    });

    let completedPosts = 0;
    let failedPosts = 0;

    // Process each keyword (limited by question count)
    for (let i = 0; i < questionsToGenerate; i++) {
      const keyword = job.keywords[i];
      try {
        const blogPost = await generateSEOBlogPost({
          keyword: keyword.trim(),
          targetCountry: job.targetCountry,
          contentLength: job.contentLength,
          includeImages: true,
          userId
        });

        // Save blog post with job reference
        await storage.createBlogPost({
          ...blogPost,
          userId,
          bulkJobId: jobId,
          status: "draft"
        });

        completedPosts++;
        
        // Update user question count (skip for admin users)
        if (!user?.isAdmin) {
          const newCount = monthlyQuestionsUsed + completedPosts;
          await storage.updateUserQuestionCount(userId, newCount);
          
          // Track overage questions for billing
          if (newCount > userLimit && user?.isPremium) {
            const overageCount = (user?.overageQuestionsUsed || 0) + Math.max(0, newCount - userLimit);
            await storage.updateUserOverageCount(userId, overageCount);
          }
        }
        
        // Update job progress
        await storage.updateBulkBlogJob(jobId, {
          completedPosts,
          failedPosts,
          questionsUsed: completedPosts,
          limitReached: completedPosts === questionsToGenerate && questionsToGenerate < job.keywords.length
        });

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Failed to generate post for keyword "${keyword}":`, error);
        failedPosts++;
        
        await storage.updateBulkBlogJob(jobId, {
          completedPosts,
          failedPosts
        });
      }
    }

    // Mark job as completed
    await storage.updateBulkBlogJob(jobId, {
      status: "completed",
      processingCompleted: new Date(),
      completedPosts,
      failedPosts
    });

  } catch (error) {
    console.error(`Bulk generation job ${jobId} failed:`, error);
    await storage.updateBulkBlogJob(jobId, {
      status: "failed",
      processingCompleted: new Date()
    });
  }
}

// Smart message categorization function
function categorizeMessage(message: string): 'simple' | 'analysis' | 'complex' {
  const trimmed = message.trim().toLowerCase();
  
  // MANUS AI MODE: Only ultra-simple greetings get instant responses
  // Everything else goes to full AI processing for comprehensive answers
  const simplePatterns = [
    /^(hi|hello|hey)$/i,                    // Just simple greetings
    /^(thanks|thank you)$/i,                // Just thanks
    /^(test)$/i                             // Just system test
  ];
  
  if (simplePatterns.some(pattern => pattern.test(trimmed)) && trimmed.length < 15) {
    return 'simple';
  }
  
  // Everything else gets full AI processing - like Manus AI
  // This includes:
  // - Programming questions (code, debugging, architecture)
  // - Math and science problems
  // - Business and strategy questions
  // - Creative writing requests
  // - Complex explanations
  // - Technical tutorials
  // - Research and analysis
  // - Problem solving
  return 'analysis';
}

// Demo AI response function - NOW USES REAL APIs
async function processDemoAIResponse(conversationId: number, userMessage: string, messageType?: string) {
  console.log(`🔄 DEMO MODE: Using REAL AI APIs for "${userMessage}"`);
  
  // Use the exact same real AI processing as authenticated users
  // This ensures demo users get the full experience with real Anthropic/Perplexity APIs
  return processAIResponse(conversationId, userMessage, messageType);
}

function getDetailedResponse(userMessage: string): string {
  const msg = userMessage.toLowerCase();
  
  if (msg.includes('seo') || msg.includes('content') || msg.includes('strategy')) {
    return `I can help you with comprehensive SEO content strategy for: "${userMessage}"\n\n**My expertise includes:**\n• Keyword research and analysis\n• Competitor content analysis\n• Google AI Overview optimization\n• Content structure and planning\n• SEO-optimized copywriting\n• Performance tracking strategies\n\nWould you like me to analyze a specific topic or help you develop a content plan? I can provide detailed keyword research and competitive analysis.\n\n🔥 **AI OVERVIEW OPTIMIZATION TIP:**\nIf AI Overview is found for your keywords, use this prompt with your content:\n> "Rewrite this to directly answer the query '[keyword with AI Overview]' in 2–3 concise, fact-based sentences optimized for Google's AI Overview format."\n\n**Demo Mode:** Sign up for the full Sofeia AI experience with unlimited questions and real-time research capabilities.`;
  }
  
  if (msg.includes('keyword') || msg.includes('research')) {
    return `For keyword research on "${userMessage}", I can provide:\n\n**Keyword Analysis:**\n• Search volume data\n• Competition analysis\n• Long-tail opportunities\n• Search intent mapping\n• Ranking difficulty assessment\n\n**Competitive Intelligence:**\n• Top-ranking content analysis\n• Content gap identification\n• SERP feature opportunities\n• AI Overview positioning\n\n🔥 **AI OVERVIEW OPTIMIZATION TIP:**\nIf AI Overview is found for your keywords, optimize your content with:\n> "Rewrite this to directly answer the query '[keyword with AI Overview]' in 2–3 concise, fact-based sentences optimized for Google's AI Overview format."\n\nWould you like me to perform detailed keyword research for a specific topic?\n\n**Demo Mode:** Upgrade for real-time Perplexity API integration and unlimited research.`;
  }
  
  return `I understand you're asking about: "${userMessage}"\n\nAs your AI content strategist, I can help with:\n• Content planning and strategy\n• SEO optimization techniques\n• Keyword research and analysis\n• Competitor analysis\n• Content performance optimization\n\nWhat specific aspect would you like me to focus on? I can provide detailed, actionable recommendations.\n\n**Demo Mode:** This is a simplified response. Sign up for advanced C.R.A.F.T framework analysis and unlimited questions.`;
}

async function processDemoComplexResponse(conversationId: number, userMessage: string) {
  console.log(`🔍 Complex/Analysis response for "${userMessage}" - starting phases...`);
  
  // Detailed analysis for complex questions
  setTimeout(() => {
    global.broadcastAIActivity?.(conversationId, {
      id: Date.now(),
      conversationId,
      phase: "research",
      status: "active",
      description: "Analyzing your question...",
      createdAt: new Date().toISOString()
    });
  }, 500);

  setTimeout(() => {
    global.broadcastAIActivity?.(conversationId, {
      id: Date.now() + 1,
      conversationId,
      phase: "analysis",
      status: "active", 
      description: "Processing with Sofeia AI...",
      createdAt: new Date().toISOString()
    });
  }, 1500);

  setTimeout(async () => {
    global.broadcastAIActivity?.(conversationId, {
      id: Date.now() + 2,
      conversationId,
      phase: "generation",
      status: "completed",
      description: "Response generated successfully",
      createdAt: new Date().toISOString()
    });
    
    // Store and send detailed response
    try {
      // Verify conversation exists
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        console.error('Conversation not found:', conversationId);
        return;
      }
      
      const assistantMessage = await storage.createMessage(conversationId, {
        role: 'assistant',
        content: getDetailedResponse(userMessage)
      });
      
      // Broadcast the response
      global.broadcastAIActivity?.(conversationId, {
        type: 'response_complete',
        message: assistantMessage
      });
    } catch (error) {
      console.error('Error storing detailed response:', error);
    }
  }, 3000);
}

function getSimpleResponse(userMessage: string): string {
  const msg = userMessage.toLowerCase().trim();
  
  // Only provide simple responses for basic greetings - everything else gets full AI processing
  if (msg === 'hi' || msg === 'hello' || msg === 'hey') {
    return "Hello! I'm ready to help with any writing, analysis, or creative task. What would you like me to work on?";
  }
  
  // All other messages should be processed by AI for actual content generation
  return null; // This will force full AI processing
}

async function processAIResponse(conversationId: number, userMessage: string, messageType?: string, chatMode?: string) {
  try {
    // Determine message type if not provided
    const actualMessageType = messageType || categorizeMessage(userMessage);
    
    // Handle simple messages immediately without research phases
    if (actualMessageType === 'simple') {
      const simpleResponse = getSimpleResponse(userMessage);
      
      // Only use simple response if it's not null (meaning it's a basic greeting)
      if (simpleResponse !== null) {
        // Store AI response immediately
        await storage.createMessage(conversationId, {
          role: "assistant",
          content: simpleResponse,
          conversationId
        });

        // Broadcast simple completion
        global.broadcastAIActivity?.(conversationId, {
          type: "response_complete",
          message: simpleResponse
        });
        
        return;
      }
      // If simpleResponse is null, continue to full AI processing
    }
    
    // Create research phase activity for complex queries only
    const researchActivity = await storage.createAIActivity({
      conversationId,
      phase: "research",
      status: "active",
      description: actualMessageType === 'complex' ? "Researching and analyzing..." : "Analyzing your request..."
    });

    global.broadcastAIActivity?.(conversationId, researchActivity);

    // Determine if this is a grant writing request - expanded patterns for better detection
    const isGrantWritingRequest = /grant|proposal|funding|NIH|NSF|foundation|research proposal|award|fellowship|SBIR|STTR|R01|R21|K award|postdoc|fellowship|dissertation|thesis|academic|research|science|innovation|startup funding|venture capital/i.test(userMessage);
    
    // Determine if this is a keyword research request
    const isKeywordRequest = /keywords?|SEO|search|rank|compete/i.test(userMessage);
    
    let aiResponse = "";

    // Determine the appropriate system prompt based on chat mode
    const systemPrompt = getSystemPrompt(chatMode || 'manus_pro');
    let useGroqFirst = false;
    
    switch (chatMode) {
      case 'manus':
      case 'manus_pro':
        useGroqFirst = true;
        console.log(`🚀 MANUS PRO MODE - Ultimate autonomous research & analysis`);
        break;
        
      case 'grant':
      case 'grant_writing':
        useGroqFirst = true;
        console.log(`📝 GRANT WRITING MODE - Elite grant proposal mastery`);
        break;
        
      case 'seo':
      case 'seo_content':
        useGroqFirst = true;
        console.log(`🎯 SEO MODE - Advanced content strategy`);
        break;
        
      case 'replit':
      case 'replit_pro':
        useGroqFirst = true;
        console.log(`💻 REPLIT PRO MODE - Master full-stack development`);
        break;
        
      default: // fallback to manus
        useGroqFirst = true;
        console.log(`🚀 DEFAULT MODE - Manus Pro universal AI`);
        break;
    }

    if (isGrantWritingRequest || chatMode === 'grant') {
      // OPTIMIZED: Use Groq directly for grant writing - it's faster and more specialized
      await storage.updateAIActivity(researchActivity.id, "active", {
        step: "groq_grant_writing",
        description: `Processing with optimized ${chatMode || 'grant'} writing AI...`
      });

      const groqResponse = await generateWithGroq(userMessage, systemPrompt);
      
      if (groqResponse.success) {
        // Groq succeeded - use its response (much faster!)
        aiResponse = groqResponse.content || "";
        await storage.updateAIActivity(researchActivity.id, "completed");
      } else {
        // Fallback to Claude for grant writing if Groq fails
        await storage.updateAIActivity(researchActivity.id, "active", {
          step: "claude_fallback", 
          description: `Using Claude AI for ${chatMode || 'grant'} writing assistance...`
        });

        aiResponse = await generateContent(systemPrompt);
        await storage.updateAIActivity(researchActivity.id, "completed");
      }
    } else if (isKeywordRequest) {
      // Update research activity
      await storage.updateAIActivity(researchActivity.id, "active", {
        step: "keyword_research",
        description: "Performing keyword research with Perplexity AI..."
      });

      // Extract topic from user message
      const topic = userMessage.replace(/give me|find|keywords?|best|for|website|this/gi, '').trim();
      
      // Research keywords with fallback
      let keywordResearch;
      try {
        keywordResearch = await researchKeywords(topic);
        await storage.updateAIActivity(researchActivity.id, "completed");
      } catch (error) {
        console.log('Perplexity research failed, using AI fallback:', error.message);
        // Fallback: Use Groq to generate keyword research
        await storage.updateAIActivity(researchActivity.id, "active", {
          step: "ai_keyword_research",
          description: "Generating keyword research with AI fallback..."
        });
        
        const groqKeywordPrompt = `Generate comprehensive SEO keyword research for: "${topic}"
        
        Provide:
        1. 10-15 relevant keywords with estimated search volumes
        2. Competition analysis (low/medium/high)
        3. Long-tail keyword opportunities
        4. Related search terms
        5. Content strategy recommendations
        
        Format as structured data with clear categories.`;
        
        const groqResponse = await generateWithGroq(groqKeywordPrompt);
        
        // Create mock structured data from Groq response
        keywordResearch = {
          keywords: [
            { keyword: topic, volume: "Medium", competition: "Medium", intent: "informational" },
            { keyword: `${topic} strategy`, volume: "Low", competition: "Low", intent: "informational" },
            { keyword: `best ${topic}`, volume: "High", competition: "High", intent: "commercial" }
          ],
          topPages: [
            { title: `Ultimate Guide to ${topic}`, url: "example.com", hasAIOverview: false },
            { title: `${topic} Best Practices`, url: "example2.com", hasAIOverview: false }
          ],
          content: groqResponse.content || "Keyword research completed with AI assistant."
        };
        
        await storage.updateAIActivity(researchActivity.id, "completed");
      }

      // Create analysis phase
      const analysisActivity = await storage.createAIActivity({
        conversationId,
        phase: "analysis",
        status: "active",
        description: "Analyzing keyword opportunities and competition..."
      });

      global.broadcastAIActivity?.(conversationId, analysisActivity);

      // Analyze competitors for top keywords with fallback
      const topKeyword = keywordResearch.keywords[0]?.keyword || topic;
      let competitorAnalysis;
      try {
        competitorAnalysis = await analyzeCompetitors(topKeyword);
      } catch (error) {
        console.log('Competitor analysis failed, using AI fallback:', error.message);
        // Create basic competitor analysis structure
        competitorAnalysis = {
          competitors: [
            { domain: "competitor1.com", title: `Leading ${topic} Resource` },
            { domain: "competitor2.com", title: `${topic} Expert Guide` }
          ],
          analysis: `AI-generated competitor analysis for ${topKeyword}`
        };
      }

      await storage.updateAIActivity(analysisActivity.id, "completed");

      // Create strategy phase
      const strategyActivity = await storage.createAIActivity({
        conversationId,
        phase: "strategy",
        status: "active",
        description: "Crafting comprehensive SEO strategy..."
      });

      global.broadcastAIActivity?.(conversationId, strategyActivity);

      // Check if any keywords have AI Overview opportunities and create optimization prompt
      const keywordsWithAIOverview = keywordResearch.topPages.filter(page => page.hasAIOverview);
      const aiOverviewKeywords = keywordResearch.keywords.filter(k => 
        keywordsWithAIOverview.some(page => page.title.toLowerCase().includes(k.keyword.toLowerCase()))
      );
      
      const aiOverviewPrompt = aiOverviewKeywords.length > 0 ? `

🔥 **AI OVERVIEW OPTIMIZATION TIP:**
AI Overview found for: ${aiOverviewKeywords.map(k => k.keyword).join(', ')}

Now do this:
Paste your article into Perplexity or Anthropic with this prompt: 💪
> "Rewrite this to directly answer the query '[${aiOverviewKeywords[0].keyword}]' in 2–3 concise, fact-based sentences optimized for Google's AI Overview format."

AI will give you a cleaner, more AI-friendly version.
This small tweak = higher visibility in AI Overviews.` : '';

      // Try to generate SEO strategy with fallback
      try {
        aiResponse = await generateContent(`Based on this keyword research and competitor analysis, provide a comprehensive SEO strategy:

Keyword Research Results:
${JSON.stringify(keywordResearch, null, 2)}

Competitor Analysis:
${JSON.stringify(competitorAnalysis, null, 2)}

User Query: ${userMessage}

Provide actionable recommendations following the C.R.A.F.T framework.

IMPORTANT: Include the AI Overview optimization tip at the end of your response:
${aiOverviewPrompt}`);
      } catch (error) {
        console.log('Claude SEO generation failed, using Groq fallback:', error.message);
        const groqSeoPrompt = `Generate comprehensive SEO strategy for: "${userMessage}"
        
Based on the keyword research for "${topic}", provide:
1. Content optimization recommendations
2. Keyword targeting strategy
3. Competitive analysis insights
4. Technical SEO improvements
5. Content calendar suggestions

Focus on actionable, practical advice that can be implemented immediately.`;
        
        const groqSeoResponse = await generateWithGroq(groqSeoPrompt);
        aiResponse = groqSeoResponse.content || generateBasicSeoResponse(topic);
      }

      await storage.updateAIActivity(strategyActivity.id, "completed");
    } else {
      // General content generation - OPTIMIZED for speed with chat mode prompts
      await storage.updateAIActivity(researchActivity.id, "active", {
        step: "groq_content_generation",
        description: `Generating optimized ${chatMode || 'general'} content response...`
      });

      // Primary: Use Groq for all content generation (fast and reliable)
      const groqResponse = await generateWithGroq(userMessage, systemPrompt);
      
      if (groqResponse.success) {
        // Groq succeeded - use its fast response
        aiResponse = groqResponse.content || "";
        await storage.updateAIActivity(researchActivity.id, "completed");
      } else if (groqResponse.needsResearch) {
        // Groq indicates it needs research - use Perplexity for research then Groq again
        await storage.updateAIActivity(researchActivity.id, "active", {
          step: "perplexity_research", 
          description: `Gathering research data via Perplexity API...`
        });

        // Get research data from Perplexity
        const researchData = await getResearchData(userMessage);
        
        // Combine research with user message for Groq
        const enhancedPrompt = `${systemPrompt}

Research Context:
${researchData}

User request: ${userMessage}

Please provide a comprehensive response using the research context above.`;

        const enhancedGroqResponse = await generateWithGroq(enhancedPrompt, systemPrompt);
        
        if (enhancedGroqResponse.success) {
          aiResponse = enhancedGroqResponse.content || "";
        } else {
          // If still failing, provide helpful error
          aiResponse = "I'm having trouble accessing the research data right now. Please try again or check the API key configuration.";
        }
        
        await storage.updateAIActivity(researchActivity.id, "completed");
      } else {
        // Groq failed - try Claude fallback
        await storage.updateAIActivity(researchActivity.id, "active", {
          step: "claude_fallback", 
          description: `Using Claude AI for ${chatMode || 'general'} content assistance...`
        });

        try {
          aiResponse = await generateContent(systemPrompt + '\n\nUser request: ' + userMessage);
        } catch (claudeError) {
          console.log('Claude also failed, using basic response:', claudeError.message);
          // Ultimate fallback - basic but functional response
          aiResponse = generateBasicResponse(userMessage, chatMode);
        }
        
        await storage.updateAIActivity(researchActivity.id, "completed");
      }
    }

    // Create AI response message
    await storage.createMessage(conversationId, {
      role: "assistant",
      content: aiResponse,
      conversationId
    });

    // Broadcast completion
    global.broadcastAIActivity?.(conversationId, {
      type: "response_complete",
      message: aiResponse
    });

  } catch (error) {
    console.error("Error processing AI response:", error);
    
    // Check if it's an authentication error
    let errorMessage = "I apologize, but I encountered an error while processing your request. Please try again or contact support if the issue persists.";
    
    if (error.message && (error.message.includes('authentication') || 
                         error.message.includes('API Key') ||
                         error.message.includes('invalid x-api-key') ||
                         error.message.includes('Invalid API Key'))) {
      
      errorMessage = `🔧 **AI Services Configuration Required**

I'm ready to help you with your request, but the AI services need to be properly configured first.

**What you need to do:**
1. Get fresh API keys from these services:
   • **Groq**: https://console.groq.com (free tier available)
   • **Anthropic**: https://console.anthropic.com (primary AI service)  
   • **Perplexity**: https://www.perplexity.ai/settings/api (for research)

2. Add these keys to your environment variables
3. Restart the application

**Why this happened:**
The current API keys are either invalid, expired, or have exceeded their usage limits.

**Once configured:**
✅ Your grant writing prompts will work perfectly
✅ All AI research and content generation will be available
✅ Real-time AI thinking process will be active

I'm fully trained and ready to help with professional grant writing, SEO content, and research once the API keys are working!`;
    }
    
    // Create error message
    await storage.createMessage(conversationId, {
      role: "assistant",
      content: errorMessage,
      conversationId
    });

    global.broadcastAIActivity?.(conversationId, {
      type: "error",
      message: error.message && error.message.includes('API Key') ? 
        "API authentication failed - please check your API keys" : 
        "Failed to process request"
    });
  }
}

// Helper function for basic responses when all AI services fail
function generateBasicResponse(userMessage: string, chatMode?: string): string {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('grant') || chatMode === 'grant') {
    return `# Grant Writing Assistance

Thank you for your grant writing request. While I'm experiencing some connectivity issues with the AI services, I can still provide basic guidance:

## Key Components for Your Grant Proposal:

1. **Specific Aims**: Clearly define your research objectives and hypotheses
2. **Significance**: Explain the importance and potential impact of your research
3. **Innovation**: Describe what's novel about your approach
4. **Approach**: Detail your methodology and timeline
5. **Investigators**: Highlight your team's qualifications
6. **Budget**: Provide detailed justification for requested funds

## Next Steps:
- Review funding agency guidelines thoroughly
- Prepare preliminary data if required
- Seek feedback from colleagues and mentors

Please try your request again in a few moments when the AI services are restored.`;
  }
  
  if (lowerMessage.includes('seo') || lowerMessage.includes('keyword') || chatMode === 'seo') {
    return generateBasicSeoResponse(userMessage);
  }
  
  return `# Content Writing Assistance

Thank you for your request. I'm currently experiencing connectivity issues with the AI services, but I'm here to help with:

- **Professional Content Creation**: Articles, blog posts, marketing copy
- **SEO Optimization**: Keyword research and content strategy
- **Grant Writing**: Research proposals and funding applications
- **General Writing**: Any content writing needs

Please try your request again in a few moments when the AI services are restored, or contact support if this issue persists.`;
}

function generateBasicSeoResponse(topic: string): string {
  return `# SEO Strategy for: ${topic}

While I'm experiencing connectivity issues with the research services, here's a basic SEO framework:

## 1. Keyword Research
- Focus on long-tail keywords related to "${topic}"
- Target keywords with medium competition and decent search volume
- Include local SEO terms if applicable

## 2. Content Optimization
- Create comprehensive, high-quality content
- Use target keywords naturally in titles, headers, and body text
- Optimize meta descriptions and title tags

## 3. Technical SEO
- Ensure fast page loading times
- Make content mobile-friendly
- Implement proper internal linking

## 4. Content Strategy
- Regular publishing schedule
- Focus on user intent and value
- Update existing content regularly

Please try your request again when the research services are restored for detailed keyword analysis and competitor insights.`;
}

// Global types for WebSocket broadcasting
declare global {
  var broadcastAIActivity: ((conversationId: number, activity: any) => void) | undefined;
}
