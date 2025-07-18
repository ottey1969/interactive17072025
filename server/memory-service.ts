import { storage } from './storage';

// Enhanced memory system for Sofeia AI conversations
export class MemoryService {
  private memoryCache: Map<string, any> = new Map();

  /**
   * Store conversation context and user preferences
   */
  async storeMemory(userId: string, key: string, data: any): Promise<void> {
    const memoryKey = `${userId}:${key}`;
    this.memoryCache.set(memoryKey, {
      data,
      timestamp: new Date(),
      userId
    });

    // Optionally persist to database for long-term memory
    // await storage.storeUserMemory(userId, key, data);
  }

  /**
   * Retrieve specific memory for user
   */
  async getMemory(userId: string, key: string): Promise<any> {
    const memoryKey = `${userId}:${key}`;
    const cached = this.memoryCache.get(memoryKey);
    
    if (cached) {
      return cached.data;
    }

    // Try to get from database
    // return await storage.getUserMemory(userId, key);
    return null;
  }

  /**
   * Store user's document context for grant writing
   */
  async storeDocumentContext(userId: string, conversationId: number, documents: any[]): Promise<void> {
    await this.storeMemory(userId, `documents:${conversationId}`, documents);
  }

  /**
   * Get document context for conversation
   */
  async getDocumentContext(userId: string, conversationId: number): Promise<any[]> {
    return await this.getMemory(userId, `documents:${conversationId}`) || [];
  }

  /**
   * Store user preferences (writing style, focus areas, etc.)
   */
  async storeUserPreferences(userId: string, preferences: {
    writingStyle?: string;
    focusAreas?: string[];
    grantTypes?: string[];
    preferredTone?: string;
  }): Promise<void> {
    await this.storeMemory(userId, 'preferences', preferences);
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<any> {
    return await this.getMemory(userId, 'preferences') || {
      writingStyle: 'professional',
      focusAreas: ['content strategy', 'SEO'],
      grantTypes: ['NIH', 'NSF'],
      preferredTone: 'expert'
    };
  }

  /**
   * Store conversation summary for context
   */
  async storeConversationSummary(userId: string, conversationId: number, summary: string): Promise<void> {
    await this.storeMemory(userId, `summary:${conversationId}`, summary);
  }

  /**
   * Get conversation summary
   */
  async getConversationSummary(userId: string, conversationId: number): Promise<string | null> {
    return await this.getMemory(userId, `summary:${conversationId}`);
  }

  /**
   * Store recent topics user has worked on
   */
  async storeRecentTopics(userId: string, topics: string[]): Promise<void> {
    const existing = await this.getMemory(userId, 'recent_topics') || [];
    const updated = [...new Set([...topics, ...existing])].slice(0, 20); // Keep last 20 topics
    await this.storeMemory(userId, 'recent_topics', updated);
  }

  /**
   * Get recent topics for context
   */
  async getRecentTopics(userId: string): Promise<string[]> {
    return await this.getMemory(userId, 'recent_topics') || [];
  }

  /**
   * Generate enhanced context for AI responses
   */
  async generateContextForAI(userId: string, conversationId: number, currentMessage: string): Promise<string> {
    const preferences = await this.getUserPreferences(userId);
    const documentContext = await this.getDocumentContext(userId, conversationId);
    const recentTopics = await this.getRecentTopics(userId);
    const conversationSummary = await this.getConversationSummary(userId, conversationId);

    let context = `
USER CONTEXT FOR ENHANCED AI RESPONSES:

User Preferences:
- Writing Style: ${preferences.writingStyle}
- Focus Areas: ${preferences.focusAreas.join(', ')}
- Grant Types: ${preferences.grantTypes.join(', ')}
- Preferred Tone: ${preferences.preferredTone}

Recent Topics: ${recentTopics.slice(0, 5).join(', ')}
`;

    if (conversationSummary) {
      context += `\nConversation Summary: ${conversationSummary}`;
    }

    if (documentContext.length > 0) {
      context += `\nRelevant Documents: ${documentContext.map(doc => doc.title || 'Untitled').join(', ')}`;
    }

    return context;
  }

  /**
   * Automatically extract and store topics from conversation
   */
  async extractAndStoreTopics(userId: string, message: string): Promise<void> {
    // Simple topic extraction - in production, use NLP
    const commonTopics = [
      'SEO', 'content strategy', 'keyword research', 'grant writing',
      'NIH', 'NSF', 'research proposal', 'funding', 'content optimization',
      'competitor analysis', 'backlinks', 'SERP', 'AI overview'
    ];

    const extractedTopics = commonTopics.filter(topic => 
      message.toLowerCase().includes(topic.toLowerCase())
    );

    if (extractedTopics.length > 0) {
      await this.storeRecentTopics(userId, extractedTopics);
    }
  }

  /**
   * Clear old memory entries (cleanup)
   */
  async cleanup(): Promise<void> {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (const [key, value] of this.memoryCache.entries()) {
      if (value.timestamp < oneWeekAgo) {
        this.memoryCache.delete(key);
      }
    }
  }
}

export const memoryService = new MemoryService();

// Cleanup old memories every hour
setInterval(() => {
  memoryService.cleanup();
}, 60 * 60 * 1000);