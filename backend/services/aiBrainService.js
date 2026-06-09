import Anthropic from '@anthropic-ai/sdk';
import { getSystemPrompt } from './promptManager.js';

// Initialize the Anthropic client using the CLAUDE_API_KEY from environment variables
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
});

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
  const response = await anthropic.messages.create({
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

  try {
    // Gracefully clean markdown code block wrapping if Claude still includes it
    let cleanText = rawText;
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '');
    }
    cleanText = cleanText.trim();
    
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("❌ Securing/Parsing JSON from Claude response failed:", error);
    console.error("Raw response received:", rawText);
    throw new Error(`Invalid JSON format returned from Claude: ${error.message}`);
  }
}

/**
 * Handle back-and-forth chat conversation using Claude with a system prompt context.
 * 
 * @param {string} systemPromptKey - Key identifier for the system prompt in promptManager.
 * @param {Array<Object>} messageHistoryArray - Array of message objects (e.g. [{ role: 'user', content: '...' }]).
 * @returns {Promise<string>} Next text response from Claude.
 */
export async function handleMultiTurnChat(systemPromptKey, messageHistoryArray) {
  const systemPrompt = getSystemPrompt(systemPromptKey);

  console.log(`[AI Brain] Dispatching Claude chat request for prompt: "${systemPromptKey}"...`);
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
    system: systemPrompt,
    messages: messageHistoryArray
  });

  return response.content[0].text;
}
