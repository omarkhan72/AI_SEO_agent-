import express from 'express';
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

dotenv.config();

// 1. Initialize Firebase Storage Connection
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

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

    // 4. Save draft to Firestore collection
    console.log("Saving content blueprint and draft to Firestore...");
    const docRef = await db.collection('content_pipeline').add({
      title: blueprint.title,
      slug: blueprint.slug,
      markdown_body: fullMarkdown,
      target_keyword: keyword,
      status: "draft",
      author: "Omar Khan",
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // 5. Return success response
    return res.status(200).json({
      documentId: docRef.id,
      slug: blueprint.slug,
      title: blueprint.title,
      headings: blueprint.headings,
      markdown: fullMarkdown
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

// 3. Initialize background scheduling for weekly scan
cron.schedule('0 0 * * 1', async () => {
  try {
    console.log("[Auto-Updater] Executing weekly SEO updates scan...");
    await scanForSEOUpdates();
    console.log("[Auto-Updater] Weekly SEO knowledge base refreshed");
  } catch (error) {
    console.error("❌ [Auto-Updater] Failed weekly SEO update scan:", error);
  }
});

// 4. Initialize Core Server Listener
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Node.js Server Active on Port ${PORT}`);
});
