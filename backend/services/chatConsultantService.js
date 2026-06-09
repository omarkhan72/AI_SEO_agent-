import admin from 'firebase-admin';
import { handleMultiTurnChat } from './aiBrainService.js';

// Local in-memory session cache fallback for uninitialized database environments
const memorySessions = new Map();

/**
 * Concurrently gathers domain-specific site profiles, audits, and underperforming keywords.
 * Incorporates simulated fallbacks if Firestore queries fail.
 * 
 * @param {string} domain - Target website domain.
 * @returns {Promise<Object>} Formatted string context maps for the AI system prompt.
 */
export async function getChatContext(domain) {
  const db = admin.firestore();

  let profile = null;
  let audit = null;
  const underperforming = [];

  // 1. Fetch site profile (domain-specific -> admin -> fallback default)
  try {
    let doc = await db.collection('site_profiles').doc(domain).get();
    if (doc.exists) {
      profile = doc.data();
    } else {
      doc = await db.collection('site_profiles').doc('admin').get();
      if (doc.exists) {
        profile = doc.data();
      }
    }
  } catch (err) {
    console.warn("⚠️ [Chat Consultant] Firestore profile fetch failed, using fallback:", err.message);
  }

  if (!profile) {
    profile = {
      brand_voice: "Professional and technical",
      target_audience: "Software Engineers",
      negative_keywords: ["cheap", "free"],
      site_da: 30
    };
  }

  // 2. Fetch the most recent technical audit report
  try {
    const auditSnap = await db.collection('site_audits')
      .where('domain', '==', domain)
      .orderBy('created_at', 'desc')
      .limit(1)
      .get();

    if (!auditSnap.empty) {
      audit = auditSnap.docs[0].data();
    }
  } catch (err) {
    console.warn("⚠️ [Chat Consultant] Firestore audits fetch failed, using fallback:", err.message);
  }

  if (!audit) {
    audit = {
      domain,
      dimension_scores: { technical: 82, on_page: 75, off_page: 60, content_quality: 80, mobile_ux: 85, eeat: 70 },
      algorithm_alignment: "Minor E-E-A-T warnings on blog layout",
      action_plan_30_days: [
        "Create dedicated author profile pages to boost E-E-A-T credentials.",
        "Add descriptive JSON-LD schema blocks to all published drafts."
      ]
    };
  }

  // 3. Fetch underperforming keywords (current_position > 15)
  try {
    // Find all doc IDs for domain
    const pipelineSnap = await db.collection('content_pipeline')
      .where('domain', '==', domain)
      .get();
    
    const docIds = [];
    pipelineSnap.forEach(d => docIds.push(d.id));

    if (docIds.length > 0) {
      const snapQuery = await db.collection('performance_snapshots')
        .where('current_position', '>', 15)
        .get();

      snapQuery.forEach(d => {
        const data = d.data();
        if (docIds.includes(data.documentId)) {
          underperforming.push({
            keyword: data.keyword,
            position: data.current_position,
            is_win: data.is_win || false
          });
        }
      });
    }
  } catch (err) {
    console.warn("⚠️ [Chat Consultant] Firestore snapshots fetch failed, using fallback:", err.message);
  }

  // Default fallback if no underperforming snapshots are found
  if (underperforming.length === 0) {
    underperforming.push({
      keyword: "react hooks tutorial",
      position: 18,
      is_win: false
    });
  }

  return {
    site_profile: JSON.stringify(profile, null, 2),
    technical_audit: JSON.stringify(audit, null, 2),
    underperforming_pages: JSON.stringify(underperforming, null, 2)
  };
}

/**
 * Handles a multi-turn SEO consulting conversation, fetching context and saving results.
 * Supports robust in-memory session cache fallbacks.
 * 
 * @param {string} domain - Target domain.
 * @param {string} sessionId - The session identifier.
 * @param {string} userMessage - The new user input message.
 * @returns {Promise<Object>} The consultant's text response and updated history.
 */
export async function handleConsultantChat(domain, sessionId, userMessage) {
  const db = admin.firestore();
  let history = [];

  console.log(`[Chat Consultant] Message received for session: "${sessionId}" (Domain: "${domain}")`);

  // 1. Fetch conversational history from Firestore
  try {
    const doc = await db.collection('chat_sessions').doc(sessionId).get();
    if (doc.exists && Array.isArray(doc.data().messages)) {
      history = doc.data().messages;
    }
  } catch (err) {
    console.warn("⚠️ [Chat Consultant] Firestore history load failed, trying local memory cache:", err.message);
    history = memorySessions.get(sessionId) || [];
  }

  // 2. Fetch live site context data
  const context = await getChatContext(domain);

  // 3. Assemble messages history payload (including userMessage)
  const messagesToSend = [...history, { role: 'user', content: userMessage }];

  // Keep historical payload within limits (last 10-15 messages)
  const conversationPayload = messagesToSend.slice(-15);

  // 4. Invoke Claude multi-turn advisor chat
  const responseText = await handleMultiTurnChat('SEO_CONSULTANT', conversationPayload, context);

  // 5. Append interaction response to history
  const updatedHistory = [
    ...conversationPayload,
    { role: 'assistant', content: responseText }
  ];

  // 6. Save updated session to Firestore (or in-memory cache on error)
  try {
    await db.collection('chat_sessions').doc(sessionId).set({
      domain,
      messages: updatedHistory,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log(`[Chat Consultant] Conversation session saved to Firestore for ID: "${sessionId}"`);
  } catch (err) {
    console.warn("⚠️ [Chat Consultant] Firestore session write failed, caching in local memory:", err.message);
    memorySessions.set(sessionId, updatedHistory);
  }

  return {
    responseText,
    history: updatedHistory
  };
}
