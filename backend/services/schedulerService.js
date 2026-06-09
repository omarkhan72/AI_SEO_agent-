import cron from 'node-cron';
import admin from 'firebase-admin';
import { discoverKeywords } from './keywordResearchService.js';
import { generate30DayCalendar } from './contentCalendarService.js';
import { runFullSiteAudit } from './auditEngineService.js';
import { scanForSEOUpdates } from './autoUpdaterService.js';

/**
 * Scan Firestore collections to locate unique domains being targeted/monitored.
 * Falls back to "example.com" if no domains are found.
 * 
 * @returns {Promise<Array<string>>} List of active target domains.
 */
async function getActiveDomains() {
  const db = admin.firestore();
  const domains = new Set();

  try {
    // 1. Gather domains registered in existing content pipeline documents
    const pipelineSnapshot = await db.collection('content_pipeline').get();
    pipelineSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.domain) {
        domains.add(data.domain.trim());
      }
    });
  } catch (error) {
    console.error("❌ [Scheduler Engine] Failed to fetch domains from content_pipeline:", error.message);
  }

  try {
    // 2. Gather domains registered in site profiles
    const profilesSnapshot = await db.collection('site_profiles').get();
    profilesSnapshot.forEach(doc => {
      const id = doc.id;
      // If the doc ID itself looks like a domain, include it
      if (id.includes('.') && !id.includes(' ')) {
        domains.add(id.trim());
      }
      const data = doc.data();
      if (data.domain) {
        domains.add(data.domain.trim());
      }
    });
  } catch (error) {
    console.error("❌ [Scheduler Engine] Failed to fetch domains from site_profiles:", error.message);
  }

  // Fallback default domain if none exist in the database
  if (domains.size === 0) {
    domains.add("example.com");
  }

  return Array.from(domains);
}

/**
 * Retrieve the site configuration profile for a specific domain.
 * Automatically cascades from domain-specific keys to the admin config,
 * then to standard default templates if not defined.
 * 
 * @param {string} domain - Target domain.
 * @returns {Promise<Object>} The configuration profile object.
 */
async function getDomainProfile(domain) {
  const db = admin.firestore();
  try {
    // Try to get profile keyed by the domain name directly
    let doc = await db.collection('site_profiles').doc(domain).get();
    if (doc.exists) {
      return doc.data();
    }

    // Try to query site profiles where domain field equals domain
    const snapshot = await db.collection('site_profiles')
      .where('domain', '==', domain)
      .limit(1)
      .get();
    if (!snapshot.empty) {
      return snapshot.docs[0].data();
    }

    // Fall back to the "admin" configuration document
    doc = await db.collection('site_profiles').doc('admin').get();
    if (doc.exists) {
      return doc.data();
    }
  } catch (error) {
    console.error(`⚠️ [Scheduler Engine] Error fetching configuration profile for "${domain}":`, error.message);
  }

  // System absolute fallbacks
  return {
    brand_voice: "Professional and technical",
    target_audience: "Software Engineers",
    negative_keywords: ["cheap", "free"],
    seed_topic: "Software Engineering and AI",
    site_da: 30
  };
}

/**
 * Initialize all platform background schedulers (cron jobs).
 */
export function initializeScheduler() {
  console.log("[Scheduler] Booting up background engine tasks...");

  // 1. Monday Content Planner (runs every Monday at 02:00 AM)
  cron.schedule('0 2 * * 1', async () => {
    console.log("[Scheduler] Triggering Monday Content Planner job...");
    try {
      const db = admin.firestore();
      const domains = await getActiveDomains();
      console.log(`[Scheduler] Monday Content Planner: Found active domains: ${JSON.stringify(domains)}`);

      for (const domain of domains) {
        console.log(`[Scheduler] Monday Content Planner: Starting processing for domain "${domain}"`);
        try {
          const profile = await getDomainProfile(domain);

          // Resolve keyword research parameters
          let seedTopic = profile.seed_topic || profile.keyword;
          if (!seedTopic) {
            // Attempt to derive seed topic from domain's most recent keyword
            const recentDocs = await db.collection('content_pipeline')
              .where('domain', '==', domain)
              .orderBy('created_at', 'desc')
              .limit(1)
              .get();
            if (!recentDocs.empty) {
              seedTopic = recentDocs.docs[0].data().target_keyword;
            }
          }

          // Absolute fallback seed topic
          if (!seedTopic) {
            seedTopic = "Search Engine Optimization";
          }

          const siteDA = parseInt(profile.site_da || profile.da, 10) || 30;
          const targetIntent = profile.target_intent || "all";

          console.log(`[Scheduler] Monday Content Planner: Discovering keywords for "${domain}" using seed topic "${seedTopic}" (DA: ${siteDA})`);
          const clusters = await discoverKeywords(seedTopic, siteDA, targetIntent);

          if (!clusters || clusters.length === 0) {
            console.log(`[Scheduler] Monday Content Planner: No new unique keywords discovered for "${domain}".`);
            continue;
          }

          // Flatten clusters into a single pool for the calendar generator
          const keywordPool = [];
          clusters.forEach(cluster => {
            if (cluster.keywords && Array.isArray(cluster.keywords)) {
              cluster.keywords.forEach(kw => {
                keywordPool.push({
                  keyword: kw.keyword,
                  search_volume: kw.search_volume,
                  difficulty: kw.difficulty,
                  cluster: cluster.name
                });
              });
            }
          });

          console.log(`[Scheduler] Monday Content Planner: Mapping ${keywordPool.length} candidates into a 30-day editorial calendar...`);
          const calendarRoadmap = await generate30DayCalendar(domain, keywordPool);

          if (!calendarRoadmap || calendarRoadmap.length === 0) {
            console.log(`[Scheduler] Monday Content Planner: Calendar planning skipped (no new unique drafts to schedule) for "${domain}".`);
            continue;
          }

          // Commit scheduled articles draft templates to Firestore in batch
          console.log(`[Scheduler] Monday Content Planner: Executing batch save of ${calendarRoadmap.length} drafts for "${domain}"...`);
          const batch = db.batch();

          calendarRoadmap.forEach(item => {
            const docRef = db.collection('content_pipeline').doc();
            const cleanSlug = item.keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            batch.set(docRef, {
              title: `Draft: ${item.keyword}`,
              slug: cleanSlug,
              target_keyword: item.keyword,
              domain: domain,
              content_type: item.content_type,
              cluster_group: item.cluster_group,
              release_date: admin.firestore.Timestamp.fromDate(new Date(item.release_date)),
              status: "scheduled",
              created_at: admin.firestore.FieldValue.serverTimestamp()
            });
          });

          await batch.commit();
          console.log(`[Scheduler] Monday Content Planner: Successfully committed calendar pipeline for domain "${domain}".`);
        } catch (domainError) {
          console.error(`[Scheduler Error] Monday Content Plan failed for domain "${domain}": ${domainError.message}`);
        }
      }
    } catch (error) {
      console.error(`[Scheduler Error] Monday Content Plan failed: ${error.message}`);
    }
  });

  // 2. Sunday Health Check (runs every Sunday at 03:00 AM)
  cron.schedule('0 3 * * 0', async () => {
    console.log("[Scheduler] Triggering Sunday Health Check job...");
    try {
      const db = admin.firestore();
      const domains = await getActiveDomains();
      console.log(`[Scheduler] Sunday Health Check: Found active domains: ${JSON.stringify(domains)}`);

      for (const domain of domains) {
        console.log(`[Scheduler] Sunday Health Check: Auditing domain "${domain}"`);
        try {
          const auditMatrix = await runFullSiteAudit(domain);

          // Save audit results to database
          console.log(`[Scheduler] Sunday Health Check: Storing audit results for "${domain}" in Firestore...`);
          const docRef = await db.collection('site_audits').add({
            domain: domain,
            audit_data: auditMatrix,
            created_at: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`[Scheduler] Sunday Health Check: Audit successfully saved with ID "${docRef.id}" for "${domain}".`);
        } catch (domainError) {
          console.error(`[Scheduler Error] Sunday Health Check failed for domain "${domain}": ${domainError.message}`);
        }
      }
    } catch (error) {
      console.error(`[Scheduler Error] Sunday Health Check failed: ${error.message}`);
    }
  });

  // 3. Wednesday News Fetcher (runs every Wednesday at 04:00 AM)
  cron.schedule('0 4 * * 3', async () => {
    console.log("[Scheduler] Triggering Wednesday News Fetcher job...");
    try {
      const updateDocId = await scanForSEOUpdates();
      console.log(`[Scheduler] Wednesday News Fetcher: Search sweep finished. Latest updates saved with ID: "${updateDocId}"`);
    } catch (error) {
      console.error(`[Scheduler Error] Wednesday News Fetcher failed: ${error.message}`);
    }
  });
}
