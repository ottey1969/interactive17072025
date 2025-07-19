import {
  users,
  conversations,
  messages,
  aiActivities,
  subscriptions,
  blogPosts,
  bulkBlogJobs,
  grantDocuments,
  grantProjects,
  type User,
  type UpsertUser,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type AIActivity,
  type InsertAIActivity,
  type Subscription,
  type InsertSubscription,
  type BlogPost,
  type InsertBlogPost,
  type BulkBlogJob,
  type InsertBulkBlogJob,
  type GrantDocument,
  type InsertGrantDocument,
  type GrantProject,
  type InsertGrantProject,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserQuestionCount(userId: string, count: number): Promise<void>;
  updateUserOverageCount(userId: string, count: number): Promise<void>;
  resetMonthlyQuestions(userId: string): Promise<void>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  updateUserPremiumStatus(userId: string, isPremium: boolean): Promise<void>;
  addCreditsToUser(userId: string, credits: number): Promise<void>;
  grantUserCredits(userId: string, credits: number): Promise<void>;
  
  // Conversation operations
  createConversation(userId: string, conversation: InsertConversation): Promise<Conversation>;
  getUserConversations(userId: string): Promise<Conversation[]>;
  getConversation(id: number): Promise<Conversation | undefined>;
  updateConversationTitle(id: number, title: string): Promise<void>;
  
  // Message operations
  createMessage(conversationId: number, message: InsertMessage): Promise<Message>;
  getConversationMessages(conversationId: number): Promise<Message[]>;
  
  // AI Activity operations
  createAIActivity(activity: InsertAIActivity): Promise<AIActivity>;
  updateAIActivity(id: number, status: string, metadata?: any): Promise<void>;
  getConversationActivities(conversationId: number): Promise<AIActivity[]>;
  
  // Subscription operations
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getUserSubscription(userId: string): Promise<Subscription | undefined>;
  updateSubscriptionStatus(userId: string, status: string): Promise<void>;
  
  // Blog post operations
  createBlogPost(blogPost: InsertBlogPost): Promise<BlogPost>;
  getBlogPost(id: number): Promise<BlogPost | undefined>;
  getUserBlogPosts(userId: string): Promise<BlogPost[]>;
  updateBlogPost(id: number, updates: Partial<BlogPost>): Promise<void>;
  deleteBlogPost(id: number): Promise<void>;
  
  // Bulk blog job operations
  createBulkBlogJob(job: InsertBulkBlogJob): Promise<BulkBlogJob>;
  getBulkBlogJob(id: number): Promise<BulkBlogJob | undefined>;
  getUserBulkBlogJobs(userId: string): Promise<BulkBlogJob[]>;
  updateBulkBlogJob(id: number, updates: Partial<BulkBlogJob>): Promise<void>;
  deleteBulkBlogJob(id: number): Promise<void>;
  getBlogPostsByJobId(jobId: number): Promise<BlogPost[]>;
  
  // Grant writing operations
  createGrantDocument(document: InsertGrantDocument): Promise<GrantDocument>;
  getUserGrantDocuments(userId: string): Promise<GrantDocument[]>;
  getGrantDocument(id: number): Promise<GrantDocument | undefined>;
  getGrantDocumentsByIds(ids: number[]): Promise<GrantDocument[]>;
  updateGrantDocument(id: number, updates: Partial<GrantDocument>): Promise<void>;
  deleteGrantDocument(id: number): Promise<void>;
  
  createGrantProject(project: InsertGrantProject): Promise<GrantProject>;
  getUserGrantProjects(userId: string): Promise<GrantProject[]>;
  getGrantProject(id: number): Promise<GrantProject | undefined>;
  updateGrantProject(id: number, updates: Partial<GrantProject>): Promise<void>;
  deleteGrantProject(id: number): Promise<void>;

  // Session store
  sessionStore: any;
}

const PostgresSessionStore = connectPg(session);
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    // Use memory store for session storage for now (simple and works)
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Check if this is the admin email
    const isAdminEmail = userData.email === 'ottmar.francisca1969@gmail.com';
    
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        isAdmin: userData.isAdmin ?? isAdminEmail,
        isPremium: userData.isPremium ?? isAdminEmail, // Preserve user's premium status or set admin
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          isAdmin: userData.isAdmin ?? isAdminEmail,
          isPremium: userData.isPremium ?? isAdminEmail,
          monthlyQuestionsUsed: userData.monthlyQuestionsUsed || 0,
          currentMonth: userData.currentMonth || new Date().toISOString().slice(0, 7),
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserQuestionCount(userId: string, count: number): Promise<void> {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    await db
      .update(users)
      .set({
        monthlyQuestionsUsed: count,
        currentMonth: currentMonth,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async updateUserOverageCount(userId: string, count: number): Promise<void> {
    // This method is not needed since we removed overageQuestionsUsed
    console.log(`Overage count update not implemented for user ${userId}`);
  }

  async resetMonthlyQuestions(userId: string): Promise<void> {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    await db
      .update(users)
      .set({
        monthlyQuestionsUsed: 0,
        currentMonth: currentMonth,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async createConversation(userId: string, conversation: InsertConversation): Promise<Conversation> {
    const [conv] = await db
      .insert(conversations)
      .values({ 
        userId,
        title: conversation.title || "New Conversation"
      })
      .returning();
    return conv;
  }

  async getUserConversations(userId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation;
  }

  async updateConversationTitle(id: number, title: string): Promise<void> {
    await db
      .update(conversations)
      .set({ title, updatedAt: new Date() })
      .where(eq(conversations.id, id));
  }

  async createMessage(conversationId: number, message: InsertMessage): Promise<Message> {
    const [msg] = await db
      .insert(messages)
      .values({ ...message, conversationId })
      .returning();
    return msg;
  }

  async getConversationMessages(conversationId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createAIActivity(activity: InsertAIActivity): Promise<AIActivity> {
    const [act] = await db
      .insert(aiActivities)
      .values(activity)
      .returning();
    return act;
  }

  async updateAIActivity(id: number, status: string, metadata?: any): Promise<void> {
    await db
      .update(aiActivities)
      .set({ status: status as "pending" | "active" | "completed" | "failed", metadata })
      .where(eq(aiActivities.id, id));
  }

  async getConversationActivities(conversationId: number): Promise<AIActivity[]> {
    return await db
      .select()
      .from(aiActivities)
      .where(eq(aiActivities.conversationId, conversationId))
      .orderBy(aiActivities.createdAt);
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [sub] = await db
      .insert(subscriptions)
      .values(subscription)
      .returning();
    return sub;
  }

  async getUserSubscription(userId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")));
    return subscription;
  }

  async updateSubscriptionStatus(userId: string, status: string): Promise<void> {
    await db
      .update(subscriptions)
      .set({ status: status as "active" | "cancelled" | "expired" })
      .where(eq(subscriptions.userId, userId));
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserPremiumStatus(userId: string, isPremium: boolean): Promise<void> {
    await db.update(users)
      .set({ 
        isPremium,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async addCreditsToUser(userId: string, credits: number): Promise<void> {
    // Add credits to user account (similar to grantUserCredits but for specific amount)
    await db.update(users)
      .set({ 
        monthlyQuestionsUsed: 0, // Reset monthly questions when adding credits
        totalCredits: credits,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async grantUserCredits(userId: string, credits: number): Promise<void> {
    // Reset monthly questions to 0 and add credits
    await db.update(users)
      .set({ 
        monthlyQuestionsUsed: 0,
        totalCredits: credits,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  // Blog post operations
  async createBlogPost(blogPost: InsertBlogPost): Promise<BlogPost> {
    const [post] = await db
      .insert(blogPosts)
      .values(blogPost)
      .returning();
    return post;
  }

  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, id));
    return post;
  }

  async getUserBlogPosts(userId: string): Promise<BlogPost[]> {
    return await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.userId, userId))
      .orderBy(desc(blogPosts.createdAt));
  }

  async updateBlogPost(id: number, updates: Partial<BlogPost>): Promise<void> {
    await db
      .update(blogPosts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(blogPosts.id, id));
  }

  async deleteBlogPost(id: number): Promise<void> {
    await db
      .delete(blogPosts)
      .where(eq(blogPosts.id, id));
  }

  // Bulk blog job operations
  async createBulkBlogJob(job: InsertBulkBlogJob): Promise<BulkBlogJob> {
    const [blogJob] = await db
      .insert(bulkBlogJobs)
      .values(job)
      .returning();
    return blogJob;
  }

  async getBulkBlogJob(id: number): Promise<BulkBlogJob | undefined> {
    const [job] = await db
      .select()
      .from(bulkBlogJobs)
      .where(eq(bulkBlogJobs.id, id));
    return job;
  }

  async getUserBulkBlogJobs(userId: string): Promise<BulkBlogJob[]> {
    return await db
      .select()
      .from(bulkBlogJobs)
      .where(eq(bulkBlogJobs.userId, userId))
      .orderBy(desc(bulkBlogJobs.createdAt));
  }

  async updateBulkBlogJob(id: number, updates: Partial<BulkBlogJob>): Promise<void> {
    await db
      .update(bulkBlogJobs)
      .set(updates)
      .where(eq(bulkBlogJobs.id, id));
  }

  async deleteBulkBlogJob(id: number): Promise<void> {
    // First delete all associated blog posts
    await db
      .delete(blogPosts)
      .where(eq(blogPosts.bulkJobId, id));
    
    // Then delete the job
    await db
      .delete(bulkBlogJobs)
      .where(eq(bulkBlogJobs.id, id));
  }

  async getBlogPostsByJobId(jobId: number): Promise<BlogPost[]> {
    return await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.bulkJobId, jobId))
      .orderBy(desc(blogPosts.createdAt));
  }

  // Grant writing operations
  async createGrantDocument(document: InsertGrantDocument): Promise<GrantDocument> {
    const [result] = await db.insert(grantDocuments).values(document).returning();
    return result;
  }

  async getUserGrantDocuments(userId: string): Promise<GrantDocument[]> {
    return await db.select().from(grantDocuments).where(eq(grantDocuments.userId, userId));
  }

  async getGrantDocument(id: number): Promise<GrantDocument | undefined> {
    const [result] = await db.select().from(grantDocuments).where(eq(grantDocuments.id, id));
    return result;
  }

  async getGrantDocumentsByIds(ids: number[]): Promise<GrantDocument[]> {
    if (ids.length === 0) return [];
    return await db.select().from(grantDocuments).where(
      eq(grantDocuments.id, ids[0]) // Using first ID for simplicity, can be enhanced for multiple
    );
  }

  async updateGrantDocument(id: number, updates: Partial<GrantDocument>): Promise<void> {
    await db.update(grantDocuments).set(updates).where(eq(grantDocuments.id, id));
  }

  async deleteGrantDocument(id: number): Promise<void> {
    await db.delete(grantDocuments).where(eq(grantDocuments.id, id));
  }

  async createGrantProject(project: InsertGrantProject): Promise<GrantProject> {
    const [result] = await db.insert(grantProjects).values(project).returning();
    return result;
  }

  async getUserGrantProjects(userId: string): Promise<GrantProject[]> {
    return await db.select().from(grantProjects).where(eq(grantProjects.userId, userId));
  }

  async getGrantProject(id: number): Promise<GrantProject | undefined> {
    const [result] = await db.select().from(grantProjects).where(eq(grantProjects.id, id));
    return result;
  }

  async updateGrantProject(id: number, updates: Partial<GrantProject>): Promise<void> {
    await db.update(grantProjects).set(updates).where(eq(grantProjects.id, id));
  }

  async deleteGrantProject(id: number): Promise<void> {
    await db.delete(grantProjects).where(eq(grantProjects.id, id));
  }

  // Password management
  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db.update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }
}

export const storage = new DatabaseStorage();

  
  // Password management
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;

