import admin from 'firebase-admin';
import { fetchLiveSearchContext } from './searchService.js';
import { generateStructuredJSON } from './aiBrainService.js';

/**
 * Proactively fetch global SEO news and Google algorithm updates,
 * summarize using the Core AI Brain, and store in Firestore.
 * 
 * @returns {Promise<string>} The created document's ID.
 */
export async function scanForSEOUpdates() {
  const db = admin.firestore();

  console.log("[Auto-Updater] Proactively scanning SEO updates and ranking factors...");
  
  // Step 1: Fetch mock live search context for updates
  const algorithmNews = await fetchLiveSearchContext("Latest Google core algorithm update news");
  const rankingFactors = await fetchLiveSearchContext("Recent SEO ranking factors");

  const fullSearchContext = `Algorithm Updates:\n${algorithmNews}\n\nRanking Factors:\n${rankingFactors}`;

  // Step 2: Summarize findings using the Core AI Brain
  const summaryResult = await generateStructuredJSON(
    'SEO_SUMMARY_GENERATOR',
    `Please summarize these SEO search results:\n${fullSearchContext}`
  );

  // Step 3: Save context payload to Firestore seo_global_updates collection
  const docRef = await db.collection('seo_global_updates').add({
    summary: summaryResult.summary,
    key_takeaways: summaryResult.key_takeaways,
    action_items: summaryResult.action_items,
    raw_search_context: fullSearchContext,
    created_at: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log(`[Auto-Updater] Weekly SEO updates saved successfully. Firestore ID: ${docRef.id}`);
  return docRef.id;
}
