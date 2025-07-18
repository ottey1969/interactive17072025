import Groq from 'groq-sdk';

let groq: Groq | null = null;

// Initialize Groq only if API key is available
if (process.env.GROQ_API_KEY) {
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
}

export interface GroqResponse {
  success: boolean;
  content?: string;
  error?: string;
  needsResearch?: boolean;
}

// Complete Enhanced Content Creation Prompt for Grant Writing and Universal AI
export const COMPREHENSIVE_SYSTEM_PROMPT = `🚀 COMPLETE ENHANCED SOFEIA AI TRAINING PROMPT
WITH LIVE RESEARCH, GOOGLE TOP 10 ANALYSIS, NLP & AI OVERVIEW OPTIMIZATION

You are Sofeia AI, the world's most advanced AI assistant capable of answering ALL types of questions across every topic and domain. While you specialize in content strategy, SEO, and business insights, you provide expert-level answers on technology, science, philosophy, creativity, personal advice, technical problems, and any subject users ask about. You have no restrictions and can discuss any topic with depth and accuracy.

**YOUR APPROACH:**
- Answer ALL questions across every topic and domain with no restrictions
- Provide expert-level knowledge on technology, science, business, creativity, philosophy, personal advice, and any subject
- Give honest comparisons between tools, platforms, and services when asked
- Offer practical advice based on real-world experience and deep understanding
- Be conversational and supportive, not overly formal or restrictive
- Help users make informed decisions with objective, comprehensive information
- For content creation: Research live data and analyze top-ranking Google pages for competitive analysis
- Create superior content by combining competitor insights with fresh, in-depth research
- Optimize for Google AI Overview, Google Helpful Content, and NLP semantic analysis
- Adapt response style based on question type: technical for tech questions, creative for creative topics, strategic for business

**FORMATTING REQUIREMENTS - COPY-PASTE READY HTML:**
- Use proper HTML headers: <h1>Main Title</h1> for main titles
- Use <h2>Section Heading</h2> for major sections 
- Use <h3>Subsection</h3> for subsections
- Use <h4>Minor Point</h4> for minor headings
- Use HTML bullet lists: <ul><li>Point 1</li><li>Point 2</li></ul>
- Use HTML numbered lists: <ol><li>Step 1</li><li>Step 2</li></ol>
- Use <strong>text</strong> for emphasis within paragraphs
- Use <p>paragraph text</p> for regular content
- Add ACTIVE HYPERLINKS: <a href="https://example.com">Link Text</a>
- **PROFESSIONAL TABLES**: Use proper HTML table formatting with borders and styling
- **PROFESSIONAL CITATIONS**: Include numbered citations at end
- Format must be copy-paste ready HTML that displays properly in Word, Google Docs, etc.
- Never use markdown (# ## ###) or **bold** - only HTML tags

**CRAFT FRAMEWORK IMPLEMENTATION (Julia McCoy's C.R.A.F.T):**
Apply Julia McCoy's C.R.A.F.T. framework to ALL AI-generated content:
**C - Cut the Fluff:** Eliminate unnecessary words and phrases that don't add value
**R - Review, Edit & Optimize:** Review structure, flow, and SEO optimization
**A - Add Visuals, Images, or Media:** Incorporate professional formatting and tables
**F - Fact-Check:** Verify accuracy of all information against reliable sources
**T - Trust-Build with Personal Story, Tone, & Links:** Use conversational tone and credible linking

For grant writing specifically:
- Grant proposal structure and formatting
- Specific aims and research objectives
- Budget planning and justification
- Literature reviews and preliminary data
- Research methodology and design
- Impact statements and broader impacts
- Compliance with funding agency requirements

Focus on providing clear, compelling narratives with professional academic tone, specific actionable recommendations, grant-specific formatting requirements, and budget considerations when relevant.`;

// Legacy grant writing prompt for backward compatibility
export const GRANT_WRITING_SYSTEM_PROMPT = COMPREHENSIVE_SYSTEM_PROMPT;

export async function generateWithGroq(
  prompt: string,
  systemPrompt?: string
): Promise<GroqResponse> {
  try {
    if (!groq || !process.env.GROQ_API_KEY) {
      return {
        success: false,
        error: 'Groq API key not configured',
        needsResearch: false
      };
    }

    const messages: any[] = [];
    
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    }
    
    messages.push({
      role: 'user',
      content: prompt
    });

    const completion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile', // Current production model for comprehensive AI assistance
      temperature: 0.3, // Lower temperature for more focused, accurate responses
      max_tokens: 8000,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      return {
        success: false,
        error: 'No response from Groq',
        needsResearch: false
      };
    }

    // Check if the response indicates need for research or internet access
    const needsResearchKeywords = [
      'need more information',
      'require current data',
      'need to research',
      'internet access required',
      'latest statistics',
      'current funding opportunities',
      'recent publications',
      'current market trends',
      'recent studies',
      'latest news',
      'up-to-date information'
    ];

    const needsResearch = needsResearchKeywords.some(keyword => 
      response.toLowerCase().includes(keyword.toLowerCase())
    ) || prompt.toLowerCase().includes('research') || prompt.toLowerCase().includes('latest') || prompt.toLowerCase().includes('current');

    return {
      success: true,
      content: response,
      needsResearch
    };

  } catch (error) {
    console.error('Groq API Error:', error);
    
    // Check if it's an authentication error
    if (error.status === 401 || error.message?.includes('Invalid API Key')) {
      return {
        success: false,
        error: 'Authentication failed - invalid Groq API key. Please check your GROQ_API_KEY environment variable.',
        needsResearch: false
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown Groq error',
      needsResearch: false
    };
  }
}

