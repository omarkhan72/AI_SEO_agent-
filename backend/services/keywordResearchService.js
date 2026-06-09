import admin from 'firebase-admin';
import { generateStructuredJSON } from './aiBrainService.js';

/**
 * Discover, filter, score, and cluster keywords based on a seed topic, Domain Authority, and search intent.
 * Automatically deduplicates against existing target keywords in Firestore.
 * 
 * @param {string} seedTopic - The topic to research.
 * @param {number|string} siteDA - The site's Domain Authority (0 - 100).
 * @param {string} targetIntent - Filter by intent (e.g. "informational", "transactional", "all").
 * @returns {Promise<Array<Object>>} Structured array of keyword clusters.
 */
export async function discoverKeywords(seedTopic, siteDA, targetIntent = "all") {
  const db = admin.firestore();
  const numericDA = parseInt(siteDA, 10) || 0;
  const intentFilter = String(targetIntent).toLowerCase().trim();

  console.log(`[Keyword Engine] Starting research for topic: "${seedTopic}" (DA: ${numericDA}, Intent: ${intentFilter})`);

  // Step 1: Deduplication (No Repeats)
  // Fetch all existing target_keywords from content_pipeline collection
  const existingKeywords = new Set();
  try {
    const snapshot = await db.collection('content_pipeline').get();
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.target_keyword) {
        existingKeywords.add(data.target_keyword.toLowerCase().trim());
      }
    });
    console.log(`[Keyword Engine] Loaded ${existingKeywords.size} existing keywords for deduplication.`);
  } catch (dbError) {
    console.error("❌ [Keyword Engine] Firestore read error during deduplication:", dbError);
    // Continue with empty set if database read fails so the service is robust
  }

  // Step 2: AI Generation & Clustering
  // Generate 15-20 highly relevant keyword ideas via Claude
  const userContent = `Seed Topic: ${seedTopic}`;
  const responseData = await generateStructuredJSON('KEYWORD_RESEARCHER', userContent);

  if (!responseData || !Array.isArray(responseData.keywords)) {
    throw new Error("Invalid keyword array returned from AI Brain service.");
  }

  const generatedKeywords = responseData.keywords;
  console.log(`[Keyword Engine] Generated ${generatedKeywords.length} candidates from Core AI Brain.`);

  // Step 3: Deduplication Filter
  // Filter out any generated keywords that are already present in existing target keywords
  const uniqueCandidates = generatedKeywords.filter(item => {
    const cleanKw = item.keyword.toLowerCase().trim();
    return !existingKeywords.has(cleanKw);
  });
  console.log(`[Keyword Engine] Candidates after deduplication: ${uniqueCandidates.length}`);

  // Step 4: DA-Aware Matching
  // Filter out any keywords where the generated Keyword Difficulty (KD) is significantly higher than siteDA.
  // We define a competitive threshold of (siteDA + 15) to allow slight stretching without targeting impossible keywords.
  const competitiveThreshold = numericDA + 15;
  const daMatchedCandidates = uniqueCandidates.filter(item => {
    const kd = parseInt(item.difficulty, 10) || 0;
    return kd <= competitiveThreshold;
  });
  console.log(`[Keyword Engine] Candidates after DA filtering (KD <= ${competitiveThreshold}): ${daMatchedCandidates.length}`);

  if (daMatchedCandidates.length === 0) {
    return [];
  }

  // Step 5: Opportunity Score Calculation
  // Find the maximum search volume in the current batch to normalize linear scaling
  const maxSearchVolume = Math.max(...daMatchedCandidates.map(item => parseInt(item.search_volume, 10) || 0), 1);

  const scoredCandidates = daMatchedCandidates.map(item => {
    const volume = parseInt(item.search_volume, 10) || 0;
    const kd = parseInt(item.difficulty, 10) || 0;

    // Normalizing search volume factor: (volume / maxSearchVolume) * 100.
    // Difficulty factor is inverted since lower difficulty is better: (100 - difficulty).
    // The final opportunity score is a balanced index: 50% search volume potential + 50% ease of ranking.
    const normalizedVolume = (volume / maxSearchVolume) * 100;
    const inverseDifficulty = 100 - kd;
    const opportunityScore = Math.round((normalizedVolume * 0.5) + (inverseDifficulty * 0.5));

    return {
      ...item,
      search_volume: volume,
      difficulty: kd,
      opportunity_score: opportunityScore
    };
  });

  // Step 6: Intent Filter
  // Filter down to the matching user-requested intent unless "all" is specified
  const intentFilteredCandidates = scoredCandidates.filter(item => {
    if (intentFilter === "all" || intentFilter === "") {
      return true;
    }
    const cleanIntent = String(item.intent).toLowerCase().trim();
    return cleanIntent === intentFilter;
  });
  console.log(`[Keyword Engine] Candidates after intent filter ("${intentFilter}"): ${intentFilteredCandidates.length}`);

  // Step 7: Build Semantic Clusters
  // Group the filtered keywords by the thematic cluster attribute returned from AI
  const clusterGroups = {};
  intentFilteredCandidates.forEach(item => {
    const clusterName = item.cluster || "General Opportunity";
    if (!clusterGroups[clusterName]) {
      clusterGroups[clusterName] = [];
    }
    clusterGroups[clusterName].push({
      keyword: item.keyword,
      search_volume: item.search_volume,
      difficulty: item.difficulty,
      intent: item.intent,
      opportunity_score: item.opportunity_score
    });
  });

  // Convert map to clean array format
  const structuredClusters = Object.keys(clusterGroups).map(name => ({
    name,
    keywords: clusterGroups[name]
  }));

  return structuredClusters;
}
