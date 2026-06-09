import admin from 'firebase-admin';
import { fetchLiveSearchContext } from './searchService.js';
import { generateStructuredJSON } from './aiBrainService.js';

/**
 * Executes a full SEO audit for a given domain across 6 dimensions,
 * cross-referencing the latest Google core algorithm and spam updates from Firestore.
 * 
 * @param {string} targetDomain - The website domain to audit.
 * @returns {Promise<Object>} Object containing audit results matching the 6-dimension schema.
 */
export async function runFullSiteAudit(targetDomain) {
  const db = admin.firestore();

  console.log(`[Audit Engine] Starting comprehensive audit for domain: "${targetDomain}"`);

  // Step 1: Data Gathering (Simulation/Scraping)
  // Fetch simulated meta-data, headers, and indexing metrics for home page and key pages
  const crawledData = await fetchLiveSearchContext(targetDomain);

  // Step 2: Fetch Latest Google Algorithm Updates from Firestore
  let latestAlgoUpdate = null;
  try {
    const updatesSnapshot = await db.collection('seo_global_updates')
      .orderBy('created_at', 'desc')
      .limit(1)
      .get();

    updatesSnapshot.forEach(doc => {
      latestAlgoUpdate = doc.data();
    });

    if (latestAlgoUpdate) {
      console.log("[Audit Engine] Successfully queried latest Google algorithm update context from Firestore.");
    } else {
      console.log("[Audit Engine] No algorithm updates found in Firestore. Using default baseline updates.");
    }
  } catch (dbError) {
    console.error("❌ [Audit Engine] Firestore read error during updates query:", dbError);
    // Proceed with fallback updates context to make the service robust
  }

  // Fallback update context if database is empty or read failed
  if (!latestAlgoUpdate) {
    latestAlgoUpdate = {
      summary: "Baseline 2026 Core/Spam Updates focusing on E-E-A-T and helpful content. Strong penalty risk for low-effort programmatic AI generation, high requirements for real author credentials, and mobile accessibility checks.",
      key_takeaways: [
        "E-E-A-T alignment: Real-world expertise must be demonstrated",
        "AI Overview ranking optimization",
        "Core Web Vitals and UX indicators"
      ]
    };
  }

  // Step 3: Core AI Brain Evaluation
  // Construct user instruction string including crawl data and updates parameters
  const userContent = `Target Domain: ${targetDomain}

Simulated Crawl Data:
${crawledData}

Latest Google Algorithm Update Parameters:
- Summary: ${latestAlgoUpdate.summary}
- Takeaways: ${JSON.stringify(latestAlgoUpdate.key_takeaways)}
`;

  const auditResult = await generateStructuredJSON('SEO_AUDITOR', userContent);

  if (!auditResult || !auditResult.dimension_scores || !auditResult.action_plan_30_days) {
    throw new Error("Invalid audit schema returned from Core AI Brain.");
  }

  return {
    dimension_scores: auditResult.dimension_scores,
    algorithm_alignment: auditResult.algorithm_alignment,
    action_plan_30_days: auditResult.action_plan_30_days,
    forecast_90_days: auditResult.forecast_90_days
  };
}
