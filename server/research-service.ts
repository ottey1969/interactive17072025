import { OpenAI } from 'openai';

const perplexity = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY,
  baseURL: 'https://api.perplexity.ai',
});

// Research service using Perplexity for internet access
export async function getResearchData(query: string): Promise<string> {
  try {
    if (!process.env.PERPLEXITY_API_KEY) {
      return "Research data unavailable - Perplexity API key not configured.";
    }

    const response = await perplexity.chat.completions.create({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: 'You are a research assistant. Provide factual, current information with credible sources. Focus on government statistics, official data, and authoritative sources.'
        },
        {
          role: 'user',
          content: `Research the following topic and provide current, factual information: ${query}`
        }
      ],
      max_tokens: 1000,
      temperature: 0.2,
    });

    return response.choices[0]?.message?.content || "No research data available.";
  } catch (error) {
    console.error('Research service error:', error);
    return `Research unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

// Enhanced keyword research using Perplexity
export async function performKeywordResearch(topic: string): Promise<any> {
  try {
    if (!process.env.PERPLEXITY_API_KEY) {
      return { error: "Perplexity API key not configured" };
    }

    const response = await perplexity.chat.completions.create({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: 'You are an SEO expert. Provide comprehensive keyword research with search volumes, difficulty, and trends. Use current, real data.'
        },
        {
          role: 'user',
          content: `Perform keyword research for: ${topic}. Include primary keywords, long-tail keywords, search volumes, and competition analysis.`
        }
      ],
      max_tokens: 1500,
      temperature: 0.3,
    });

    return {
      success: true,
      data: response.choices[0]?.message?.content || "No keyword data available."
    };
  } catch (error) {
    console.error('Keyword research error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Competitor analysis using Perplexity
export async function analyzeCompetitors(topic: string): Promise<any> {
  try {
    if (!process.env.PERPLEXITY_API_KEY) {
      return { error: "Perplexity API key not configured" };
    }

    const response = await perplexity.chat.completions.create({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: 'You are a competitive analysis expert. Provide detailed competitor analysis with current market data, strategies, and insights.'
        },
        {
          role: 'user',
          content: `Analyze competitors and market landscape for: ${topic}. Include top competitors, their strategies, market positioning, and opportunities.`
        }
      ],
      max_tokens: 1500,
      temperature: 0.3,
    });

    return {
      success: true,
      data: response.choices[0]?.message?.content || "No competitor data available."
    };
  } catch (error) {
    console.error('Competitor analysis error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}