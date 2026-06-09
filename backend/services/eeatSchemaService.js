import admin from 'firebase-admin';
import { generateStructuredJSON } from './aiBrainService.js';

/**
 * Automatically generates structured JSON-LD schema (Article, Person, FAQ, etc.)
 * and builds a trust-building Author Bio block to satisfy Google's E-E-A-T requirements.
 * 
 * @param {Object} articleData - Object containing { title, headings, content } of the generated article.
 * @param {Object} authorProfile - Object containing author details { name, role, bio/credentials }.
 * @returns {Promise<Object>} Object containing schema_json_ld, author_bio_html, eeat_trust_score, and about_page_tips.
 */
export async function generateTrustSignals(articleData, authorProfile) {
  console.log(`[E-E-A-T Service] Generating trust signals and schema for: "${articleData.title}"`);

  // Prepare input details for AI Brain
  const userContent = `Article Details:
- Title: ${articleData.title}
- Headings: ${JSON.stringify(articleData.headings)}
- Body Content (Markdown):
${articleData.content}

Author Profile:
- Name: ${authorProfile.name}
- Role/Credentials: ${authorProfile.role}
- Biography: ${authorProfile.bio || 'Professional Developer and SEO strategist'}
`;

  // Request E-E-A-T generation from Core AI Brain
  const result = await generateStructuredJSON('EEAT_SCHEMA_GENERATOR', userContent);

  if (!result || !result.schema_json_ld || !result.author_bio_html) {
    throw new Error("Invalid output received from Core AI Brain for E-E-A-T signals.");
  }

  return {
    schema_json_ld: result.schema_json_ld,
    author_bio_html: result.author_bio_html,
    eeat_trust_score: parseInt(result.eeat_trust_score, 10) || 80,
    about_page_tips: result.about_page_tips || []
  };
}
