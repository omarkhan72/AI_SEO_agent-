import admin from 'firebase-admin';

/**
 * Checks for duplicate keywords, groups them into pillars and clusters, prioritizes them,
 * and maps publishing dates over a 30-day timeline following a thrice-weekly publishing cadence.
 * 
 * @param {string} domain - Target website domain.
 * @param {Array<Object>} keywordPool - Array of keyword objects (e.g. [{ keyword, search_volume, difficulty, cluster }]).
 * @returns {Promise<Array<Object>>} Structured array representing the calendar roadmap.
 */
export async function generate30DayCalendar(domain, keywordPool) {
  const db = admin.firestore();

  console.log(`[Calendar Engine] Generating calendar for domain: "${domain}" (Input Pool Size: ${keywordPool.length})`);

  // Step 1: Duplicate Checker
  // Fetch existing target keywords for this domain to enforce zero-repeats
  const existingKeywords = new Set();
  try {
    const snapshot = await db.collection('content_pipeline')
      .where('domain', '==', domain)
      .get();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.target_keyword) {
        existingKeywords.add(data.target_keyword.toLowerCase().trim());
      }
    });
    console.log(`[Calendar Engine] Found ${existingKeywords.size} existing keywords in content_pipeline.`);
  } catch (dbError) {
    console.error("❌ [Calendar Engine] Error querying duplicates from Firestore:", dbError);
    // Proceed with empty set if DB query fails to make calendar service resilient
  }

  // Filter pool to only unique keywords
  const uniquePool = keywordPool.filter(item => {
    if (!item.keyword) return false;
    const cleanKw = item.keyword.toLowerCase().trim();
    return !existingKeywords.has(cleanKw);
  });

  console.log(`[Calendar Engine] Keywords remaining after duplicate filter: ${uniquePool.length}`);

  if (uniquePool.length === 0) {
    return [];
  }

  // Step 2: Pillar/Cluster Strategy Balance
  // Group keywords by cluster (thematic groups)
  const groupedByCluster = {};
  uniquePool.forEach(item => {
    const clusterName = item.cluster || "General Opportunity";
    if (!groupedByCluster[clusterName]) {
      groupedByCluster[clusterName] = [];
    }
    groupedByCluster[clusterName].push(item);
  });

  const calendarPool = [];
  Object.keys(groupedByCluster).forEach(clusterName => {
    const list = groupedByCluster[clusterName];
    // Sort within cluster by search volume descending
    list.sort((a, b) => {
      const volA = parseInt(a.search_volume, 10) || 0;
      const volB = parseInt(b.search_volume, 10) || 0;
      return volB - volA;
    });

    list.forEach((item, index) => {
      // Highest volume keyword in the cluster is the "Pillar" page
      // Supporting pages are "Cluster" content
      const contentType = index === 0 ? "pillar" : "cluster";
      calendarPool.push({
        keyword: item.keyword.trim(),
        search_volume: parseInt(item.search_volume, 10) || 100,
        difficulty: parseInt(item.difficulty, 10) || 30,
        content_type: contentType,
        cluster_group: clusterName
      });
    });
  });

  // Step 3: Keyword Priority Sorting
  // Sort schedule so high-opportunity keywords (highest search volume, lowest difficulty) publish first.
  calendarPool.sort((a, b) => {
    const scoreA = a.search_volume * (100 - a.difficulty);
    const scoreB = b.search_volume * (100 - b.difficulty);
    return scoreB - scoreA;
  });

  // Step 4: Timeline Planning Allocation
  // CADENCE: 3 times a week (Mondays, Wednesdays, Fridays) starting tomorrow
  const calendarRoadmap = [];
  let currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + 1); // Start scheduling from tomorrow

  calendarPool.forEach(item => {
    // Traverse forward to locate the next Monday (1), Wednesday (3), or Friday (5)
    while (true) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
        break;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    calendarRoadmap.push({
      release_date: new Date(currentDate).toISOString().split('T')[0],
      keyword: item.keyword,
      content_type: item.content_type,
      cluster_group: item.cluster_group,
      status: "scheduled"
    });

    // Advance 1 day so next item checks future dates
    currentDate.setDate(currentDate.getDate() + 1);
  });

  console.log(`[Calendar Engine] Allocated ${calendarRoadmap.length} items over 30-day timeline.`);
  return calendarRoadmap;
}
