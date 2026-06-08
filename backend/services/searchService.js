/**
 * Helper to simulate fetching live SERP context for a keyword.
 * In a real application, this would call a SERP API (like Google Search API, Serper, Brave, etc.)
 * @param {string} keyword The target search keyword
 * @returns {Promise<string>} JSON string containing mock SERP context
 */
export async function fetchLiveSearchContext(keyword) {
  return JSON.stringify({
    query: keyword,
    results: [
      {
        title: `What is ${keyword} - A Complete Guide`,
        snippet: `Learn everything about ${keyword}, including best practices, top strategies, and how to get started today.`,
        link: `https://example.com/what-is-${keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      },
      {
        title: `Top 10 Tips for ${keyword} in 2026`,
        snippet: `Discover the most effective ${keyword} strategies that are working right now. Optimize your workflow and boost results.`,
        link: `https://example.com/top-10-${keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-tips`
      }
    ]
  });
}
