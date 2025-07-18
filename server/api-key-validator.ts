import fetch from 'node-fetch';

export interface ApiKeyValidationResult {
  service: string;
  valid: boolean;
  error?: string;
  message?: string;
}

export async function validateApiKeys(): Promise<ApiKeyValidationResult[]> {
  const results: ApiKeyValidationResult[] = [];
  
  // Validate Groq API Key
  if (process.env.GROQ_API_KEY) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 10
        })
      });
      
      if (response.ok) {
        results.push({ service: 'Groq', valid: true, message: 'API key is valid' });
      } else {
        const error = await response.json();
        results.push({ 
          service: 'Groq', 
          valid: false, 
          error: error.error?.message || 'Unknown error' 
        });
      }
    } catch (error) {
      results.push({ 
        service: 'Groq', 
        valid: false, 
        error: 'Failed to validate API key' 
      });
    }
  } else {
    results.push({ 
      service: 'Groq', 
      valid: false, 
      error: 'API key not configured' 
    });
  }
  
  // Validate Anthropic API Key
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'max-tokens-3-5-sonnet-2024-07-15'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }]
        })
      });
      
      if (response.ok) {
        results.push({ service: 'Anthropic', valid: true, message: 'API key is valid' });
      } else {
        const error = await response.json();
        const errorMessage = error.error?.message || 'Unknown error';
        results.push({ 
          service: 'Anthropic', 
          valid: false, 
          error: errorMessage === 'invalid x-api-key' ? 'Invalid API key - please check your Anthropic API key' : errorMessage
        });
      }
    } catch (error) {
      results.push({ 
        service: 'Anthropic', 
        valid: false, 
        error: 'Failed to validate API key' 
      });
    }
  } else {
    results.push({ 
      service: 'Anthropic', 
      valid: false, 
      error: 'API key not configured' 
    });
  }
  
  // Validate Perplexity API Key
  if (process.env.PERPLEXITY_API_KEY) {
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 10
        })
      });
      
      if (response.ok) {
        results.push({ service: 'Perplexity', valid: true, message: 'API key is valid' });
      } else {
        const error = await response.json();
        results.push({ 
          service: 'Perplexity', 
          valid: false, 
          error: error.error?.message || 'Unknown error' 
        });
      }
    } catch (error) {
      results.push({ 
        service: 'Perplexity', 
        valid: false, 
        error: 'Failed to validate API key' 
      });
    }
  } else {
    results.push({ 
      service: 'Perplexity', 
      valid: false, 
      error: 'API key not configured' 
    });
  }
  
  return results;
}