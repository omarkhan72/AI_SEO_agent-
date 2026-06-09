import admin from 'firebase-admin';
import { fetchLiveSearchContext } from './searchService.js';
import { generateStructuredJSON } from './aiBrainService.js';

/**
 * Executes a structural content gap analysis between top SERP competitor content and the user's domain.
 * 
 * @param {string} keyword - The target search keyword.
 * @param {string} targetDomain - The user's domain.
 * @returns {Promise<Object>} Object containing competitor_profiles and content_gaps.
 */
export async function analyzeCompetitorGaps(keyword, targetDomain) {
  const db = admin.firestore();

  console.log(`[Competitor Engine] Starting gap analysis for keyword: "${keyword}" (User Domain: "${targetDomain}")`);

  // Step 1: SERP & Competitor Extraction
  // Call search service helper to get top SERP results
  const serpContext = await fetchLiveSearchContext(keyword);
  
  // Step 2: Retrieve User's Existing Domain Content from Firestore
  const userArticles = [];
  try {
    // We search the content_pipeline collection for documents targeting the same domain
    const userContentSnapshot = await db.collection('content_pipeline')
      .where('domain', '==', targetDomain)
      .get();

    userContentSnapshot.forEach(doc => {
      const data = doc.data();
      userArticles.push({
        title: data.title,
        headings: data.headings || [],
        target_keyword: data.target_keyword
      });
    });
    console.log(`[Competitor Engine] Fetched ${userArticles.length} existing articles for user domain: ${targetDomain}`);
  } catch (dbError) {
    console.error("❌ [Competitor Engine] Error fetching user articles from Firestore:", dbError);
    // Proceed with an empty array if database fetch fails, ensuring resilience
  }

  // Step 3: Run AI Deep Comparison & Structural Outlines Reconstruction
  const userContent = `Target Keyword: ${keyword}
User Domain: ${targetDomain}

SERP Competitor Context:
${serpContext}

User's Existing Articles:
${JSON.stringify(userArticles, null, 2)}`;

  const analysisResult = await generateStructuredJSON('COMPETITOR_GAP_ANALYZER', userContent);

  if (!analysisResult || !Array.isArray(analysisResult.competitor_profiles) || !Array.isArray(analysisResult.content_gaps)) {
    throw new Error("Invalid response format received from Core AI Brain gap analysis.");
  }

  return {
    competitor_profiles: analysisResult.competitor_profiles,
    content_gaps: analysisResult.content_gaps
  };
}
