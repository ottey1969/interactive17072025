import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  bigint,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isPremium: boolean("is_premium").default(false),
  isAdmin: boolean("is_admin").default(false),
  unlimitedCredits: boolean("unlimited_credits").default(false),
  grantWritingAccess: boolean("grant_writing_access").default(false),
  monthlyQuestionsUsed: integer("monthly_questions_used").default(0),
  currentMonth: varchar("current_month"), // YYYY-MM format
  totalCredits: integer("total_credits").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: bigint("conversation_id", { mode: "number" }).notNull().references(() => conversations.id),
  role: varchar("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiActivities = pgTable("ai_activities", {
  id: serial("id").primaryKey(),
  conversationId: bigint("conversation_id", { mode: "number" }).notNull().references(() => conversations.id),
  phase: varchar("phase", { enum: ["research", "analysis", "strategy", "generation"] }).notNull(),
  status: varchar("status", { enum: ["pending", "active", "completed", "failed"] }).notNull(),
  description: text("description").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  paypalSubscriptionId: varchar("paypal_subscription_id"),
  status: varchar("status", { enum: ["active", "cancelled", "expired"] }).notNull(),
  planType: varchar("plan_type", { enum: ["pro"] }).notNull(),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Blog posts table for SEO-optimized content generation
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  bulkJobId: integer("bulk_job_id").references(() => bulkBlogJobs.id),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  metaTitle: varchar("meta_title", { length: 60 }).notNull(),
  metaDescription: varchar("meta_description", { length: 160 }).notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  keyword: varchar("keyword", { length: 100 }).notNull(),
  tags: text("tags").array().default([]),
  imageUrl: varchar("image_url"),
  imageAlt: varchar("image_alt"),
  schema: jsonb("schema"),
  seoScore: integer("seo_score").default(0),
  estimatedReadTime: integer("estimated_read_time").default(0),
  wordCount: integer("word_count").default(0),
  status: varchar("status", { enum: ["draft", "published", "archived"] }).default("draft"),
  targetCountry: varchar("target_country", { length: 2 }).default("US"),
  contentLength: varchar("content_length", { enum: ["short", "medium", "long"] }).default("medium"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bulk blog generation jobs for subscriber feature
export const bulkBlogJobs = pgTable("bulk_blog_jobs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  keywords: text("keywords").array().notNull(), // Array of keywords to generate posts for
  targetCountry: varchar("target_country", { length: 2 }).default("US"),
  contentLength: varchar("content_length", { enum: ["short", "medium", "long"] }).default("medium"),
  status: varchar("status", { enum: ["pending", "processing", "completed", "failed"] }).default("pending"),
  totalPosts: integer("total_posts").default(0),
  completedPosts: integer("completed_posts").default(0),
  failedPosts: integer("failed_posts").default(0),
  processingStarted: timestamp("processing_started"),
  processingCompleted: timestamp("processing_completed"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertConversation = typeof conversations.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;

export type InsertMessage = typeof messages.$inferInsert;
export type Message = typeof messages.$inferSelect;

export type InsertAIActivity = typeof aiActivities.$inferInsert;
export type AIActivity = typeof aiActivities.$inferSelect;

export type InsertSubscription = typeof subscriptions.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;

export type InsertBlogPost = typeof blogPosts.$inferInsert;
export type BlogPost = typeof blogPosts.$inferSelect;

export type InsertBulkBlogJob = typeof bulkBlogJobs.$inferInsert;
export type BulkBlogJob = typeof bulkBlogJobs.$inferSelect;

export const insertMessageSchema = createInsertSchema(messages).pick({
  content: true,
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  title: true,
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).pick({
  title: true,
  keyword: true,
  targetCountry: true,
  contentLength: true,
});

export const insertBulkBlogJobSchema = createInsertSchema(bulkBlogJobs).pick({
  name: true,
  keywords: true,
  targetCountry: true,
  contentLength: true,
});

// Grant documents table for large content processing
export const grantDocuments = pgTable("grant_documents", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  documentType: varchar("document_type", { enum: ["reference", "draft", "template"] }).default("reference"),
  sourceUrl: varchar("source_url", { length: 500 }),
  uploadDate: timestamp("upload_date").defaultNow(),
  fileSizeKb: integer("file_size_kb").default(0),
  status: varchar("status", { enum: ["active", "archived"] }).default("active"),
  tags: text("tags").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Grant projects table for managing grant writing projects
export const grantProjects = pgTable("grant_projects", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  projectName: varchar("project_name", { length: 255 }).notNull(),
  grantType: varchar("grant_type", { enum: ["federal", "state", "private", "foundation"] }),
  fundingAmount: bigint("funding_amount", { mode: "number" }),
  deadline: timestamp("deadline"),
  organizationName: varchar("organization_name", { length: 255 }),
  projectDescription: text("project_description"),
  status: varchar("status", { enum: ["planning", "drafting", "review", "submitted"] }).default("planning"),
  aiTrainingContext: text("ai_training_context"),
  documentIds: integer("document_ids").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type GrantDocument = typeof grantDocuments.$inferSelect;
export type InsertGrantDocument = typeof grantDocuments.$inferInsert;
export type GrantProject = typeof grantProjects.$inferSelect;
export type InsertGrantProject = typeof grantProjects.$inferInsert;

export const insertGrantDocumentSchema = createInsertSchema(grantDocuments).pick({
  title: true,
  content: true,
  documentType: true,
  sourceUrl: true,
  tags: true,
});

export const insertGrantProjectSchema = createInsertSchema(grantProjects).pick({
  projectName: true,
  grantType: true,
  fundingAmount: true,
  deadline: true,
  organizationName: true,
  projectDescription: true,
  aiTrainingContext: true,
});
