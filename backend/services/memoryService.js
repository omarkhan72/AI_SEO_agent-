import admin from 'firebase-admin';

/**
 * Query site_profiles collection for a document with the ID matching userId (defaulting to "admin").
 * Fall back to a default profile if not found.
 * 
 * @param {string} userId - The ID of the site profile to retrieve. Defaults to "admin".
 * @returns {Promise<Object>} The site profile configuration object.
 */
export async function getSiteProfile(userId = "admin") {
  const db = admin.firestore();
  const docRef = db.collection('site_profiles').doc(userId);
  const doc = await docRef.get();

  if (!doc.exists) {
    return {
      brand_voice: "Professional and technical",
      target_audience: "Software Engineers",
      negative_keywords: ["cheap", "free"]
    };
  }

  return doc.data();
}

/**
 * Log an agent action to Firestore under the agent_memory_logs collection.
 * 
 * @param {string} keyword - The target keyword.
 * @param {boolean} success - Whether the action was successful.
 * @param {Object} metadata - Additional context/metadata for the action.
 * @returns {Promise<string>} The created log document ID.
 */
export async function logAgentAction(keyword, success, metadata) {
  const db = admin.firestore();
  const logData = {
    keyword,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    outcome: success ? "success" : "failure",
    success,
    metadata: metadata || {}
  };

  const docRef = await db.collection('agent_memory_logs').add(logData);
  return docRef.id;
}
