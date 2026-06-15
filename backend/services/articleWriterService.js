import admin from 'firebase-admin';
import { generateStructuredJSON } from './aiBrainService.js';
import { generatePageSchema } from './schemaGeneratorService.js';

/**
 * Reads a draft outline blueprint from Firestore, triggers the AI copywriter (Claude) to
 * produce a humanized, structured HTML article with FAQs and optimized meta tags.
 * 
 * @param {string} documentId - The document ID of the draft outline inside the content_pipeline collection.
 * @returns {Promise<Object>} Object containing full_content_html, meta_title, meta_description, and reading_time.
 */
export async function writeFullArticle(documentId) {
  const db = admin.firestore();

  console.log(`[Article Engine] Fetching draft outline blueprint for ID: "${documentId}"`);

  // Step 1: Fetch the outline blueprint from content_pipeline
  const docRef = db.collection('content_pipeline').doc(documentId);
  const docSnapshot = await docRef.get();

  if (!docSnapshot.exists) {
    throw new Error(`Draft article outline with ID "${documentId}" was not found in content_pipeline.`);
  }

  const blueprint = docSnapshot.data();
  const { title, target_keyword, headings } = blueprint;

  if (!title || !headings || !Array.isArray(headings)) {
    throw new Error(`Invalid blueprint structure in document "${documentId}". Must contain title and headings.`);
  }

  console.log(`[Article Engine] Found outline: "${title}" (Keyword: "${target_keyword || 'none'}")`);

  // Step 2: Formulate user context instructions for Claude copywriter
  const userContent = `Article Blueprint:
- Title: ${title}
- Target Keyword: ${target_keyword || 'General SEO'}
- Headings/Structure: ${JSON.stringify(headings)}
`;

  // Step 3: Run AI copywriter to write full HTML content & meta tags
  const writingResult = await generateStructuredJSON('ARTICLE_WRITER', userContent);

  if (!writingResult || !writingResult.full_content_html) {
    throw new Error("Invalid article output schema returned from Core AI Brain copywriter.");
  }

  // Step 4: Automatically generate page schema markup
  let schema_markup = null;
  try {
    console.log(`[Article Engine] Automatically generating schema for new article: "${title}"`);
    schema_markup = await generatePageSchema(writingResult.full_content_html, target_keyword || title, 'Article');
  } catch (schemaError) {
    console.warn("⚠️ [Article Engine] Failed to automatically generate schema for article:", schemaError.message);
  }

  return {
    full_content_html: writingResult.full_content_html,
    meta_title: writingResult.meta_title,
    meta_description: writingResult.meta_description,
    reading_time: parseInt(writingResult.reading_time, 10) || 5,
    schema_markup
  };
}
