import express from 'express';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import OpenAI from 'openai';
import serviceAccount from './serviceAccountKey.json' with { type: 'json' };
import { generateArticleSections } from './services/writerService.js';
import { fetchLiveSearchContext } from './services/searchService.js';
import { getSiteProfile, logAgentAction } from './services/memoryService.js';
import { generateStructuredJSON } from './services/aiBrainService.js';
import cron from 'node-cron';
import { scanForSEOUpdates } from './services/autoUpdaterService.js';
import { discoverKeywords } from './services/keywordResearchService.js';
import { analyzeCompetitorGaps } from './services/competitorService.js';
import { runFullSiteAudit } from './services/auditEngineService.js';
import { generateTrustSignals } from './services/eeatSchemaService.js';
import { writeFullArticle } from './services/articleWriterService.js';
import { evaluateAndRefreshContent } from './services/contentRefreshService.js';
import { generateLinkSuggestions, auditSiteLinks } from './services/internalLinkingService.js';
import { discoverLinkOpportunities, generateOutreachTemplate } from './services/backlinkStrategyService.js';
import { analyzeGscPerformance } from './services/gscAnalyzerService.js';
import { generate30DayCalendar } from './services/contentCalendarService.js';
import { initializeScheduler } from './services/schedulerService.js';
import { trackAndLogPerformance, generateImprovementSuggestions } from './services/performanceTrackerService.js';
import { handleConsultantChat } from './services/chatConsultantService.js';

dotenv.config();

// 1. Initialize Firebase Storage Connection
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Auto-seed administrative site profile if missing
(async () => {
  try {
    const configPath = './admin_config.json';
    if (fs.existsSync(configPath)) {
      const docRef = db.collection('site_profiles').doc('admin');
      const doc = await docRef.get();
      if (!doc.exists) {
        console.log('[System] Seeding baseline E-E-A-T site profile from admin_config.json...');
        const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        await docRef.set(configData);
        console.log('[System] Seeded baseline E-E-A-T site profile in Firestore successfully.');
      }
    }
  } catch (seedError) {
    console.warn('⚠️ [System] Site profile auto-seeding failed:', seedError.message);
  }
})();


// 2. Initialize OpenAI Engine Connection
const openaiApiKey = process.env.OPENAI_API_KEY;
const openai = openaiApiKey && openaiApiKey !== 'your_openai_api_key_here' ? new OpenAI({ apiKey: openaiApiKey }) : null;

const app = express();
app.use(cors());
app.use(express.json());

// 3. Testing Endpoint to ensure your backend works before adding the AI logic
app.get('/api/status', (req, res) => {
  res.status(200).json({ status: "online", message: "SEO Agent Backend Operating Standardly" });
});

app.post('/api/plan-content', async (req, res) => {
  const { keyword } = req.body;
  
  if (!keyword) {
    return res.status(400).json({ error: "Please provide a keyword in the request body." });
  }

  try {
    // Fetch Global Site Profile memory
    let siteProfile;
    try {
      siteProfile = await getSiteProfile("admin");
    } catch (profileError) {
      console.error("❌ Firestore Profile Read Error, using fallback:", profileError);
      siteProfile = {
        brand_voice: "Professional and technical",
        target_audience: "Software Engineers",
        negative_keywords: ["cheap", "free"]
      };
    }

    // Step 1: Fetch live search data using our Brave tool
    const liveData = await fetchLiveSearchContext(keyword);
    const searchContextString = JSON.stringify(liveData);

    // Step 2 & 3: Request and parse structured JSON outline from Claude
    console.log(`[AI Brain] Planning outline for: "${keyword}" using live context...`);
    const userContent = `Target Keyword: ${keyword}. Live Web Context: ${searchContextString}`;
    const variables = {
      brand_voice: siteProfile.brand_voice,
      target_audience: siteProfile.target_audience,
      negative_keywords: siteProfile.negative_keywords.join(', ')
    };
    const outline = await generateStructuredJSON('SEO_OUTLINE_PLANNER', userContent, variables);
    console.log(`[AI Brain] Outline planned successfully: ${outline.title}`);

    // Step 4: Write outline draft to Firestore content_pipeline collection
    let docRef = null;
    try {
      console.log("[Firestore] Saving planned outline draft...");
      docRef = await db.collection('content_pipeline').add({
        title: outline.title,
        slug: outline.slug,
        headings: outline.headings,
        target_keyword: keyword,
        status: "draft",
        author: "Omar Khan",
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`[Firestore] Outline draft saved with ID: ${docRef.id}`);

      // Log successful generation action to Firestore
      try {
        await logAgentAction(keyword, true, { type: "outline_planned" });
      } catch (logError) {
        console.error("❌ Firestore Log Action Error:", logError);
      }
    } catch (dbError) {
      console.error("❌ Firestore Write Error during content planning:", dbError);
    }

    res.status(200).json({
      success: true,
      documentId: docRef ? docRef.id : null,
      data: outline
    });

  } catch (error) {
    console.error("❌ Content Planner Error:", error);
    res.status(500).json({ error: "Internal Server Error during content planning", details: error.message });
  }
});

// Endpoint to discover competitive keywords grouped in semantic clusters
app.post('/api/research-keywords', async (req, res) => {
  const { seedTopic, siteDA, intent } = req.body;

  if (!seedTopic) {
    return res.status(400).json({ error: "Please provide a seedTopic in the request body." });
  }

  const daValue = siteDA !== undefined ? siteDA : 30; // Fallback default DA
  const intentValue = intent || "all";

  try {
    console.log(`[HTTP Route] Triggering keyword discovery for topic: "${seedTopic}" (DA: ${daValue}, Intent: ${intentValue})`);
    const clusters = await discoverKeywords(seedTopic, daValue, intentValue);

    return res.status(200).json({
      success: true,
      seedTopic,
      siteDA: daValue,
      intent: intentValue,
      data: clusters
    });
  } catch (error) {
    console.error("❌ Keyword Research Route Error:", error);
    return res.status(500).json({
      error: "Internal Server Error during keyword research",
      details: error.message
    });
  }
});

// Endpoint to execute a deep competitor outline extraction and content gap analysis
app.post('/api/competitor-intelligence', async (req, res) => {
  const { keyword, targetDomain } = req.body;

  if (!keyword || !targetDomain) {
    return res.status(400).json({ error: "Please provide both keyword and targetDomain in the request body." });
  }

  try {
    console.log(`[HTTP Route] Triggering competitor gap analysis for: "${keyword}" (Domain: "${targetDomain}")`);
    const gapAnalysis = await analyzeCompetitorGaps(keyword, targetDomain);

    // Save a running log of this gap audit to Firestore collection 'competitor_audits'
    let auditDocId = null;
    try {
      console.log("[Firestore] Logging competitor gap audit...");
      const docRef = await db.collection('competitor_audits').add({
        keyword,
        target_domain: targetDomain,
        audit_data: gapAnalysis,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      auditDocId = docRef.id;
      console.log(`[Firestore] Competitor audit saved with ID: ${auditDocId}`);
    } catch (dbError) {
      console.error("❌ Firestore Write Error during competitor audit logging:", dbError);
    }

    return res.status(200).json({
      success: true,
      auditDocumentId: auditDocId,
      data: gapAnalysis
    });

  } catch (error) {
    console.error("❌ Competitor Intelligence Route Error:", error);
    return res.status(500).json({
      error: "Internal Server Error during competitor gap analysis",
      details: error.message
    });
  }
});

// Endpoint to execute a comprehensive multi-dimensional SEO site audit
app.post('/api/site-audit', async (req, res) => {
  const { targetDomain } = req.body;

  if (!targetDomain) {
    return res.status(400).json({ error: "Please provide targetDomain in the request body." });
  }

  try {
    console.log(`[HTTP Route] Triggering full site audit for: "${targetDomain}"`);
    const auditMatrix = await runFullSiteAudit(targetDomain);

    // Save the audit outcome to Firestore collection 'site_audits'
    let auditDocId = null;
    try {
      console.log("[Firestore] Saving site audit report...");
      const docRef = await db.collection('site_audits').add({
        domain: targetDomain,
        audit_data: auditMatrix,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      auditDocId = docRef.id;
      console.log(`[Firestore] Site audit report saved with ID: ${auditDocId}`);
    } catch (dbError) {
      console.error("❌ Firestore Write Error during site audit saving:", dbError);
    }

    return res.status(200).json({
      success: true,
      auditDocumentId: auditDocId,
      data: auditMatrix
    });

  } catch (error) {
    console.error("❌ Site Audit Route Error:", error);
    return res.status(500).json({
      error: "Internal Server Error during full site audit",
      details: error.message
    });
  }
});

// Endpoint to write a full deep-dive article from a stored outline draft blueprint
app.post('/api/write-article', async (req, res) => {
  const { documentId } = req.body;

  if (!documentId) {
    return res.status(400).json({ error: "Please provide documentId in the request body." });
  }

  try {
    console.log(`[HTTP Route] Triggering article copywriter for document: "${documentId}"`);
    const articlePayload = await writeFullArticle(documentId);

    // Update the existing document in Firestore content_pipeline collection
    console.log("[Firestore] Saving completed article body and metadata...");
    await db.collection('content_pipeline').doc(documentId).update({
      full_content_html: articlePayload.full_content_html,
      meta_title: articlePayload.meta_title,
      meta_description: articlePayload.meta_description,
      reading_time: articlePayload.reading_time,
      status: "completed",
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`[Firestore] Document "${documentId}" successfully updated status to completed.`);

    return res.status(200).json({
      success: true,
      documentId,
      data: articlePayload
    });

  } catch (error) {
    console.error("❌ Article Writer Route Error:", error);
    return res.status(500).json({
      error: "Internal Server Error during article writing",
      details: error.message
    });
  }
});

// Endpoint to audit and proactively refresh semantically stale articles
app.post('/api/refresh-article', async (req, res) => {
  const { documentId } = req.body;

  if (!documentId) {
    return res.status(400).json({ error: "Please provide documentId in the request body." });
  }

  try {
    console.log(`[HTTP Route] Triggering content refresh for document: "${documentId}"`);
    const refreshPayload = await evaluateAndRefreshContent(documentId);

    // If it wasn't skipped (i.e. aged over 90 days), save updates to Firestore
    if (!refreshPayload.skipped) {
      console.log("[Firestore] Saving refreshed article content and freshness metadata...");
      await db.collection('content_pipeline').doc(documentId).update({
        full_content_html: refreshPayload.updated_html_content,
        freshness_score: refreshPayload.new_freshness_score,
        refresh_summary: refreshPayload.refresh_summary,
        last_updated: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp() // Sync updated_at field too
      });
      console.log(`[Firestore] Document "${documentId}" successfully refreshed.`);
    }

    return res.status(200).json({
      success: true,
      documentId,
      data: refreshPayload
    });

  } catch (error) {
    console.error("❌ Content Refresh Route Error:", error);
    return res.status(500).json({
      error: "Internal Server Error during content refresh",
      details: error.message
    });
  }
});

// Endpoint to generate context-optimized internal link anchor suggestions for a new article
app.post('/api/internal-links/suggest', async (req, res) => {
  const { newArticleId } = req.body;

  if (!newArticleId) {
    return res.status(400).json({ error: "Please provide newArticleId in the request body." });
  }

  try {
    console.log(`[HTTP Route] Fetching internal linking suggestions for article: "${newArticleId}"`);
    const suggestions = await generateLinkSuggestions(newArticleId);

    return res.status(200).json({
      success: true,
      newArticleId,
      data: suggestions
    });

  } catch (error) {
    console.error("❌ Link Suggestion Route Error:", error);
    return res.status(500).json({
      error: "Internal Server Error during internal link suggestions generation",
      details: error.message
    });
  }
});

// Endpoint to audit site content structure and locate orphan pages (0 inbound internal links)
app.post('/api/internal-links/audit', async (req, res) => {
  const { targetDomain } = req.body;

  if (!targetDomain) {
    return res.status(400).json({ error: "Please provide targetDomain in the request body." });
  }

  try {
    console.log(`[HTTP Route] Performing internal linking audit for domain: "${targetDomain}"`);
    const auditReport = await auditSiteLinks(targetDomain);

    return res.status(200).json({
      success: true,
      targetDomain,
      data: auditReport
    });

  } catch (error) {
    console.error("❌ Link Audit Route Error:", error);
    return res.status(500).json({
      error: "Internal Server Error during site linking graph audit",
      details: error.message
    });
  }
});

// Endpoint to fetch potential Guest Posts and Unlinked Brand Mentions
app.post('/api/backlinks/discover', async (req, res) => {
  const { keyword, brandName, targetDomain } = req.body;

  if (!keyword || !brandName || !targetDomain) {
    return res.status(400).json({ error: "Please provide keyword, brandName, and targetDomain in the request body." });
  }

  try {
    console.log(`[HTTP Route] Discovering backlink opportunities for Brand: "${brandName}" (Keyword: "${keyword}")`);
    const opportunities = await discoverLinkOpportunities(keyword, brandName, targetDomain);

    // Save campaigns to Firestore collection 'backlink_campaigns' with status "prospecting"
    let campaignDocId = null;
    try {
      console.log("[Firestore] Storing discovered backlink campaign prospects...");
      const docRef = await db.collection('backlink_campaigns').add({
        keyword,
        brand_name: brandName,
        target_domain: targetDomain,
        guest_post_targets: opportunities.guest_post_targets,
        unlinked_mentions: opportunities.unlinked_mentions,
        status: "prospecting",
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      campaignDocId = docRef.id;
      console.log(`[Firestore] Backlink campaign stored with ID: ${campaignDocId}`);
    } catch (dbError) {
      console.error("❌ Firestore Write Error during backlink campaign saving:", dbError);
    }

    return res.status(200).json({
      success: true,
      campaignDocumentId: campaignDocId,
      data: opportunities
    });

  } catch (error) {
    console.error("❌ Backlink Discovery Route Error:", error);
    return res.status(500).json({
      error: "Internal Server Error during backlink opportunities discovery",
      details: error.message
    });
  }
});

// Endpoint to generate a customized digital PR outreach pitch for a partner domain
app.post('/api/backlinks/outreach', async (req, res) => {
  const { targetUrl, opportunityType, brandName } = req.body;

  if (!targetUrl || !opportunityType || !brandName) {
    return res.status(400).json({ error: "Please provide targetUrl, opportunityType, and brandName in the request body." });
  }

  try {
    console.log(`[HTTP Route] Generating outreach email template for target: "${targetUrl}"`);
    const emailTemplate = await generateOutreachTemplate(targetUrl, opportunityType, brandName);

    return res.status(200).json({
      success: true,
      targetUrl,
      opportunityType,
      data: emailTemplate
    });

  } catch (error) {
    console.error("❌ Outreach Generation Route Error:", error);
    return res.status(500).json({
      error: "Internal Server Error during outreach template generation",
      details: error.message
    });
  }
});

// Endpoint to fetch GSC performance analytics, find Page 2 opportunities, and run AI CRO optimizations
app.post('/api/gsc-audit', async (req, res) => {
  const { siteUrl } = req.body;

  if (!siteUrl) {
    return res.status(400).json({ error: "Please provide siteUrl in the request body." });
  }

  try {
    console.log(`[HTTP Route] Triggering GSC performance audit for site: "${siteUrl}"`);
    const gscAuditPayload = await analyzeGscPerformance(siteUrl);

    // Save results to Firestore collection 'gsc_audits'
    let auditDocId = null;
    try {
      console.log("[Firestore] Saving GSC performance audit report...");
      const docRef = await db.collection('gsc_audits').add({
        site_url: siteUrl,
        audit_data: gscAuditPayload,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      auditDocId = docRef.id;
      console.log(`[Firestore] GSC audit report saved with ID: ${auditDocId}`);
    } catch (dbError) {
      console.error("❌ Firestore Write Error during GSC audit saving:", dbError);
    }

    return res.status(200).json({
      success: true,
      auditDocumentId: auditDocId,
      data: gscAuditPayload
    });

  } catch (error) {
    console.error("❌ GSC Audit Route Error:", error);
    return res.status(500).json({
      error: "Internal Server Error during Google Search Console performance audit",
      details: error.message
    });
  }
});

// Endpoint to generate a prioritized, structured 30-day publishing calendar from keyword pools
app.post('/api/content-calendar/generate', async (req, res) => {
  const { domain, keywordPool } = req.body;

  if (!domain || !keywordPool || !Array.isArray(keywordPool)) {
    return res.status(400).json({ error: "Please provide both domain and a keywordPool array in the request body." });
  }

  try {
    console.log(`[HTTP Route] Generating content calendar roadmap for: "${domain}"`);
    const calendarRoadmap = await generate30DayCalendar(domain, keywordPool);

    if (calendarRoadmap.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No unique keywords to schedule after duplicate checks.",
        data: []
      });
    }

    // Save scheduled articles to Firestore content_pipeline collection using batch writes
    console.log(`[Firestore] Executing batch writes to save ${calendarRoadmap.length} scheduled drafts...`);
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
    console.log("[Firestore] Batch sync for content calendar completed successfully.");

    return res.status(200).json({
      success: true,
      domain,
      data: calendarRoadmap
    });

  } catch (error) {
    console.error("❌ Content Calendar Route Error:", error);
    return res.status(500).json({
      error: "Internal Server Error during content calendar generation",
      details: error.message
    });
  }
});

// Endpoint to track and log search performance metrics for an article
app.post('/api/performance/track', async (req, res) => {
  const { documentId } = req.body;

  if (!documentId) {
    return res.status(400).json({ error: "Please provide documentId in the request body." });
  }

  try {
    console.log(`[HTTP Route] Triggering rank check and snapshot logging for document: "${documentId}"`);
    const snapshot = await trackAndLogPerformance(documentId);

    return res.status(200).json({
      success: true,
      data: snapshot
    });
  } catch (error) {
    console.error("❌ Performance Tracker Route Error:", error);
    return res.status(500).json({
      error: "Internal Server Error during performance tracking",
      details: error.message
    });
  }
});

// Endpoint to generate automated SEO optimization recommendations for a decaying/slipping article
app.get('/api/performance/suggestions/:documentId', async (req, res) => {
  const { documentId } = req.params;

  if (!documentId) {
    return res.status(400).json({ error: "Please provide documentId in the path parameters." });
  }

  try {
    console.log(`[HTTP Route] Requesting SEO improvement suggestions for document: "${documentId}"`);
    const suggestionsReport = await generateImprovementSuggestions(documentId);

    return res.status(200).json({
      success: true,
      data: suggestionsReport
    });
  } catch (error) {
    console.error("❌ Suggestions Generator Route Error:", error);
    return res.status(500).json({
      error: "Internal Server Error during suggestions generation",
      details: error.message
    });
  }
});

// Endpoint to handle SEO consulting conversational chat sessions
app.post('/api/chat/message', async (req, res) => {
  const { domain, sessionId, message } = req.body;

  if (!domain || !message) {
    return res.status(400).json({ error: "Please provide both domain and message in the request body." });
  }

  // Generate a unique session ID if not provided by frontend
  const activeSessionId = sessionId || `session_${Math.random().toString(36).substr(2, 9)}`;

  try {
    console.log(`[HTTP Route] Dispatching SEO Chat Consultant request for session: "${activeSessionId}" (Domain: "${domain}")`);
    const chatResponse = await handleConsultantChat(domain, activeSessionId, message);

    return res.status(200).json({
      success: true,
      sessionId: activeSessionId,
      responseText: chatResponse.responseText,
      history: chatResponse.history
    });
  } catch (error) {
    console.error("❌ Chat Consultant Route Error:", error);
    return res.status(500).json({
      error: "Internal Server Error during conversational consultation",
      details: error.message
    });
  }
});

// Unified endpoint to compose an article from scratch using Search -> Plan -> Write
app.post('/api/agent/compose', async (req, res) => {
  try {
    if (!openai) {
      return res.status(500).json({ error: "OpenAI client is not initialized. Please configure OPENAI_API_KEY in your env file." });
    }

    const { keyword } = req.body;
    if (!keyword) {
      return res.status(400).json({ error: "Keyword is required in request body" });
    }

    console.log(`Starting content generation agent for keyword: "${keyword}"`);

    // 1. Fetch live search context
    const serpContext = await fetchLiveSearchContext(keyword);

    // 2. Generate content blueprint (Planner)
    console.log("Planning article structure...");
    const plannerCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert SEO Content Planner. You must analyze the provided live SERP context and the target keyword, then output a highly optimized article blueprint.
Your output must be a valid JSON object matching this exact schema:
{
  "title": "A highly optimized, click-worthy SEO title string",
  "slug": "url-safe-slug-string",
  "headings": ["H2 Heading 1", "H2 Heading 2", "H2 Heading 3"]
}`
        },
        {
          role: "user",
          content: `Keyword: ${keyword}\nLive SERP Context: ${serpContext}`
        }
      ],
      response_format: { type: "json_object" }
    });

    let blueprint;
    try {
      blueprint = JSON.parse(plannerCompletion.choices[0].message.content);
    } catch (parseError) {
      console.error("OpenAI planner failed to return valid JSON:", parseError);
      return res.status(500).json({ 
        error: "Failed to parse content blueprint from AI model",
        raw: plannerCompletion.choices[0].message.content
      });
    }

    // Validation check on blueprint to prevent errors in loop
    if (!blueprint.title || !blueprint.headings || !Array.isArray(blueprint.headings)) {
      throw new Error("Invalid blueprint format returned from AI model");
    }

    // 3. Generate article sections iteratively (Writing Loop)
    console.log(`Generating content sections for blueprint: "${blueprint.title}"`);
    const fullMarkdown = await generateArticleSections(blueprint.title, blueprint.headings, serpContext);

    // 3.5. Generate E-E-A-T schema and trust signals
    let trustSignals = null;
    try {
      console.log("[E-E-A-T Engine] Building trust signals for article...");
      trustSignals = await generateTrustSignals(
        { title: blueprint.title, headings: blueprint.headings, content: fullMarkdown },
        { name: "Omar Khan", role: "Full Stack Web Developer & Principal AI Architect" }
      );
    } catch (eeatError) {
      console.error("❌ E-E-A-T Generation Error:", eeatError);
    }

    // 4. Save draft to Firestore collection
    console.log("Saving content blueprint and draft to Firestore...");
    const docRef = await db.collection('content_pipeline').add({
      title: blueprint.title,
      slug: blueprint.slug,
      markdown_body: fullMarkdown,
      target_keyword: keyword,
      status: "draft",
      author: "Omar Khan",
      schema_json_ld: trustSignals ? trustSignals.schema_json_ld : null,
      author_bio_html: trustSignals ? trustSignals.author_bio_html : null,
      eeat_trust_score: trustSignals ? trustSignals.eeat_trust_score : null,
      about_page_tips: trustSignals ? trustSignals.about_page_tips : null,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // 5. Return success response
    return res.status(200).json({
      documentId: docRef.id,
      slug: blueprint.slug,
      title: blueprint.title,
      headings: blueprint.headings,
      markdown: fullMarkdown,
      schema_json_ld: trustSignals ? trustSignals.schema_json_ld : null,
      author_bio_html: trustSignals ? trustSignals.author_bio_html : null,
      eeat_trust_score: trustSignals ? trustSignals.eeat_trust_score : null,
      about_page_tips: trustSignals ? trustSignals.about_page_tips : null
    });

  } catch (error) {
    console.error("Error in compose route:", error);
    return res.status(500).json({ error: "An internal server error occurred during content composition" });
  }
});

// Endpoint to get all draft articles
app.get('/api/drafts', async (req, res) => {
  try {
    const snapshot = await db.collection('content_pipeline')
      .where('status', '==', 'draft')
      .get();
    
    const drafts = [];
    snapshot.forEach(doc => {
      drafts.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Sort in-memory to prevent errors if composite index isn't built yet
    drafts.sort((a, b) => {
      const timeA = a.created_at ? (a.created_at.toDate ? a.created_at.toDate().getTime() : new Date(a.created_at).getTime()) : 0;
      const timeB = b.created_at ? (b.created_at.toDate ? b.created_at.toDate().getTime() : new Date(b.created_at).getTime()) : 0;
      return timeB - timeA;
    });

    return res.status(200).json(drafts);
  } catch (error) {
    console.error("Error fetching drafts:", error);
    return res.status(500).json({ error: "Failed to fetch drafts from database" });
  }
});

// Endpoint to publish a draft (update status to published)
app.post('/api/drafts/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('content_pipeline').doc(id).update({
      status: 'published'
    });
    return res.status(200).json({ success: true, message: "Draft published successfully" });
  } catch (error) {
    console.error("Error publishing draft:", error);
    return res.status(500).json({ error: "Failed to publish draft" });
  }
});

// Endpoint to get a single published article by slug
app.get('/api/posts/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const snapshot = await db.collection('content_pipeline')
      .where('slug', '==', slug)
      .where('status', '==', 'published')
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return res.status(404).json({ error: "Article not found" });
    }
    
    let article;
    snapshot.forEach(doc => {
      article = { id: doc.id, ...doc.data() };
    });
    
    return res.status(200).json(article);
  } catch (error) {
    console.error("Error fetching article by slug:", error);
    return res.status(500).json({ error: "Failed to fetch article" });
  }
});

// 4. Initialize Core Server Listener
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Node.js Server Active on Port ${PORT}`);
  initializeScheduler();
  console.log('[System] Centralized Background Scheduler Initialized.');
});
