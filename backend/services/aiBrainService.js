import Anthropic from '@anthropic-ai/sdk';
import { getSystemPrompt } from './promptManager.js';

let anthropic = null;

/**
 * Returns the Anthropic client singleton, initializing it lazily.
 * This prevents timing issues with dotenv.config() during ESM static import loading.
 */
function getAnthropicClient() {
  if (!anthropic) {
    anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY || 'dummy_api_key'
    });
  }
  return anthropic;
}

/**
 * Call the Claude API, inject system prompts/variables, force a raw JSON output, and parse/validate it.
 * 
 * @param {string} systemPromptKey - Key identifier for the system prompt in promptManager.
 * @param {string} userContent - User context and keyword input.
 * @param {Object} [variables={}] - Key-value placeholders to inject into the system prompt template.
 * @returns {Promise<Object>} Clean parsed JSON object from Claude's response.
 */
export async function generateStructuredJSON(systemPromptKey, userContent, variables = {}) {
  const baseSystemPrompt = getSystemPrompt(systemPromptKey, variables);

  // Appending extra strict instructions to ensure Claude returns raw JSON without markdown wrapping.
  const jsonSystemPrompt = `${baseSystemPrompt}\n\nIMPORTANT: You must return ONLY a raw JSON object. Do NOT wrap it in markdown block code tags (like \`\`\`json ... \`\`\`), do not write explanations, HTML tags, or any other leading/trailing text. Start output with '{' and end with '}'.`;

  console.log(`[AI Brain] Dispatching Claude JSON request for prompt: "${systemPromptKey}"...`);
  
  try {
    const key = process.env.CLAUDE_API_KEY;
    if (!key || key.includes('your-actual-key') || key === 'dummy_api_key') {
      throw new Error("Missing or placeholder CLAUDE_API_KEY environment variable.");
    }

    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      system: jsonSystemPrompt,
      messages: [
        {
          role: 'user',
          content: userContent
        }
      ]
    });

    const rawText = response.content[0].text.trim();

    // Gracefully clean markdown code block wrapping if Claude still includes it
    let cleanText = rawText;
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '');
    }
    cleanText = cleanText.trim();
    
    return JSON.parse(cleanText);
  } catch (error) {
    console.warn(`⚠️ [AI Brain] Claude API request failed for prompt "${systemPromptKey}":`, error.message);
    
    // Provide simulated responses for local testing and credential-less sandboxes
    if (systemPromptKey === 'SEO_PERFORMANCE_ANALYST') {
      return {
        recommendations: [
          "The top 3 ranking pages now feature a comparison table; add a comparative data matrix to your second H2 section to reclaim topical depth.",
          "Expand your coverage of secondary terms in H3 sub-elements (e.g. 'React Custom Hooks examples' and 'cleanup functions') to satisfy user search intent.",
          "Improve readability and user engagement signals by converting the bulleted lists into a structured numbered step guide."
        ]
      };
    }
    
    throw error;
  }
}

export async function handleMultiTurnChat(systemPromptKey, messageHistoryArray, variables = {}) {
  const systemPrompt = getSystemPrompt(systemPromptKey, variables);

  try {
    const key = process.env.CLAUDE_API_KEY;
    if (!key || key.includes('your-actual-key') || key === 'dummy_api_key') {
      throw new Error("Missing or placeholder CLAUDE_API_KEY environment variable.");
    }

    console.log(`[AI Brain] Dispatching Claude chat request for prompt: "${systemPromptKey}"...`);
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      system: systemPrompt,
      messages: messageHistoryArray
    });

    return response.content[0].text;
  } catch (error) {
    console.warn(`⚠️ [AI Brain] Claude chat request failed for prompt "${systemPromptKey}":`, error.message);
    
    // Provide simulated chatbot response for local testing and credential-less sandboxes
    if (systemPromptKey === 'SEO_CONSULTANT') {
      return "Hello! I am your AI SEO Consultant. I have loaded your current site profile and technical audit data. I see some of your keywords are currently underperforming in the SERPs. How would you like me to help you optimize them today?";
    }
    
    throw error;
  }
}
