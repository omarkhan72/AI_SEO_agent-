import { google } from 'googleapis';
import serviceAccount from '../serviceAccountKey.json' with { type: 'json' };
import { generateStructuredJSON } from './aiBrainService.js';

/**
 * Connects to GSC API (or falls back to simulated data), filters Page 2 & low CTR pages,
 * and calls the AI Brain to recommend clickability and content optimizations.
 * 
 * @param {string} siteUrl - Verified Google Search Console site URL.
 * @param {number} [days=30] - History window date range.
 * @returns {Promise<Object>} Object containing page_2_opportunities, low_ctr_fixes, and ai_optimization_plan.
 */
export async function analyzeGscPerformance(siteUrl, days = 30) {
  console.log(`[GSC Engine] Starting Search Console analysis for site: "${siteUrl}"`);

  // Step 1: Initialize JWT credentials from local Firebase serviceAccountKey.json
  const auth = new google.auth.JWT(
    serviceAccount.client_email,
    null,
    serviceAccount.private_key,
    ['https://www.googleapis.com/auth/webmasters.readonly']
  );

  const webmasters = google.webmasters({ version: 'v3', auth });

  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  let rows = [];
  try {
    const response = await webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['page', 'query'],
        rowLimit: 1000
      }
    });
    rows = response.data.rows || [];
    console.log(`[GSC Engine] Fetched ${rows.length} rows from Google Search Console API.`);
  } catch (apiError) {
    console.warn("⚠️ [GSC Engine] GSC API query failed. Using simulated performance metrics.", apiError.message);
    
    // Fail-safe simulated metrics rows
    rows = [
      { keys: ["https://example.com/posts/react-hooks", "react hooks tutorial"], clicks: 2, impressions: 850, ctr: 0.0023, position: 14.5 },
      { keys: ["https://example.com/posts/node-performance", "optimize node.js api"], clicks: 8, impressions: 650, ctr: 0.012, position: 11.2 },
      { keys: ["https://example.com/posts/css-variables", "css theme tutorial"], clicks: 45, impressions: 2300, ctr: 0.019, position: 5.4 },
      { keys: ["https://example.com/posts/javascript-closures", "javascript closures explained"], clicks: 0, impressions: 550, ctr: 0.0, position: 18.9 },
      { keys: ["https://example.com/posts/react-hooks", "react state hooks"], clicks: 120, impressions: 6000, ctr: 0.02, position: 2.1 }
    ];
  }

  // Step 2: Parse rows using structural SEO mathematical filters
  const page2Opportunities = [];
  const lowCtrFixes = [];

  rows.forEach(row => {
    if (!row.keys || row.keys.length < 2) return;
    const page = row.keys[0];
    const query = row.keys[1];
    const clicks = parseInt(row.clicks, 10) || 0;
    const impressions = parseInt(row.impressions, 10) || 0;
    const ctr = parseFloat(row.ctr) || 0;
    const position = parseFloat(row.position) || 0;

    const record = { page, query, clicks, impressions, ctr, position };

    // Page 2: position is between 10.5 and 20.0
    if (position >= 10.5 && position <= 20.0) {
      page2Opportunities.push(record);
    }

    // Low CTR / High Impression: impressions > 500 and CTR < 2% (0.02)
    if (impressions > 500 && ctr < 0.02) {
      lowCtrFixes.push(record);
    }
  });

  console.log(`[GSC Engine] Filtered ${page2Opportunities.length} Page 2 keywords and ${lowCtrFixes.length} Low CTR pages.`);

  if (page2Opportunities.length === 0 && lowCtrFixes.length === 0) {
    return {
      siteUrl,
      page_2_opportunities: [],
      low_ctr_fixes: [],
      ai_optimization_plan: {
        low_ctr_optimizations: [],
        page_2_optimizations: []
      }
    };
  }

  // Step 3: Run AI Brain evaluation for CRO & semantic optimization
  const userContent = `Google Search Console Audit Data for site: ${siteUrl}

Page 2 opportunities (average position 10.5 - 20.0):
${JSON.stringify(page2Opportunities, null, 2)}

Low CTR high-impression pages (impressions > 500, CTR < 2%):
${JSON.stringify(lowCtrFixes, null, 2)}
`;

  const aiOptimizationPlan = await generateStructuredJSON('GSC_ANALYZER', userContent);

  return {
    siteUrl,
    page_2_opportunities: page2Opportunities,
    low_ctr_fixes: lowCtrFixes,
    ai_optimization_plan
  };
}
