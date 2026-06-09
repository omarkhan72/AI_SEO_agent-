import admin from 'firebase-admin';
import { generateStructuredJSON } from './aiBrainService.js';

/**
 * Recommends internal link locations, optimized anchor text, and insertion paragraphs.
 * 
 * @param {string} newArticleId - Firestore document ID of the newly generated/refreshed article.
 * @returns {Promise<Array<Object>>} JSON array of link suggestions.
 */
export async function generateLinkSuggestions(newArticleId) {
  const db = admin.firestore();

  console.log(`[Link Engine] Fetching new article: "${newArticleId}"`);
  const newDoc = await db.collection('content_pipeline').doc(newArticleId).get();

  if (!newDoc.exists) {
    throw new Error(`Article document "${newArticleId}" not found in content_pipeline.`);
  }

  const newArticle = newDoc.data();
  const domain = newArticle.domain || "example.com";

  // Step 1: Semantic Graph Simulation
  // Pull 10-15 recently published articles on same domain to scan for links targets
  console.log(`[Link Engine] Scanning recent articles for domain: "${domain}"`);
  const recentSnapshot = await db.collection('content_pipeline')
    .where('domain', '==', domain)
    .limit(15)
    .get();

  const existingArticles = [];
  recentSnapshot.forEach(doc => {
    if (doc.id !== newArticleId) {
      const d = doc.data();
      existingArticles.push({
        slug: d.slug,
        title: d.title,
        target_keyword: d.target_keyword || ""
      });
    }
  });

  if (existingArticles.length === 0) {
    console.log("[Link Engine] No other articles found on this domain. Skipping link suggestion.");
    return [];
  }

  // Step 2: Formulate AI instructions
  const newContentText = newArticle.full_content_html || newArticle.markdown_body || "";
  const userContent = `New Article Content:
${newContentText}

Recently Published Article List:
${JSON.stringify(existingArticles, null, 2)}`;

  // Step 3: Run Link & Anchor Optimization via Claude
  const result = await generateStructuredJSON('INTERNAL_LINK_SUGGESTER', userContent);
  return result.suggestions || [];
}

/**
 * Scans all published articles on a domain, audits internal link graphs, and maps out orphan pages.
 * 
 * @param {string} targetDomain - User's target domain.
 * @returns {Promise<Object>} Object containing orphan_pages array and site_link_health_score.
 */
export async function auditSiteLinks(targetDomain) {
  const db = admin.firestore();

  console.log(`[Link Engine] Initiating orphan audit for domain: "${targetDomain}"`);
  
  // Fetch all articles belonging to targetDomain
  const snapshot = await db.collection('content_pipeline')
    .where('domain', '==', targetDomain)
    .get();

  const articles = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    articles.push({
      id: doc.id,
      slug: data.slug,
      title: data.title,
      content: data.full_content_html || data.markdown_body || ""
    });
  });

  if (articles.length === 0) {
    return {
      orphan_pages: [],
      site_link_health_score: 100
    };
  }

  // Initialize inbound links trackers
  const inboundCounts = {};
  articles.forEach(art => {
    inboundCounts[art.slug] = 0;
  });

  // Crawl article content blocks searching for references to internal page slugs
  articles.forEach(art => {
    articles.forEach(otherArt => {
      if (art.slug !== otherArt.slug) {
        // Regex looks for standard HTML hrefs, markdown links, or path-based references targeting otherArt's slug
        const matchPattern = new RegExp(`href=["'](?:\\/posts\\/)?${otherArt.slug}["']|\\(${otherArt.slug}\\)|\\/${otherArt.slug}`, 'i');
        if (matchPattern.test(art.content)) {
          inboundCounts[otherArt.slug]++;
        }
      }
    });
  });

  // Collect orphan pages (0 inbound links from same domain content)
  const orphanPages = [];
  articles.forEach(art => {
    if (inboundCounts[art.slug] === 0) {
      orphanPages.push({
        id: art.id,
        title: art.title,
        slug: art.slug
      });
    }
  });

  // Calculate Link Health Score: Percentage of articles that are NOT orphaned
  const total = articles.length;
  const orphans = orphanPages.length;
  const siteLinkHealthScore = Math.round(((total - orphans) / total) * 100);

  console.log(`[Link Engine] Orphan audit complete for ${targetDomain}. Found ${orphans} orphan(s). Health Score: ${siteLinkHealthScore}%`);

  return {
    orphan_pages: orphanPages,
    site_link_health_score: siteLinkHealthScore
  };
}
