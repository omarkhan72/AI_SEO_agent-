import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import OpenAI from 'openai';
import serviceAccount from './serviceAccountKey.json' with { type: 'json' };
import { generateArticleSections } from './services/writerService.js';
import { fetchLiveSearchContext } from './services/searchService.js';

dotenv.config();

// 1. Initialize Firebase Storage Connection
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// 2. Initialize OpenAI Engine Connection
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    // Step 1: Fetch live search data using our Brave tool
    const liveData = await fetchLiveSearchContext(keyword);
    const searchContextString = JSON.stringify(liveData);

    // Step 2: Request structured JSON output from OpenAI
    console.log(`[AI Brain] Planning outline for: "${keyword}" using live context...`);
    const outlineResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: "json_object" },
      messages: [
        {
          role: 'system',
          content: `You are an expert SEO Strategist. Analyze the provided live web search context and return a valid JSON object matching this exact schema:
          {
            "title": "A highly optimized, catchy SEO title string",
            "slug": "url-safe-slug-version-of-title",
            "headings": ["H2 Heading 1", "H2 Heading 2", "H2 Heading 3"]
          }`
        },
        {
          role: 'user',
          content: `Target Keyword: ${keyword}. Live Web Context: ${searchContextString}`
        }
      ]
    });

    // Step 3: Parse and return the JSON outline
    const outline = JSON.parse(outlineResponse.choices[0].message.content);
    console.log(`[AI Brain] Outline planned successfully: ${outline.title}`);

    res.status(200).json({
      success: true,
      data: outline
    });

  } catch (error) {
    console.error("❌ Content Planner Error:", error);
    res.status(500).json({ error: "Internal Server Error during content planning", details: error.message });
  }
});

// Unified endpoint to compose an article from scratch using Search -> Plan -> Write
app.post('/api/agent/compose', async (req, res) => {
  try {
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

// 4. Initialize Core Server Listener
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Node.js Server Active on Port ${PORT}`);
});
